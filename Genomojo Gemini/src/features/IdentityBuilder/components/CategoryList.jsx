import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { HierarchyItemComponent } from './HierarchyItemComponent';

export function CategoryList({ data, onToggleSelect, isSelected, canSelectMore }) {
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [expandedL1Item, setExpandedL1Item] = useState(null);

    const toggleCategory = (categoryId) => {
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

                            <span className="text-gray-900 font-medium text-lg">{category.label}</span>
                            {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                        </button>

                        {/* Category Content */}
                        {isExpanded && (
                            <div className="bg-gray-50 border-t border-gray-200">
                                {category.children && category.children.map((item) => (
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
                                {(!category.children || category.children.length === 0) && (
                                    <div className="p-4 text-gray-400 italic text-sm">No items in this category.</div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
