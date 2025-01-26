chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);

    if (request.type === 'getTopics') {
        StorageManager.getTopics()
            .then(topics => {
                sendResponse({ topics });
            })
            .catch(error => {
                console.error('Error getting topics:', error);
                sendResponse({ error: error.message });
            });
        return true; // Will respond asynchronously
    }

    if (request.type === 'addItem') {
        StorageManager.addItem(request.topicId, request.item)
            .then(() => {
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error('Error adding item:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Will respond asynchronously
    }
});
