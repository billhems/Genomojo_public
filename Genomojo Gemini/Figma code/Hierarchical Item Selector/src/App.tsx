import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { CategoryList } from './components/CategoryList';
import { SelectedItems } from './components/SelectedItems';
import { SelectionIndicator } from './components/SelectionIndicator';
import { ListEditor } from './components/ListEditor';
import { hierarchyData, Category } from './components/data';
import { 
  flatToHierarchical, 
  hierarchicalToFlat, 
  loadItemsFromStorage, 
  saveItemsToStorage,
  hasStoredItems 
} from './utils/hierarchyUtils';

export default function App() {
  const [selectedItems, setSelectedItems] = useState<Array<{
    id: string;
    label: string;
    path: string;
    color?: string;
  }>>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [data, setData] = useState<Category[]>(hierarchyData);

  const MAX_SELECTIONS = 5;

  // Initialize localStorage with default data if empty, then load data
  useEffect(() => {
    if (!hasStoredItems()) {
      // First time - convert hardcoded data to flat structure and save
      const flatData = hierarchicalToFlat(hierarchyData);
      saveItemsToStorage(flatData);
      setData(hierarchyData);
    } else {
      // Load from localStorage and convert to hierarchical
      const flatData = loadItemsFromStorage();
      if (flatData) {
        const hierarchicalData = flatToHierarchical(flatData);
        setData(hierarchicalData);
      }
    }
  }, []);

  // Reload data when returning from editor
  useEffect(() => {
    if (!showEditor) {
      const flatData = loadItemsFromStorage();
      if (flatData) {
        const hierarchicalData = flatToHierarchical(flatData);
        setData(hierarchicalData);
      }
    }
  }, [showEditor]);

  const handleToggleSelect = (item: { id: string; label: string; path: string; color?: string }) => {
    const isCurrentlySelected = selectedItems.some(selected => selected.id === item.id);
    
    if (isCurrentlySelected) {
      // Deselect the item
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else if (selectedItems.length < MAX_SELECTIONS) {
      // Select the item
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleRemove = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const isSelected = (id: string) => {
    return selectedItems.some(item => item.id === id);
  };

  const canSelectMore = selectedItems.length < MAX_SELECTIONS;

  if (showEditor) {
    return <ListEditor onClose={() => setShowEditor(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1>Select Your Interests</h1>
            <button
              onClick={() => setShowEditor(true)}
              className="p-2 text-gray-500 hover:text-gray-700 active:bg-gray-100 rounded-lg transition-colors"
              title="Edit List"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 text-sm">Choose up to 5 items that represent you</p>
          <SelectionIndicator 
            current={selectedItems.length} 
            max={MAX_SELECTIONS} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-24">
        <CategoryList
          data={data}
          onToggleSelect={handleToggleSelect}
          isSelected={isSelected}
          canSelectMore={canSelectMore}
        />
      </div>

      {/* Selected Items Footer */}
      {selectedItems.length > 0 && (
        <SelectedItems
          items={selectedItems}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}
