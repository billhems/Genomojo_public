// Color schemes for L0 categories (first 4 in order)
const colorSchemes = [
    {
        l0: 'bg-violet-600',
        l1: 'bg-violet-400',
        l2: 'bg-violet-200',
        l3: 'bg-violet-100',
    },
    {
        l0: 'bg-blue-600',
        l1: 'bg-blue-400',
        l2: 'bg-blue-200',
        l3: 'bg-blue-100',
    },
    {
        l0: 'bg-emerald-600',
        l1: 'bg-emerald-400',
        l2: 'bg-emerald-200',
        l3: 'bg-emerald-100',
    },
    {
        l0: 'bg-orange-600',
        l1: 'bg-orange-400',
        l2: 'bg-orange-200',
        l3: 'bg-orange-100',
    },
];

// Convert flat items to hierarchical structure
export function flatToHierarchical(flatItems) {
    if (!flatItems) return [];

    // Find all L0 items (those with no parentId)
    const l0Items = flatItems.filter(item => !item.parentId);

    // Build hierarchy recursively
    const buildChildren = (parentId) => {
        const children = flatItems.filter(item => item.parentId === parentId);
        return children.map(child => ({
            id: child.id,
            label: child.label,
            canSelect: child.isSelectable, // Map Firestore 'isSelectable' to UI 'canSelect'
            canExpand: child.hasChildren,  // Map Firestore 'hasChildren' to UI 'canExpand'
            children: child.hasChildren ? buildChildren(child.id) : undefined,
        }));
    };

    // Convert L0 items to Categories
    return l0Items.map((item, index) => ({
        id: item.id,
        label: item.label,
        canSelect: item.isSelectable, // Map Firestore 'isSelectable'
        canExpand: item.hasChildren,  // Map Firestore 'hasChildren'
        color: colorSchemes[index % colorSchemes.length], // Assign color scheme
        children: buildChildren(item.id),
    }));
}

// Convert hierarchical structure to flat items (if needed for saving back)
export function hierarchicalToFlat(categories) {
    const flatItems = [];

    const processChildren = (children, parentId) => {
        children.forEach(child => {
            flatItems.push({
                id: child.id,
                parentId: parentId,
                label: child.label,
                canSelect: child.canSelect,
                canExpand: child.canExpand,
            });

            if (child.children && child.children.length > 0) {
                processChildren(child.children, child.id);
            }
        });
    };

    categories.forEach(category => {
        // Add L0 category
        flatItems.push({
            id: category.id,
            parentId: '',
            label: category.label,
            canSelect: false,
            canExpand: true,
        });

        // Add its children
        if (category.children && category.children.length > 0) {
            processChildren(category.children, category.id);
        }
    });

    return flatItems;
}
