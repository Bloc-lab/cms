import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

interface MediaItem {
  id: string;
  path: string;
  url: string | null;
  alt_text: string | null;
}

interface MediaPickerProps {
  onSelect: (item: MediaItem) => void;
  onClose: () => void;
}

export default function MediaPicker({ onSelect, onClose }: MediaPickerProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ media: MediaItem[] }>('/api/v1/admin/media')
      .then((data) => setMedia(data.media))
      .catch(() => setMedia([]))
      .finally(() => setLoading(false));
  }, []);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
  const baseUrl = supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/media` : '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg border border-gray-200 shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-gray-50/80">
          <h3 className="text-sm font-semibold text-gray-900">Vybrat z knihovny</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100"
            aria-label="Zavřít"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          {loading ? (
            <p className="text-sm text-gray-500 py-8 text-center">Načítání…</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {media.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => onSelect({ ...m, url: m.url ?? (baseUrl ? `${baseUrl}/${m.path}` : null) })}
                  className="aspect-square rounded-md overflow-hidden border border-gray-200 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <img
                    src={m.url ?? (baseUrl ? `${baseUrl}/${m.path}` : '')}
                    alt={m.alt_text ?? ''}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
