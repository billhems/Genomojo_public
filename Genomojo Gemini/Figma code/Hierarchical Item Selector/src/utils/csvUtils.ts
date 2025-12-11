import { loadItemsFromStorage } from './hierarchyUtils';

// Download the current list as CSV
export function downloadSampleCSV() {
  const items = loadItemsFromStorage();
  if (!items || items.length === 0) {
    alert('No items to export. Please create or import items first.');
    return;
  }

  const rows: string[] = [
    'ID,Parent ID,Label,canSelect,canExpand',
    ...items.map(item => 
      `${item.id},${item.parentId},${item.label},${item.canSelect},${item.canExpand}`
    )
  ];

  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hierarchy-list-sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}
