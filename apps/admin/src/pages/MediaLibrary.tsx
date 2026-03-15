import { useEffect, useState, useRef } from 'react';
import { apiGet } from '../lib/api';

interface MediaItem {
  id: string;
  path: string;
  url: string | null;
  alt_text: string | null;
  metadata: { originalName?: string };
  created_at: string;
}

export default function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { data: { session } } = await import('../lib/supabase').then((m) => m.supabase.auth.getSession());
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/v1/admin/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await loadMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při nahrávání');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
  const baseUrl = supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/media` : '';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Knihovna médií</h1>
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Nahrávání...' : '+ Nahrát obrázek'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p>Načítání...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {media.map((m) => (
            <div key={m.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-square">
                <img
                  src={m.url ?? (baseUrl ? `${baseUrl}/${m.path}` : '')}
                  alt={m.alt_text ?? m.metadata?.originalName ?? ''}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2 text-xs text-gray-600 truncate">
                {m.metadata?.originalName ?? m.path}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
