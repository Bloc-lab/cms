import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import multipart from '@fastify/multipart';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../../lib/supabase.js';

const BUCKET = 'media';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_WIDTH = 1920;
const THUMB_WIDTH = 300;
const ALLOWED_MIMETYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

export async function adminMediaRoutes(app: FastifyInstance) {
  app.get('/api/v1/admin/media', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId;
    if (!tenantId || !supabaseAdmin) {
      return reply.status(500).send({ error: 'Server error' });
    }

    const { data, error } = await supabaseAdmin
      .from('media')
      .select('id, path, alt_text, metadata, created_at')
      .eq('tenant_id', tenantId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      request.log.error({ err: error }, 'Failed to list media');
      return reply.status(500).send({ error: 'Failed to list media' });
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? '';
    const baseUrl = supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/media` : '';
    const items = (data ?? []).map((m: Record<string, unknown>) => ({
      ...m,
      url: baseUrl ? `${baseUrl}/${m.path}` : null,
    }));

    return reply.send({ media: items });
  });

  await app.register(multipart, {
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 1,
    },
  });

  app.post('/api/v1/admin/media/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId;
    if (!tenantId) {
      return reply.status(500).send({ error: 'Tenant not resolved' });
    }

    if (!supabaseAdmin) {
      return reply.status(500).send({ error: 'Server misconfiguration' });
    }

    try {
      const parts = request.parts();
      let buffer: Buffer | null = null;
      let mimeType = '';
      let originalName = 'image';
      let altText: string | null = null;

      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'file') {
          buffer = await part.toBuffer();
          mimeType = part.mimetype ?? '';
          originalName = part.filename ?? 'image';
        } else if (part.type === 'field' && part.fieldname === 'alt_text') {
          const value = await part.value;
          altText = (typeof value === 'string' ? value : String(value)).trim() || null;
        }
      }

      if (!buffer) {
        return reply.status(400).send({ error: 'No file uploaded. Use multipart form with field "file".' });
      }

      if (!ALLOWED_MIMETYPES.has(mimeType)) {
        return reply.status(400).send({
          error: 'Invalid file type. Allowed: JPEG, PNG, WebP, AVIF.',
        });
      }

      if (buffer.length > MAX_FILE_SIZE) {
        return reply.status(400).send({
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
        });
      }
      const fileId = randomUUID();
      const mainPath = `${tenantId}/${fileId}.webp`;
      const thumbPath = `${tenantId}/thumbs/${fileId}.webp`;

      let pipeline = sharp(buffer);
      const metadata = await pipeline.metadata();
      const width = metadata.width ?? 0;

      pipeline = pipeline.webp({ quality: 85 });
      if (width > MAX_WIDTH) {
        pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
      }

      const mainBuffer = await pipeline.toBuffer();
      const mainSize = mainBuffer.length;

      const thumbBuffer = await sharp(buffer)
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const { error: uploadMainError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(mainPath, mainBuffer, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (uploadMainError) {
        request.log.error({ err: uploadMainError }, 'Failed to upload main image');
        return reply.status(500).send({ error: 'Failed to upload file' });
      }

      const { error: uploadThumbError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(thumbPath, thumbBuffer, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (uploadThumbError) {
        request.log.error({ err: uploadThumbError }, 'Failed to upload thumbnail');
        await supabaseAdmin.storage.from(BUCKET).remove([mainPath]);
        return reply.status(500).send({ error: 'Failed to upload thumbnail' });
      }

      const mediaMetadata = {
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        size: mainSize,
        originalName,
      };

      const { data: mediaRow, error: dbError } = await supabaseAdmin
        .from('media')
        .insert({
          tenant_id: tenantId,
          path: mainPath,
          alt_text: altText || null,
          metadata: mediaMetadata,
        })
        .select('id, path, alt_text, metadata, created_at')
        .single();

      if (dbError) {
        request.log.error({ err: dbError }, 'Failed to save media record');
        await supabaseAdmin.storage.from(BUCKET).remove([mainPath, thumbPath]);
        return reply.status(500).send({ error: 'Failed to save media record' });
      }

      return reply.status(201).send({
        id: mediaRow.id,
        path: mediaRow.path,
        alt_text: mediaRow.alt_text,
        metadata: mediaRow.metadata,
        created_at: mediaRow.created_at,
        thumbnailPath: thumbPath,
      });
    } catch (err) {
      request.log.error({ err }, 'Media upload error');
      return reply.status(500).send({ error: 'Upload failed' });
    }
  });
}
