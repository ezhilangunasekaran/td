console.log('Loading newtab.js...');

class TopicManager {
    constructor() {
        console.log('Initializing TopicManager...');
        this.addTopicDialog = document.getElementById('addTopicDialog');
        this.addItemDialog = document.getElementById('addItemDialog');
        this.thingsToDoDialog = document.getElementById('thingsToDoDialog');
        this.topicsContainer = document.getElementById('topicsContainer');

        this.setupEventListeners();
        this.loadTopics();
    }

    setupEventListeners() {
        // Add Topic Button
        const addTopicBtn = document.getElementById('addTopicBtn');
        if (addTopicBtn) {
            addTopicBtn.addEventListener('click', () => {
                this.addTopicDialog?.showModal();
            });
        }

        // Things To Do Button
        const thingsToDoBtn = document.getElementById('thingsToDoBtn');
        if (thingsToDoBtn) {
            thingsToDoBtn.addEventListener('click', async () => {
                await this.showThingsToDo();
            });
        }

        // Export Data Button
        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', async () => {
                await StorageManager.exportData();
            });
        }

        // Add Topic Form
        const addTopicForm = document.getElementById('addTopicForm');
        if (addTopicForm) {
            addTopicForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    await this.handleAddTopic();
                } catch (error) {
                    console.error('Failed to add topic:', error);
                    alert('Failed to add topic: ' + error.message);
                }
            });
        }

        // Add Item Form
        const addItemForm = document.getElementById('addItemForm');
        if (addItemForm) {
            addItemForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    await this.handleAddItem();
                } catch (error) {
                    console.error('Failed to add item:', error);
                    alert('Failed to add item: ' + error.message);
                }
            });
        }

        // Handle checkbox changes for items
        this.topicsContainer.addEventListener('change', async (e) => {
            if (e.target.type === 'checkbox') {
                const itemId = e.target.dataset.itemId;
                const topicId = e.target.dataset.topicId;
                if (itemId && topicId) {
                    await StorageManager.updateItem(topicId, itemId, {
                        checked: e.target.checked
                    });
                }
            }
        });

        // Import Data Input
        const importDataInput = document.getElementById('importDataInput');
        if (importDataInput) {
            importDataInput.addEventListener('change', async (e) => {
                try {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const topics = await StorageManager.importData(event.target.result);
                            this.renderTopics(topics);
                            alert('Data imported successfully!');
                        } catch (error) {
                            console.error('Failed to import data:', error);
                            alert('Failed to import data: ' + error.message);
                        }
                    };
                    reader.readAsText(file);
                } catch (error) {
                    console.error('Failed to read file:', error);
                    alert('Failed to read file: ' + error.message);
                } finally {
                    // Reset the input so the same file can be selected again
                    importDataInput.value = '';
                }
            });
        }
    }

    async loadTopics() {
        try {
            const topics = await StorageManager.getTopics();
            this.renderTopics(topics);
        } catch (error) {
            console.error('Failed to load topics:', error);
            this.topicsContainer.innerHTML = '<p class="error">Failed to load topics. Please refresh the page.</p>';
        }
    }

    async handleAddTopic() {
        const nameInput = document.getElementById('topicName');
        const colorInput = document.getElementById('topicColor');

        const name = nameInput.value.trim();
        if (!name) {
            throw new Error('Topic name is required');
        }

        const topic = {
            name: name,
            color: colorInput.value
        };

        const topics = await StorageManager.saveTopic(topic);
        this.renderTopics(topics);
        this.addTopicDialog.close();
        nameInput.value = '';
        colorInput.value = '#4A90E2';
    }

    async handleAddItem() {
        const topicId = document.getElementById('topicId').value;
        const nameInput = document.getElementById('itemName');
        const urlInput = document.getElementById('itemUrl');
        const deadlineInput = document.getElementById('itemDeadline');
        const notesInput = document.getElementById('itemNotes');

        const name = nameInput.value.trim();
        const url = urlInput.value.trim();

        if (!name) {
            throw new Error('Item name is required');
        }


        const item = {
            name,
            url,  // URL is optional now
            deadline: deadlineInput.value || null,
            notes: notesInput.value || ''
        };

        const topics = await StorageManager.addItem(topicId, item);
        this.renderTopics(topics);
        this.addItemDialog.close();

        // Reset form
        nameInput.value = '';
        urlInput.value = '';
        deadlineInput.value = '';
        notesInput.value = '';
    }

    async showThingsToDo() {
        const checkedItems = await StorageManager.getCheckedItems();
        const listContainer = document.getElementById('checkedItemsList');

        if (checkedItems.length === 0) {
            listContainer.innerHTML = '<p class="empty-state">No items checked yet.</p>';
        } else {
            listContainer.innerHTML = checkedItems.map(item => `
                <div class="link-item">
                    <div class="item-details">
                        <span class="topic-label">${this.escapeHtml(item.topicName)}</span>
                        <a href="${this.escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
                            ${this.escapeHtml(item.name)}
                        </a>
                        ${item.deadline ? `<span class="item-deadline">Deadline: ${item.deadline}</span>` : ''}
                    </div>
                </div>
            `).join('');
        }

        this.thingsToDoDialog.showModal();
    }

    async handleDeleteTopic(topicId) {
        if (confirm('Are you sure you want to delete this topic?')) {
            try {
                const topics = await StorageManager.deleteTopic(topicId);
                this.renderTopics(topics);
            } catch (error) {
                console.error('Failed to delete topic:', error);
                alert('Failed to delete topic: ' + error.message);
            }
        }
    }

    async handleDeleteItem(topicId, itemId) {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                const topics = await StorageManager.deleteItem(topicId, itemId);
                this.renderTopics(topics);
            } catch (error) {
                console.error('Failed to delete item:', error);
                alert('Failed to delete item: ' + error.message);
            }
        }
    }

    showAddItemDialog(topicId) {
        document.getElementById('topicId').value = topicId;
        this.addItemDialog.showModal();
    }

    createTopicCard(topic) {
        return `
            <div class="topic-card">
                <div class="topic-header" style="border-color: ${topic.color}">
                    <h3 class="topic-title">${this.escapeHtml(topic.name)}</h3>
                    <div class="topic-actions">
                        <button class="btn primary add-link-btn" data-topic-id="${topic.id}">Add Item</button>
                        <button class="delete-btn delete-topic-btn" data-topic-id="${topic.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="topic-items">
                    ${topic.items.length === 0
                        ? '<p class="empty-state">No items yet. Click "Add Item" to add one.</p>'
                        : topic.items.map(item => this.createLinkItem(topic.id, item)).join('')}
                </div>
            </div>
        `;
    }

    createLinkItem(topicId, item) {
        return `
            <div class="link-item">
                <div class="checkbox-wrapper">
                    <input type="checkbox"
                           id="item-${item.id}"
                           ${item.checked ? 'checked' : ''}
                           data-item-id="${item.id}"
                           data-topic-id="${topicId}">
                </div>
                <div class="item-details">
                    ${item.url ?
                        `<a href="${this.escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
                            ${this.escapeHtml(item.name)}
                        </a>` :
                        `<span>${this.escapeHtml(item.name)}</span>`
                    }
                    ${item.deadline ? `<span class="item-deadline">Deadline: ${item.deadline}</span>` : ''}
                </div>
                <button class="delete-btn delete-item-btn" data-topic-id="${topicId}" data-item-id="${item.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
    }

    renderTopics(topics) {
        this.topicsContainer.innerHTML = topics.length === 0
            ? '<p class="empty-state">No topics yet. Click "Add Topic" to get started.</p>'
            : topics.map(topic => this.createTopicCard(topic)).join('');

        // Set up click handlers for add link and delete buttons
        const addLinkButtons = document.querySelectorAll('.add-link-btn');
        addLinkButtons.forEach(button => {
            button.onclick = () => this.showAddItemDialog(button.dataset.topicId);
        });

        const deleteTopicButtons = document.querySelectorAll('.delete-topic-btn');
        deleteTopicButtons.forEach(button => {
            button.onclick = () => this.handleDeleteTopic(button.dataset.topicId);
        });

        const deleteItemButtons = document.querySelectorAll('.delete-item-btn');
        deleteItemButtons.forEach(button => {
            button.onclick = () => this.handleDeleteItem(button.dataset.topicId, button.dataset.itemId);
        });
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize TopicManager only after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing TopicManager');
    window.topicManager = new TopicManager();
});