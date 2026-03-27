import { useEffect, useState, useRef } from 'react';
import { apiGet } from '../lib/api';

interface MediaItem {
  id: string;
  path: string;
  url: string | null;
  alt_text: string | null;
  metadata: {
    originalName?: string;
    size?: number;
    width?: number | null;
    height?: number | null;
  };
  created_at: string;
}

function formatBytes(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function extFromName(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toUpperCase() : 'WEBP';
}

export default function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMedia = async () => {
    try {
      const data = await apiGet<{ media: MediaItem[] }>('/api/v1/admin/media');
      setMedia(data.media);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const clearProgressTimer = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError('');
    setUploadProgress(0);
    clearProgressTimer();
    progressTimer.current = setInterval(() => {
      setUploadProgress((p) => (p >= 92 ? p : p + Math.random() * 12));
    }, 200);

    try {
      const { data: { session } } = await import('../lib/supabase').then((m) => m.supabase.auth.getSession());
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/v1/admin/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === 'string' ? body.error : 'Nahrání selhalo');
      }
      setUploadProgress(100);
      await loadMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při nahrávání');
    } finally {
      clearProgressTimer();
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 800);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      void uploadFile(file);
    }
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
  const baseUrl = supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/media` : '';

  const filtered = media.filter((m) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    const name = (m.metadata?.originalName ?? m.path).toLowerCase();
    return name.includes(q);
  });

  const totalBytes = media.reduce((acc, m) => acc + (m.metadata?.size ?? 0), 0);
  const quotaBytes = 10 * 1024 * 1024 * 1024;
  const usedRatio = Math.min(1, totalBytes / quotaBytes);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Knihovna médií</h1>
          <p className="text-sm text-gray-500 mt-1">
            Formáty: JPEG, PNG, WebP, AVIF (nahrané soubory se optimalizují do WebP).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400 pl-1">Filtr</span>
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Název souboru…"
              className="py-2 text-sm min-w-[160px] max-w-[220px] border-0 bg-transparent focus:outline-none focus:ring-0"
            />
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {uploading ? 'Nahrávání…' : 'Nahrát obrázek'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500 py-12 text-center">Načítání…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {filtered.map((m) => {
            const name = m.metadata?.originalName ?? m.path.split('/').pop() ?? m.path;
            const src = m.url ?? (baseUrl ? `${baseUrl}/${m.path}` : '');
            return (
              <div
                key={m.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden group"
              >
                <div className="aspect-square bg-gray-100">
                  <img
                    src={src}
                    alt={m.alt_text ?? name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2.5 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-900 truncate" title={name}>
                    {name}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {extFromName(name)} · {formatBytes(m.metadata?.size)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={onDrop}
          className="mb-10 rounded-lg border-2 border-dashed border-gray-200 bg-[#fafafa] px-6 py-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
          onClick={() => !uploading && fileInput.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInput.current?.click();
            }
          }}
        >
          <p className="text-sm font-medium text-gray-800">Přetáhněte soubor sem nebo klikněte</p>
          <p className="text-xs text-gray-500 mt-1">Jeden soubor, max. 10 MB</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">
          {filter.trim() ? 'Žádné výsledky pro zadaný filtr.' : 'Zatím žádné soubory.'}
        </p>
      )}

      <div className="mt-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-6 border-t border-gray-200">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Stav knihovny</p>
          <p className="text-sm text-gray-700 mt-1">
            Celkem souborů: <span className="font-medium tabular-nums">{media.length}</span>
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            Odhadované využití: {formatBytes(totalBytes)} / 10 GB
          </p>
          <div className="mt-2 h-2 w-full max-w-xs rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(2, usedRatio * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {uploading && (
        <div className="fixed bottom-6 right-6 z-50 w-72 rounded-lg border border-gray-200 bg-white shadow-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Probíhá nahrávání</p>
          <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, Math.round(uploadProgress))}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 tabular-nums">{Math.min(100, Math.round(uploadProgress))} %</p>
        </div>
      )}
    </div>
  );
}
