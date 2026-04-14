import { useEffect } from 'react';

export default function Toast({
  message,
  show,
  kind = 'success',
  onClose,
  durationMs = 2200,
}: {
  message: string;
  show: boolean;
  kind?: 'success' | 'error' | 'info';
  onClose: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onClose, durationMs);
    return () => clearTimeout(t);
  }, [show, durationMs, onClose]);

  const colors =
    kind === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : kind === 'error'
        ? 'border-red-200 bg-red-50 text-red-800'
        : 'border-gray-200 bg-white text-gray-800';

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-200 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
      }`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={`rounded-lg border shadow-lg px-4 py-3 text-sm font-medium ${colors}`}>
        <div className="flex items-start gap-3">
          {kind === 'success' ? (
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
          ) : null}
          <div className="min-w-0">{message}</div>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 text-current/60 hover:text-current"
            aria-label="Zavřít"
            title="Zavřít"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

