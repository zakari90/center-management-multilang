# Quick: Clear All LocalDB

## Fastest Way (Console):

1. Open DevTools (F12)
2. Go to Console tab
3. Paste this and press Enter:

```javascript
indexedDB.deleteDatabase('localDb').onsuccess = () => {
  console.log('✅ LocalDB deleted!');
  location.reload();
};
```

That's it. Done.

