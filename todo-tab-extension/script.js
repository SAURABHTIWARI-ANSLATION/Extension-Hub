class TodoApp {
    constructor() {
        this.todos = [];
        this.selectedColor = '#4CAF50';
        this.selectedLabel = 'Work';
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadTodos();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Add todo
        document.getElementById('add-btn').addEventListener('click', () => this.addTodo());
        document.getElementById('todo-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Color selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectColor(
                    e.currentTarget.dataset.color,
                    e.currentTarget.dataset.label
                );
            });
        });

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.currentTarget.dataset.filter);
            });
        });

        // Actions
        document.getElementById('clear-completed').addEventListener('click', () => this.clearCompleted());
        document.getElementById('export-btn').addEventListener('click', () => this.exportTodos());
        document.getElementById('import-btn').addEventListener('click', () => this.showImportModal());
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Import modal
        document.querySelector('.close-modal').addEventListener('click', () => this.hideImportModal());
        document.getElementById('cancel-import').addEventListener('click', () => this.hideImportModal());
        document.getElementById('confirm-import').addEventListener('click', () => this.importTodos());
    }

    selectColor(color, label) {
        this.selectedColor = color;
        this.selectedLabel = label;
        
        // Update UI
        document.getElementById('selected-label').textContent = label;
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === color);
        });
    }

    addTodo() {
        const input = document.getElementById('todo-input');
        const text = input.value.trim();
        
        if (!text) return;

        const todo = {
            id: Date.now().toString(),
            text: text,
            color: this.selectedColor,
            label: this.selectedLabel,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.todos.unshift(todo);
        input.value = '';
        this.saveTodos();
        this.render();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.completedAt = todo.completed ? new Date().toISOString() : null;
            this.saveTodos();
            this.render();
        }
    }

    deleteTodo(id) {
        if (confirm('Delete this task?')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.render();
        }
    }

    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        if (completedCount === 0) return;
        
        if (confirm(`Delete ${completedCount} completed task(s)?`)) {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveTodos();
            this.render();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update UI
        document.querySelectorAll('.filter-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }

    getFilteredTodos() {
        const today = new Date().toDateString();
        
        switch (this.currentFilter) {
            case 'pending':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            case 'today':
                return this.todos.filter(t => 
                    new Date(t.createdAt).toDateString() === today
                );
            default:
                return [...this.todos];
        }
    }

    updateStats() {
        const total = this.todos.length;
        const pending = this.todos.filter(t => !t.completed).length;
        const today = this.todos.filter(t => 
            new Date(t.createdAt).toDateString() === new Date().toDateString()
        ).length;

        document.getElementById('total-count').textContent = total;
        document.getElementById('pending-count').textContent = pending;
        document.getElementById('today-count').textContent = today;
    }

    saveTodos() {
        try {
            localStorage.setItem('todo-tab-data', JSON.stringify(this.todos));
            localStorage.setItem('todo-tab-theme', document.body.getAttribute('data-theme') || 'light');
        } catch (e) {
            console.error('Failed to save data:', e);
        }
    }

    loadTodos() {
        try {
            const saved = localStorage.getItem('todo-tab-data');
            if (saved) {
                this.todos = JSON.parse(saved);
            }
            
            // Load theme
            const theme = localStorage.getItem('todo-tab-theme') || 'light';
            document.body.setAttribute('data-theme', theme);
            
            // Update theme button icon
            const icon = document.querySelector('#theme-toggle i');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        } catch (e) {
            console.error('Failed to load data:', e);
        }
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.setAttribute('data-theme', newTheme);
        
        // Update button icon
        const icon = document.querySelector('#theme-toggle i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        this.saveTodos();
    }

    exportTodos() {
        const data = {
            todos: this.todos,
            exportedAt: new Date().toISOString(),
            app: "Todo Tab"
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `todo-tab-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Tasks exported successfully!');
    }

    showImportModal() {
        document.getElementById('import-modal').style.display = 'flex';
    }

    hideImportModal() {
        document.getElementById('import-modal').style.display = 'none';
        document.getElementById('import-data').value = '';
    }

    importTodos() {
        const data = document.getElementById('import-data').value.trim();
        
        if (!data) {
            alert('Please paste some JSON data');
            return;
        }

        try {
            const parsed = JSON.parse(data);
            
            if (!parsed.todos || !Array.isArray(parsed.todos)) {
                throw new Error('Invalid format');
            }

            // Merge with existing todos
            const newIds = new Set(this.todos.map(t => t.id));
            const importedTodos = parsed.todos.filter(t => !newIds.has(t.id));
            
            this.todos = [...importedTodos, ...this.todos];
            this.saveTodos();
            this.hideImportModal();
            this.render();
            
            alert(`Successfully imported ${importedTodos.length} new tasks!`);
            
        } catch (e) {
            alert('Invalid JSON format. Please check your data.');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    render() {
        const container = document.getElementById('todo-list');
        const filteredTodos = this.getFilteredTodos();

        this.updateStats();

        if (filteredTodos.length === 0) {
            let message = 'No tasks yet';
            let hint = 'Start by adding your first task above';
            
            switch (this.currentFilter) {
                case 'pending': 
                    message = 'No pending tasks';
                    hint = 'All tasks are completed!';
                    break;
                case 'completed': 
                    message = 'No completed tasks';
                    hint = 'Complete some tasks first';
                    break;
                case 'today': 
                    message = 'No tasks added today';
                    hint = 'Add a task for today';
                    break;
            }
            
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <h3>${message}</h3>
                    <p>${hint}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTodos.map(todo => {
            const dateText = this.formatDate(todo.createdAt);
            const completedDate = todo.completedAt ? ` • Completed: ${this.formatDate(todo.completedAt)}` : '';
            
            return `
                <div class="todo-item" style="border-left-color: ${todo.color}">
                    <input type="checkbox" 
                           class="todo-checkbox" 
                           ${todo.completed ? 'checked' : ''}
                           data-id="${todo.id}">
                    
                    <div class="todo-content">
                        <div class="todo-color-indicator" style="background-color: ${todo.color}"></div>
                        <div class="todo-text ${todo.completed ? 'completed' : ''}">
                            ${this.escapeHtml(todo.text)}
                            <div class="todo-date">
                                ${dateText}${completedDate}
                            </div>
                        </div>
                        <div class="todo-label" style="background-color: ${todo.color}20; color: ${todo.color}">
                            ${todo.label}
                        </div>
                    </div>
                    
                    <div class="todo-actions">
                        <button class="todo-action-btn delete-btn" data-id="${todo.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners to dynamically created elements
        document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleTodo(e.target.dataset.id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteTodo(e.currentTarget.dataset.id);
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
let todoApp;
document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
});