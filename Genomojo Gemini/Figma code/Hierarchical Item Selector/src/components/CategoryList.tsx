import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Category, HierarchyItem } from './data';
import { HierarchyItemComponent } from './HierarchyItemComponent';

interface CategoryListProps {
  data: Category[];
  onToggleSelect: (item: { id: string; label: string; path: string; color?: string }) => void;
  isSelected: (id: string) => boolean;
  canSelectMore: boolean;
}

export function CategoryList({ data, onToggleSelect, isSelected, canSelectMore }: CategoryListProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedL1Item, setExpandedL1Item] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
      setExpandedL1Item(null);
    } else {
      setExpandedCategory(categoryId);
      setExpandedL1Item(null);
    }
  };

  return (
    <div className="divide-y divide-gray-200">
      {data.map((category) => {
        const isExpanded = expandedCategory === category.id;
        
        return (
          <div key={category.id} className="bg-white">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full px-4 py-4 flex items-center justify-between active:bg-gray-50 transition-colors relative"
            >
              {/* Color bar on the left */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${category.color.l0}`} />
              
              <span className="text-gray-900">{category.label}</span>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {/* Category Content */}
            {isExpanded && (
              <div className="bg-gray-50 border-t border-gray-200">
                {category.children.map((item) => (
                  <HierarchyItemComponent
                    key={item.id}
                    item={item}
                    level={1}
                    path={category.label}
                    onToggleSelect={onToggleSelect}
                    isSelected={isSelected}
                    canSelectMore={canSelectMore}
                    expandedChild={expandedL1Item}
                    onExpandChild={setExpandedL1Item}
                    colorScheme={category.color}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
