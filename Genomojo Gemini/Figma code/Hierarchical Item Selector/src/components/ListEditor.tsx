import { useState, useEffect } from 'react';
import { Download, Upload, Plus, Trash2, Edit2, Save, X, FileDown } from 'lucide-react';
import { downloadSampleCSV } from '../utils/csvUtils';
import { FlatItem, loadItemsFromStorage, saveItemsToStorage } from '../utils/hierarchyUtils';

interface ListItem {
  id: string;
  parentId: string;
  label: string;
  canSelect: boolean;
  canExpand: boolean;
}

interface ListEditorProps {
  onClose: () => void;
}

export function ListEditor({ onClose }: ListEditorProps) {
  const [items, setItems] = useState<ListItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ListItem | null>(null);

  // Load items from localStorage on mount
  useEffect(() => {
    const stored = loadItemsFromStorage();
    if (stored) {
      setItems(stored);
    }
  }, []);

  // Save items to localStorage whenever they change
  useEffect(() => {
    if (items.length > 0) {
      saveItemsToStorage(items);
    }
  }, [items]);

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      const parsedItems: ListItem[] = dataLines.map(line => {
        const [id, parentId, label, canSelect, canExpand] = line.split(',').map(s => s.trim());
        return {
          id,
          parentId: parentId || '',
          label,
          canSelect: canSelect.toLowerCase() === 'true',
          canExpand: canExpand.toLowerCase() === 'true',
        };
      });
      
      setItems(parsedItems);
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportCSV = () => {
    const csv = [
      'ID,Parent ID,Label,canSelect,canExpand',
      ...items.map(item => 
        `${item.id},${item.parentId},${item.label},${item.canSelect},${item.canExpand}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hierarchy-list.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddItem = () => {
    const newItem: ListItem = {
      id: `new-${Date.now()}`,
      parentId: '',
      label: 'New Item',
      canSelect: true,
      canExpand: false,
    };
    setItems([...items, newItem]);
    setEditingId(newItem.id);
    setEditForm(newItem);
  };

  const handleAddChild = (parentItem: ListItem) => {
    const newItem: ListItem = {
      id: `new-${Date.now()}`,
      parentId: parentItem.id,
      label: 'New Child Item',
      canSelect: true,
      canExpand: false,
    };
    setItems([...items, newItem]);
    setEditingId(newItem.id);
    setEditForm(newItem);
  };

  const handleEditItem = (item: ListItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSaveEdit = () => {
    if (!editForm || !editingId) return;
    
    setItems(items.map(item => 
      item.id === editingId ? editForm : item
    ));
    setEditingId(null);
    setEditForm(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item and all its children?')) {
      const deleteIds = new Set([id]);
      
      // Find all descendants
      let foundMore = true;
      while (foundMore) {
        foundMore = false;
        items.forEach(item => {
          if (deleteIds.has(item.parentId) && !deleteIds.has(item.id)) {
            deleteIds.add(item.id);
            foundMore = true;
          }
        });
      }
      
      setItems(items.filter(item => !deleteIds.has(item.id)));
    }
  };

  const getItemLevel = (item: ListItem): number => {
    let level = 0;
    let currentParentId = item.parentId;
    
    while (currentParentId) {
      level++;
      const parent = items.find(i => i.id === currentParentId);
      currentParentId = parent?.parentId || '';
    }
    
    return level;
  };

  const sortedItems = [...items].sort((a, b) => {
    const getPath = (item: ListItem): string[] => {
      const path: string[] = [];
      let current = item;
      
      while (current) {
        path.unshift(current.id);
        const parent = items.find(i => i.id === current.parentId);
        if (!parent) break;
        current = parent;
      }
      
      return path;
    };
    
    const pathA = getPath(a);
    const pathB = getPath(b);
    
    for (let i = 0; i < Math.min(pathA.length, pathB.length); i++) {
      if (pathA[i] !== pathB[i]) {
        return pathA[i].localeCompare(pathB[i]);
      }
    }
    
    return pathA.length - pathB.length;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1>Edit Hierarchy List</h1>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 active:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-4">Import, edit, and export your hierarchy list</p>
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 active:bg-blue-800 transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm">Import CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </label>
            
            <button
              onClick={handleExportCSV}
              disabled={items.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export CSV</span>
            </button>
            
            <button
              onClick={downloadSampleCSV}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 active:bg-amber-800 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span className="text-sm">Download Sample</span>
            </button>
            
            <button
              onClick={handleAddItem}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="p-4">
        {items.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No items yet. Import a CSV file or add items manually.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200 text-sm text-gray-600">
              <div className="col-span-2">ID</div>
              <div className="col-span-2">Parent ID</div>
              <div className="col-span-2">Label</div>
              <div className="col-span-1 text-center">Level</div>
              <div className="col-span-1 text-center">Select</div>
              <div className="col-span-1 text-center">Expand</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
            
            {/* Table Rows */}
            {sortedItems.map((item) => {
              const level = getItemLevel(item);
              const isEditing = editingId === item.id;
              
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 items-center"
                  style={{ paddingLeft: `${1 + level * 1}rem` }}
                >
                  {isEditing && editForm ? (
                    <>
                      <input
                        type="text"
                        value={editForm.id}
                        onChange={(e) => setEditForm({ ...editForm, id: e.target.value })}
                        className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={editForm.parentId}
                        onChange={(e) => setEditForm({ ...editForm, parentId: e.target.value })}
                        className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="(root)"
                      />
                      <input
                        type="text"
                        value={editForm.label}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <div className="col-span-1 text-center text-sm text-gray-500">
                        L{level}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="checkbox"
                          checked={editForm.canSelect}
                          onChange={(e) => setEditForm({ ...editForm, canSelect: e.target.checked })}
                          className="w-4 h-4"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="checkbox"
                          checked={editForm.canExpand}
                          onChange={(e) => setEditForm({ ...editForm, canExpand: e.target.checked })}
                          className="w-4 h-4"
                        />
                      </div>
                      <div className="col-span-3 flex gap-2 justify-end">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2 text-sm text-gray-600 truncate">{item.id}</div>
                      <div className="col-span-2 text-sm text-gray-500 truncate">{item.parentId || '(root)'}</div>
                      <div className="col-span-2 text-sm truncate">{item.label}</div>
                      <div className="col-span-1 text-center text-sm text-gray-500">L{level}</div>
                      <div className="col-span-1 text-center text-sm">{item.canSelect ? '✓' : '—'}</div>
                      <div className="col-span-1 text-center text-sm">{item.canExpand ? '✓' : '—'}</div>
                      <div className="col-span-3 flex gap-2 justify-end">
                        {level < 3 && (
                          <button
                            onClick={() => handleAddChild(item)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Add child"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
