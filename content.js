// Create and inject the floating add button
function createFloatingButton() {
    const button = document.createElement('button');
    button.id = 'topic-add-button';
    button.innerHTML = `
        <span>Add</span>
        <div class="add-dialog" id="addDialog">
            <form id="quickAddForm">
                <input type="text" id="quickItemName" placeholder="Title" required>
                <input type="url" id="quickItemUrl" readonly>
                <select id="quickTopicSelect" required>
                    <option value="">Choose a topic...</option>
                </select>
                <button type="submit">Add to Topic</button>
            </form>
        </div>
    `;
    document.body.appendChild(button);

    // Style the button and dialog
    const style = document.createElement('style');
    style.textContent = `
        #topic-add-button {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: var(--primary-color, #4A90E2);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
        }

        #topic-add-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .add-dialog {
            display: none;
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 8px;
            background: white;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 16px;
            width: 300px;
        }

        #topic-add-button:focus .add-dialog,
        #topic-add-button:active .add-dialog,
        #topic-add-button.active .add-dialog {
            display: block;
        }

        .add-dialog form {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .add-dialog input,
        .add-dialog select,
        .add-dialog button {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }

        .add-dialog button {
            background: var(--primary-color, #4A90E2);
            color: white;
            border: none;
            cursor: pointer;
        }

        .add-dialog button:hover {
            opacity: 0.9;
        }

        .topic-toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-in 2.7s forwards;
            z-index: 10001;
        }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Handle button click and form submission
function setupButtonBehavior() {
    const button = document.getElementById('topic-add-button');
    const form = document.getElementById('quickAddForm');

    // Toggle dialog
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        button.classList.toggle('active');

        if (button.classList.contains('active')) {
            // Pre-fill the form with current page info
            document.getElementById('quickItemName').value = document.title;
            document.getElementById('quickItemUrl').value = window.location.href;

            // Load topics
            chrome.runtime.sendMessage({ type: 'getTopics' }, (response) => {
                const select = document.getElementById('quickTopicSelect');
                select.innerHTML = '<option value="">Choose a topic...</option>';

                response.topics.forEach(topic => {
                    const option = document.createElement('option');
                    option.value = topic.id;
                    option.textContent = topic.name;
                    select.appendChild(option);
                });
            });
        }
    });

    // Close dialog when clicking outside
    document.addEventListener('click', (e) => {
        if (!button.contains(e.target)) {
            button.classList.remove('active');
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const data = {
            type: 'addItem',
            topicId: document.getElementById('quickTopicSelect').value,
            item: {
                name: document.getElementById('quickItemName').value,
                url: document.getElementById('quickItemUrl').value
            }
        };

        chrome.runtime.sendMessage(data, (response) => {
            if (response.success) {
                button.classList.remove('active');
                // Show success message
                const toast = document.createElement('div');
                toast.className = 'topic-toast';
                toast.textContent = 'Added successfully!';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
            } else {
                alert('Failed to add item: ' + response.error);
            }
        });
    });
}

// Initialize
createFloatingButton();
setupButtonBehavior();