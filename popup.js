class PopupManager {
    constructor() {
        this.form = document.getElementById('addToTopicForm');
        this.titleInput = document.getElementById('itemName');
        this.urlInput = document.getElementById('itemUrl');
        this.topicSelect = document.getElementById('topicSelect');
        this.successMessage = document.getElementById('successMessage');
        
        this.setupEventListeners();
        this.loadTopicsAndCurrentTab();
    }

    async loadTopicsAndCurrentTab() {
        try {
            // Load topics
            const topics = await StorageManager.getTopics();
            this.populateTopicSelect(topics);

            // Get current tab info
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                this.titleInput.value = tab.title || '';
                this.urlInput.value = tab.url || '';
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    populateTopicSelect(topics) {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Choose a topic...';
        this.topicSelect.innerHTML = '';
        this.topicSelect.appendChild(defaultOption);

        topics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic.id;
            option.textContent = topic.name;
            this.topicSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const topicId = this.topicSelect.value;
                const item = {
                    name: this.titleInput.value.trim(),
                    url: this.urlInput.value.trim()
                };

                if (!topicId) {
                    throw new Error('Please select a topic');
                }

                await StorageManager.addItem(topicId, item);
                
                // Show success message
                this.successMessage.style.display = 'block';
                
                // Close popup after short delay
                setTimeout(() => {
                    window.close();
                }, 1500);
            } catch (error) {
                console.error('Error adding item:', error);
                alert('Failed to add item: ' + error.message);
            }
        });

        // Allow editing the title
        this.titleInput.addEventListener('input', (e) => {
            // Add any validation if needed
        });
    }
}

// Initialize PopupManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
