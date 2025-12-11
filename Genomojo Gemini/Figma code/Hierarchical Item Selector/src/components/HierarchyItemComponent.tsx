import { useState } from 'react';
import { ChevronDown, ChevronRight, Check, Plus } from 'lucide-react';
import { HierarchyItem } from './data';
import { AddCustomItem } from './AddCustomItem';

interface HierarchyItemComponentProps {
  item: HierarchyItem;
  level: number;
  path: string;
  onToggleSelect: (item: { id: string; label: string; path: string; color?: string }) => void;
  isSelected: (id: string) => boolean;
  canSelectMore: boolean;
  expandedChild?: string | null;
  onExpandChild?: (childId: string | null) => void;
  colorScheme: {
    l0: string;
    l1: string;
    l2: string;
    l3: string;
  };
}

export function HierarchyItemComponent({
  item,
  level,
  path,
  onToggleSelect,
  isSelected,
  canSelectMore,
  expandedChild,
  onExpandChild,
  colorScheme,
}: HierarchyItemComponentProps) {
  const [expandedOwnChild, setExpandedOwnChild] = useState<string | null>(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customItems, setCustomItems] = useState<HierarchyItem[]>([]);
  
  const selected = isSelected(item.id);
  const paddingLeft = `${level * 1}rem`;
  const currentPath = `${path} > ${item.label}`;
  
  const isExpanded = expandedChild === item.id;
  
  // Get the appropriate color based on level
  const getColorForLevel = (lvl: number) => {
    switch (lvl) {
      case 1: return colorScheme.l1;
      case 2: return colorScheme.l2;
      case 3: return colorScheme.l3;
      default: return colorScheme.l1;
    }
  };
  
  const itemColor = getColorForLevel(level);

  const handleToggleExpand = () => {
    if (item.canExpand && onExpandChild) {
      if (isExpanded) {
        onExpandChild(null);
      } else {
        onExpandChild(item.id);
      }
    }
  };

  const handleSelect = () => {
    if (item.canSelect && (selected || canSelectMore)) {
      onToggleSelect({ id: item.id, label: item.label, path: currentPath, color: itemColor });
    }
  };

  const handleAddCustomItem = (label: string) => {
    const newId = `custom-${Date.now()}-${Math.random()}`;
    const newItem: HierarchyItem = {
      id: newId,
      label,
      canSelect: true,
      canExpand: false,
    };
    setCustomItems([...customItems, newItem]);
    setShowAddCustom(false);
    
    // Automatically select the custom item if there's room
    // Custom items at the next level down get the next shade
    const customItemColor = getColorForLevel(level + 1);
    if (canSelectMore) {
      onToggleSelect({ id: newId, label, path: `${currentPath} > ${label}`, color: customItemColor });
    }
  };

  const allChildren = [...(item.children || []), ...customItems];
  const hasChildren = item.canExpand && allChildren.length > 0;
  const canAddCustom = level < 3; // Can add custom items at L1, L2, L3

  return (
    <div>
      {/* Item Row */}
      <div
        className="flex items-center gap-2 py-3 px-4 border-b border-gray-100 bg-white active:bg-gray-50 transition-colors relative"
        style={{ paddingLeft }}
      >
        {/* Color bar on the left */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${itemColor}`} />
        
        {/* Expand/Collapse Button */}
        {item.canExpand ? (
          <button
            onClick={handleToggleExpand}
            className="flex-shrink-0 p-1 -ml-1 touch-manipulation"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-7" />
        )}

        {/* Item Label */}
        <span
          className={`flex-1 ${item.canSelect ? 'cursor-pointer' : 'text-gray-700'}`}
          onClick={handleSelect}
        >
          {item.label}
        </span>

        {/* Select Button/Indicator */}
        {item.canSelect && (
          <button
            onClick={handleSelect}
            disabled={!selected && !canSelectMore}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all touch-manipulation ${
              selected
                ? 'bg-blue-500 border-blue-500'
                : canSelectMore
                ? 'border-gray-300 active:border-blue-400'
                : 'border-gray-200 opacity-50'
            }`}
          >
            {selected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
          </button>
        )}
      </div>

      {/* Expanded Children */}
      {isExpanded && hasChildren && (
        <div className="bg-gray-50">
          {allChildren.map((child) => (
            <HierarchyItemComponent
              key={child.id}
              item={child}
              level={level + 1}
              path={currentPath}
              onToggleSelect={onToggleSelect}
              isSelected={isSelected}
              canSelectMore={canSelectMore}
              expandedChild={expandedOwnChild}
              onExpandChild={setExpandedOwnChild}
              colorScheme={colorScheme}
            />
          ))}
        </div>
      )}

      {/* Add Custom Item Button */}
      {isExpanded && canAddCustom && (
        <div className="bg-gray-50 border-b border-gray-100">
          {!showAddCustom ? (
            <button
              onClick={() => setShowAddCustom(true)}
              className="w-full py-3 px-4 flex items-center gap-2 text-blue-600 active:bg-gray-100 transition-colors"
              style={{ paddingLeft: `${(level + 1) * 1 + 2}rem` }}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add custom item</span>
            </button>
          ) : (
            <div style={{ paddingLeft: `${(level + 1) * 1}rem` }}>
              <AddCustomItem
                onAdd={handleAddCustomItem}
                onCancel={() => setShowAddCustom(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
