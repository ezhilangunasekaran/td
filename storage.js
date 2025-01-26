class StorageManager {
    static async getTopics() {
        try {
            console.log('Getting topics from storage...');
            if (typeof chrome !== 'undefined' && chrome.storage) {
                console.log('Using Chrome storage API');
                const result = await chrome.storage.local.get('topics');
                console.log('Retrieved topics:', result.topics || []);
                return result.topics || [];
            }
            console.log('Using mock storage');
            if (!window._mockStorage) {
                window._mockStorage = { topics: [] };
            }
            return window._mockStorage.topics;
        } catch (error) {
            console.error('Error getting topics:', error);
            throw new Error('Failed to get topics: ' + error.message);
        }
    }

    static async saveTopic(topic) {
        try {
            console.log('Saving new topic:', topic);
            const topics = await this.getTopics();
            const newTopic = {
                id: Date.now().toString(),
                name: topic.name,
                color: topic.color,
                items: []
            };
            topics.push(newTopic);

            if (typeof chrome !== 'undefined' && chrome.storage) {
                console.log('Saving to Chrome storage');
                await chrome.storage.local.set({ topics });
            } else {
                console.log('Saving to mock storage');
                window._mockStorage.topics = topics;
            }
            console.log('Topic saved successfully');
            return topics;
        } catch (error) {
            console.error('Error saving topic:', error);
            throw new Error('Failed to save topic: ' + error.message);
        }
    }

    static async addItem(topicId, item) {
        try {
            console.log('Adding item to topic:', topicId, item);
            const topics = await this.getTopics();
            const topic = topics.find(t => t.id === topicId);

            if (!topic) {
                throw new Error('Topic not found');
            }

            // URL is now optional
            if (item.url && !this.isValidUrl(item.url)) {
                throw new Error('Please enter a valid URL or leave it empty');
            }

            const newItem = {
                id: Date.now().toString(),
                name: item.name,
                url: item.url || '',  // Empty string if no URL provided
                checked: false,
                deadline: item.deadline || null,
                notes: item.notes || ''
            };

            topic.items.push(newItem);

            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ topics });
            } else {
                window._mockStorage.topics = topics;
            }
            console.log('Item added successfully');
            return topics;
        } catch (error) {
            console.error('Error adding item:', error);
            throw new Error('Failed to add item: ' + error.message);
        }
    }

    static async updateItem(topicId, itemId, updates) {
        try {
            console.log('Updating item:', itemId, 'in topic:', topicId);
            const topics = await this.getTopics();
            const topic = topics.find(t => t.id === topicId);

            if (!topic) {
                throw new Error('Topic not found');
            }

            const item = topic.items.find(i => i.id === itemId);
            if (!item) {
                throw new Error('Item not found');
            }

            Object.assign(item, updates);

            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ topics });
            } else {
                window._mockStorage.topics = topics;
            }
            console.log('Item updated successfully');
            return topics;
        } catch (error) {
            console.error('Error updating item:', error);
            throw new Error('Failed to update item: ' + error.message);
        }
    }

    static async getCheckedItems() {
        try {
            const topics = await this.getTopics();
            return topics.reduce((checkedItems, topic) => {
                const topicCheckedItems = topic.items
                    .filter(item => item.checked)
                    .map(item => ({
                        ...item,
                        topicId: topic.id,
                        topicName: topic.name
                    }));
                return [...checkedItems, ...topicCheckedItems];
            }, []);
        } catch (error) {
            console.error('Error getting checked items:', error);
            throw new Error('Failed to get checked items: ' + error.message);
        }
    }

    static async exportData() {
        try {
            const topics = await this.getTopics();
            const data = JSON.stringify(topics, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `topic-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            throw new Error('Failed to export data: ' + error.message);
        }
    }

    static async deleteTopic(topicId) {
        try {
            console.log('Deleting topic:', topicId);
            const topics = await this.getTopics();
            const updatedTopics = topics.filter(topic => topic.id !== topicId);

            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ topics: updatedTopics });
            } else {
                window._mockStorage.topics = updatedTopics;
            }
            console.log('Topic deleted successfully');
            return updatedTopics;
        } catch (error) {
            console.error('Error deleting topic:', error);
            throw new Error('Failed to delete topic: ' + error.message);
        }
    }

    static async deleteItem(topicId, itemId) {
        try {
            console.log('Deleting item:', itemId, 'from topic:', topicId);
            const topics = await this.getTopics();
            const topic = topics.find(t => t.id === topicId);

            if (!topic) {
                throw new Error('Topic not found');
            }

            topic.items = topic.items.filter(item => item.id !== itemId);

            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ topics });
            } else {
                window._mockStorage.topics = topics;
            }
            console.log('Item deleted successfully');
            return topics;
        } catch (error) {
            console.error('Error deleting item:', error);
            throw new Error('Failed to delete item: ' + error.message);
        }
    }

    static isValidUrl(url) {
        if (!url) return true;  // Empty URL is valid now
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static async importData(jsonData) {
        try {
            let topics;
            if (typeof jsonData === 'string') {
                topics = JSON.parse(jsonData);
            } else {
                topics = jsonData;
            }

            if (!Array.isArray(topics)) {
                throw new Error('Invalid data format: Expected an array of topics');
            }

            // Validate the structure of each topic
            topics.forEach(topic => {
                if (!topic.name || !topic.color || !Array.isArray(topic.items)) {
                    throw new Error('Invalid topic format: Each topic must have a name, color, and items array');
                }
            });

            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ topics });
            } else {
                window._mockStorage.topics = topics;
            }

            return topics;
        } catch (error) {
            console.error('Error importing data:', error);
            throw new Error('Failed to import data: ' + error.message);
        }
    }
}

// Make StorageManager available globally
window.StorageManager = StorageManager;