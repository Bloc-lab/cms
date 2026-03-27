#!/usr/bin/env node
/**
 * Stejný hash jako backend (SHA-256 hex) pro sloupec tenants.api_key_hash.
 *
 * Použití:
 *   node scripts/hash-api-key.mjs "muj-tajny-klicek"
 *
 * Pak v Supabase SQL:
 *   UPDATE tenants SET api_key_hash = '<výstup>' WHERE admin_subdomain = 'kadernictvi';
 * A do apps/web-demo/.env stejný plaintext jako VITE_CMS_API_KEY=...
 */
import { createHash } from 'node:crypto';

const key = process.argv[2];
if (!key) {
  console.error('Usage: node scripts/hash-api-key.mjs "<plaintext API key>"');
  process.exit(1);
}
console.log(createHash('sha256').update(key, 'utf8').digest('hex'));
