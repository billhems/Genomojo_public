interface SelectionIndicatorProps {
  current: number;
  max: number;
}

export function SelectionIndicator({ current, max }: SelectionIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, index) => (
          <div
            key={index}
            className={`h-2 w-8 rounded-full transition-all ${
              index < current
                ? 'bg-blue-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">
        {current}/{max}
      </span>
    </div>
  );
}
