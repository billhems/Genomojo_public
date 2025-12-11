import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface AddCustomItemProps {
  onAdd: (label: string) => void;
  onCancel: () => void;
}

export function AddCustomItem({ onAdd, onCancel }: AddCustomItemProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="py-2 px-4 bg-white border-t border-gray-200">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter item name"
          autoFocus
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="p-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-600 transition-colors touch-manipulation"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 bg-gray-200 text-gray-700 rounded-lg active:bg-gray-300 transition-colors touch-manipulation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
