import type React from 'react';

export default function StickyActionBar({
  left,
  right,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-gray-500">{left}</div>
        <div className="flex flex-wrap gap-2 justify-end">{right}</div>
      </div>
    </div>
  );
}

