import { X } from 'lucide-react';

interface SelectedItemsProps {
  items: Array<{ id: string; label: string; path: string; color?: string }>;
  onRemove: (id: string) => void;
}

export function SelectedItems({ items, onRemove }: SelectedItemsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg">
      <div className="px-4 py-3">
        <h3 className="text-sm text-gray-600 mb-2">Selected Items ({items.length})</h3>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${item.color || 'bg-gray-100'} bg-opacity-30 border-current`}
              style={{ 
                borderColor: item.color ? 'currentColor' : undefined 
              }}
            >
              <span className="text-sm text-gray-900">{item.label}</span>
              <button
                onClick={() => onRemove(item.id)}
                className="flex-shrink-0 text-gray-600 hover:text-red-600 active:text-red-700 transition-colors touch-manipulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
