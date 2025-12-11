# Manual Sanitization Instructions

Due to file corruption issues during automated edits, please manually add the following changes:

---

## 1. SubmitScreen.jsx

### Step 1: Add DOMPurify Import
At the top of the file (around line 6), add:
```javascript
import DOMPurify from 'dompurify';
```

### Step 2: Update copyToClipboard Function
Replace the `copyToClipboard` function (around line 14-22) with:
```javascript
const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(shareMessage);
        alert("Share message copied to clipboard!");
    } catch (err) {
        console.error('Could not copy text: ', err);
        alert("Failed to copy. Please manually copy the message: " + shareMessage);
    }
};
```

### Step 3: Update handleSubmit Function
Replace the `handleSubmit` function (around line 107-131) with:
```javascript
const handleSubmit = useCallback(async () => {
    if (!description || description.length > maxChars || isSubmitting) return;

    setIsSubmitting(true);
    try {
        // Sanitize input to prevent XSS attacks
        const sanitizedDescription = DOMPurify.sanitize(description.trim(), {
            ALLOWED_TAGS: [], // Strip all HTML tags
            ALLOWED_ATTR: [] // Strip all attributes
        });

        await addDoc(collection(db, getCollectionPath('mojo_items')), {
            description: sanitizedDescription,
            type: type,
            linkToDemographicID: userId,
            flaggedAsOffensive: false,
            adjudicatedAsOffensive: false,
            datetimeSubmitted: new Date().toISOString(),
        });

        // Reset state and show success
        setDescription('');
        setInsight(null);
        setIsSuccessModalOpen(true);
    } catch (error) {
        console.error("Error submitting item:", error);
        alert("Submission failed. Check your console and Firebase Security Rules.");
    } finally {
        setIsSubmitting(false);
    }
}, [db, userId, description, type, isSubmitting]);
```

---

## 2. IdentityBuilder.jsx

### Step 1: Add DOMPurify Import
At the top of the file (around line 7), add:
```javascript
import DOMPurify from 'dompurify';
```

### Step 2: Update handleAddTrait Function
Find the `handleAddTrait` function (around line 135-165) and update the trait creation part:

Replace:
```javascript
const newTrait = {
    id: newId,
    parentId: currentParentId,
    label: newTraitName.trim(),
    isSelectable: true,
    hasChildren: false,
    color: color,
    createdBy: userId,
    createdAt: new Date().toISOString()
};
```

With:
```javascript
// Sanitize trait name to prevent XSS
const sanitizedName = DOMPurify.sanitize(newTraitName.trim(), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
});

const newTrait = {
    id: newId,
    parentId: currentParentId,
    label: sanitizedName,
    isSelectable: true,
    hasChildren: false,
    color: color,
    createdBy: userId,
    createdAt: new Date().toISOString()
};
```

---

## Verification

After making these changes:
1. Save both files
2. Check that the dev server reloads without errors
3. Test submitting a factor with HTML tags (e.g., `<script>alert('test')</script>`)
4. Verify the HTML is stripped and only plain text is saved

---

## What This Does

- **Prevents XSS Attacks**: DOMPurify strips all HTML tags and attributes from user input
- **Allows Profanity**: Only removes HTML/scripts, doesn't filter content
- **Modern Clipboard API**: Replaces deprecated `document.execCommand`
