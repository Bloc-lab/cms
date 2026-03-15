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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl max-h-[80vh] overflow-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Vybrat z knihovny</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
        {loading ? (
          <p>Načítání...</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {media.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelect({ ...m, url: m.url ?? (baseUrl ? `${baseUrl}/${m.path}` : null) })}
                className="aspect-square rounded overflow-hidden border hover:border-blue-500 focus:border-blue-500"
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
  );
}
