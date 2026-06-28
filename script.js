/**
 * TaskFlow - Professional Task Management Application
 * @author Eng. Tariq Zeyad
 * @version 2.0.0
 * @description Advanced To-Do application with local storage, filtering, and progress tracking
 */

class TaskManager {
    constructor() {
        // DOM Elements
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        
        // Stats Elements
        this.totalCountSpan = document.getElementById('totalCount');
        this.activeCountSpan = document.getElementById('activeCount');
        this.completedCountSpan = document.getElementById('completedCount');
        this.progressFill = document.getElementById('progressFill');
        
        // State
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.renderUI();
        this.attachEventListeners();
        this.focusInput();
    }
    
    /**
     * Load tasks from localStorage
     */
    loadTasks() {
        try {
            const saved = localStorage.getItem('taskflow_tasks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }
    
    /**
     * Save tasks to localStorage
     */
    saveTasks() {
        try {
            localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }
    
    /**
     * Generate unique ID for tasks
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Add task
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTask();
            }
        });
        
        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                this.setFilter(filter);
            });
        });
        
        // Clear completed
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
    }
    
    /**
     * Add new task
     */
    addTask() {
        const text = this.taskInput.value.trim();
        
        if (!text) {
            this.shakeInput();
            return;
        }
        
        const task = {
            id: this.generateId(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.unshift(task);
        this.taskInput.value = '';
        this.saveTasks();
        this.renderUI();
        this.focusInput();
    }
    
    /**
     * Toggle task completion
     */
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderUI();
        }
    }
    
    /**
     * Delete task
     */
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.renderUI();
    }
    
    /**
     * Clear all completed tasks
     */
    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) return;
        
        if (confirm(`Delete ${completedCount} completed task(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            
            if (this.currentFilter === 'completed') {
                this.currentFilter = 'all';
            }
            
            this.saveTasks();
            this.renderUI();
        }
    }
    
    /**
     * Set active filter
     */
    setFilter(filter) {
        if (this.currentFilter === filter) return;
        this.currentFilter = filter;
        this.renderUI();
    }
    
    /**
     * Get filtered tasks
     */
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }
    
    /**
     * Update statistics
     */
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;
        const progress = total > 0 ? (completed / total) * 100 : 0;
        
        this.totalCountSpan.textContent = total;
        this.activeCountSpan.textContent = active;
        this.completedCountSpan.textContent = completed;
        this.progressFill.style.width = `${progress}%`;
    }
    
    /**
     * Render the complete UI
     */
    renderUI() {
        this.renderTaskList();
        this.updateFilterButtons();
        this.updateStats();
    }
    
    /**
     * Render task list
     */
    renderTaskList() {
        const filteredTasks = this.getFilteredTasks();
        this.taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.hideEmptyState();
        
        filteredTasks.forEach(task => {
            const li = this.createTaskElement(task);
            this.taskList.appendChild(li);
        });
    }
    
    /**
     * Create task element
     */
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', task.id);
        
        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => this.toggleTask(task.id));
        
        // Task text
        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = task.text;
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.title = 'Delete task';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTask(task.id);
        });
        
        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        
        // Double-click to edit (bonus feature)
        li.addEventListener('dblclick', () => this.editTask(task, span));
        
        return li;
    }
    
    /**
     * Edit task text
     */
    editTask(task, spanElement) {
        const currentText = task.text;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'task-input';
        input.style.padding = '0.5rem';
        
        spanElement.replaceWith(input);
        input.focus();
        input.select();
        
        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
                task.text = newText;
                this.saveTasks();
                this.renderUI();
            } else {
                this.renderUI();
            }
        };
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });
    }
    
    /**
     * Update filter button states
     */
    updateFilterButtons() {
        this.filterBtns.forEach(btn => {
            const filter = btn.getAttribute('data-filter');
            btn.classList.toggle('active', filter === this.currentFilter);
        });
    }
    
    /**
     * Show empty state
     */
    showEmptyState() {
        this.emptyState.classList.remove('hidden');
        this.taskList.parentElement.style.display = 'none';
    }
    
    /**
     * Hide empty state
     */
    hideEmptyState() {
        this.emptyState.classList.add('hidden');
        this.taskList.parentElement.style.display = 'block';
    }
    
    /**
     * Shake input on invalid submission
     */
    shakeInput() {
        this.taskInput.style.animation = 'none';
        this.taskInput.offsetHeight; // Trigger reflow
        this.taskInput.style.animation = 'shake 0.5s ease';
        this.taskInput.focus();
    }
    
    /**
     * Focus the input field
     */
    focusInput() {
        this.taskInput.focus();
    }
}

// Add shake animation
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(shakeStyle);

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
    
    console.log('%c🚀 TaskFlow initialized successfully! %cBy Eng. Tariq Zeyad',
        'color: #3498db; font-size: 16px; font-weight: bold;', 'color: #2ecc71; font-size: 14px;');
    });