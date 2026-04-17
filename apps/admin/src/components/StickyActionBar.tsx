import type React from 'react';

export default function StickyActionBar({
  left,
  right,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur md:left-[220px]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between md:px-4">
        <div className="text-sm text-gray-500">{left}</div>
        <div className="flex flex-wrap gap-2 justify-end">{right}</div>
      </div>
    </div>
  );
}

