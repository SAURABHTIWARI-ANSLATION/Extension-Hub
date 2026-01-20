// content.js - Creates REAL sticky notes directly on webpage (NO IFRAMES)

class StickyNoteManager {
    constructor() {
        this.notes = new Map(); // noteId -> {element, data}
        this.currentZIndex = 1000;
        this.dragState = {
            isDragging: false,
            noteId: null,
            offsetX: 0,
            offsetY: 0
        };
        
        this.init();
    }

    init() {
        console.log('Sticky Notes Manager initialized');
        
        // Listen for messages from popup/background
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            return this.handleMessage(message, sendResponse);
        });
        
        // Load existing notes for this page
        this.loadExistingNotes();
        
        // Add Font Awesome for icons
        this.injectFontAwesome();
    }

    injectFontAwesome() {
        // Check if Font Awesome is already loaded
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(link);
        }
    }

    // ===== MESSAGE HANDLER =====
    
    handleMessage(message, sendResponse) {
        switch (message.action) {
            case 'createNote':
                const noteId = this.createNote(message.noteData);
                sendResponse({ success: true, noteId: noteId });
                break;
                
            case 'removeNote':
                this.removeNote(message.noteId);
                sendResponse({ success: true });
                break;
                
            case 'focusNote':
                this.bringToFront(message.noteId);
                sendResponse({ success: true });
                break;
                
            case 'editNote':
                this.focusNoteContent(message.noteId);
                sendResponse({ success: true });
                break;
                
            case 'showAllNotes':
                this.showAllNotes();
                sendResponse({ success: true });
                break;
                
            case 'hideAllNotes':
                this.hideAllNotes();
                sendResponse({ success: true });
                break;
                
            case 'getAllNotes':
                const noteIds = Array.from(this.notes.keys());
                sendResponse({ notes: noteIds });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
        return true; // Keep message channel open for async response
    }

    // ===== NOTE CREATION =====
    
    createNote(noteData) {
        const noteId = noteData.id || `note_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        // Create note element
        const noteElement = this.createNoteElement(noteId, noteData);
        
        // Add to page
        document.body.appendChild(noteElement);
        
        // Store reference
        this.notes.set(noteId, {
            element: noteElement,
            data: {
                ...noteData,
                id: noteId,
                left: noteData.left || 100,
                top: noteData.top || 100,
                width: noteData.width || 320,
                height: noteData.height || 380,
                color: noteData.color || 'yellow',
                pinned: noteData.pinned || false,
                minimized: noteData.minimized || false,
                hidden: noteData.hidden || false,
                locked: noteData.locked || false,
                fontSize: noteData.fontSize || '16',
                content: noteData.content || '',
                createdAt: noteData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        });
        
        // Setup event listeners
        this.setupNoteEvents(noteId, noteElement);
        
        // Bring to front
        this.bringToFront(noteId);
        
        // Save to storage
        this.saveNoteToStorage(noteId);
        
        console.log(`Sticky note created: ${noteId}`);
        return noteId;
    }

    createNoteElement(noteId, noteData) {
        const note = document.createElement('div');
        note.className = 'sticky-note';
        note.id = `sticky-note-${noteId}`;
        note.dataset.noteId = noteId;
        
        // Set position and size
        note.style.left = `${noteData.left || 100}px`;
        note.style.top = `${noteData.top || 100}px`;
        note.style.width = `${noteData.width || 320}px`;
        note.style.height = `${noteData.height || 380}px`;
        note.style.zIndex = this.currentZIndex++;
        
        // Apply initial color
        this.applyNoteColor(note, noteData.color || 'yellow');
        
        // Create note HTML
        note.innerHTML = this.getNoteHTML(noteId, noteData);
        
        return note;
    }

    getNoteHTML(noteId, noteData) {
        const shortId = noteId.slice(-4);
        
        return `
            <!-- Note Header -->
            <div class="note-header" data-draggable="true">
                <div class="header-left">
                    <button class="header-btn pin-btn" title="Pin/Unpin">
                        <i class="fas fa-thumbtack"></i>
                    </button>
                    <button class="header-btn hide-btn" title="Hide/Show">
                        <i class="fas fa-eye-slash"></i>
                    </button>
                    <span class="note-id">Note #${shortId}</span>
                </div>
                <div class="header-right">
                    <button class="header-btn color-btn" title="Change Color">
                        <i class="fas fa-palette"></i>
                    </button>
                    <button class="header-btn format-btn" title="Text Formatting">
                        <i class="fas fa-bold"></i>
                    </button>
                    <button class="header-btn minimize-btn" title="Minimize">
                        <i class="fas fa-window-minimize"></i>
                    </button>
                    <button class="header-btn close-btn" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- Color Picker (Hidden by default) -->
            <div class="color-picker" style="display: none;">
                <div class="color-option yellow active" data-color="yellow" title="Yellow"></div>
                <div class="color-option blue" data-color="blue" title="Blue"></div>
                <div class="color-option green" data-color="green" title="Green"></div>
                <div class="color-option pink" data-color="pink" title="Pink"></div>
                <div class="color-option orange" data-color="orange" title="Orange"></div>
                <div class="color-option purple" data-color="purple" title="Purple"></div>
            </div>

            <!-- Formatting Toolbar (Hidden by default) -->
            <div class="format-toolbar" style="display: none;">
                <button class="format-btn" data-command="bold" title="Bold">
                    <i class="fas fa-bold"></i>
                </button>
                <button class="format-btn" data-command="italic" title="Italic">
                    <i class="fas fa-italic"></i>
                </button>
                <button class="format-btn" data-command="underline" title="Underline">
                    <i class="fas fa-underline"></i>
                </button>
                <div class="toolbar-separator"></div>
                <select class="font-size">
                    <option value="14">Small</option>
                    <option value="16" selected>Normal</option>
                    <option value="18">Large</option>
                    <option value="20">X-Large</option>
                </select>
            </div>

            <!-- Note Content -->
            <div class="note-content" contenteditable="true" placeholder="Start typing...">
                ${noteData.content || ''}
            </div>

            <!-- Note Footer -->
            <div class="note-footer">
                <div class="footer-left">
                    <span class="char-count">0 chars</span>
                    <span class="word-count">0 words</span>
                </div>
                <div class="footer-right">
                    <button class="footer-btn save-btn" title="Save">
                        <i class="fas fa-save"></i>
                    </button>
                    <button class="footer-btn time-btn" title="Insert Time">
                        <i class="fas fa-clock"></i>
                    </button>
                    <button class="footer-btn date-btn" title="Insert Date">
                        <i class="fas fa-calendar"></i>
                    </button>
                    <button class="footer-btn lock-btn" title="Lock/Unlock">
                        <i class="fas fa-lock"></i>
                    </button>
                </div>
            </div>

            <!-- Resize Handle -->
            <div class="resize-handle">
                <i class="fas fa-grip-lines"></i>
            </div>
        `;
    }

    // ===== EVENT SETUP =====
    
    setupNoteEvents(noteId, noteElement) {
        const noteData = this.notes.get(noteId);
        
        // Header dragging
        const header = noteElement.querySelector('.note-header');
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.header-btn')) return;
            this.startDragging(noteId, e);
        });
        
        // Button events
        this.setupButtonEvents(noteId, noteElement);
        
        // Content events
        const content = noteElement.querySelector('.note-content');
        content.addEventListener('input', () => {
            this.updateNoteContent(noteId, content.innerHTML);
            this.updateCounters(noteElement);
        });
        
        // Double click header to minimize
        header.addEventListener('dblclick', () => {
            this.toggleMinimize(noteId);
        });
        
        // Click on note to bring to front
        noteElement.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.header-btn') && !e.target.closest('.footer-btn')) {
                this.bringToFront(noteId);
            }
        });
        
        // Resize handle
        const resizeHandle = noteElement.querySelector('.resize-handle');
        this.setupResizeEvents(noteId, resizeHandle, noteElement);
        
        // Initial counter update
        this.updateCounters(noteElement);
        
        // Set font size
        const fontSizeSelect = noteElement.querySelector('.font-size');
        if (fontSizeSelect) {
            fontSizeSelect.value = noteData.data.fontSize || '16';
            content.style.fontSize = `${noteData.data.fontSize || 16}px`;
        }
    }

    setupButtonEvents(noteId, noteElement) {
        const noteData = this.notes.get(noteId);
        
        // PIN button
        noteElement.querySelector('.pin-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePin(noteId);
        });
        
        // HIDE button
        noteElement.querySelector('.hide-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleHide(noteId);
        });
        
        // MINIMIZE button
        noteElement.querySelector('.minimize-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMinimize(noteId);
        });
        
        // CLOSE button
        noteElement.querySelector('.close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeNote(noteId);
        });
        
        // COLOR button
        const colorBtn = noteElement.querySelector('.color-btn');
        const colorPicker = noteElement.querySelector('.color-picker');
        colorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            colorPicker.style.display = colorPicker.style.display === 'none' ? 'flex' : 'none';
            noteElement.querySelector('.format-toolbar').style.display = 'none';
        });
        
        // Color options
        noteElement.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const color = e.target.dataset.color;
                this.changeNoteColor(noteId, color);
                colorPicker.style.display = 'none';
            });
        });
        
        // FORMAT button
        const formatBtn = noteElement.querySelector('.format-btn');
        const formatToolbar = noteElement.querySelector('.format-toolbar');
        formatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            formatToolbar.style.display = formatToolbar.style.display === 'none' ? 'flex' : 'none';
            colorPicker.style.display = 'none';
        });
        
        // Format buttons
        noteElement.querySelectorAll('.format-btn[data-command]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const command = e.target.closest('.format-btn').dataset.command;
                this.formatNoteText(noteId, command);
            });
        });
        
        // Font size change
        noteElement.querySelector('.font-size').addEventListener('change', (e) => {
            this.changeNoteFontSize(noteId, e.target.value);
        });
        
        // SAVE button
        noteElement.querySelector('.save-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.saveNoteToStorage(noteId);
            this.showSaveFeedback(noteElement.querySelector('.save-btn'));
        });
        
        // TIME button
        noteElement.querySelector('.time-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.insertTime(noteId);
        });
        
        // DATE button
        noteElement.querySelector('.date-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.insertDate(noteId);
        });
        
        // LOCK button
        noteElement.querySelector('.lock-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleLock(noteId);
        });
    }

    setupResizeEvents(noteId, resizeHandle, noteElement) {
        let isResizing = false;
        let startWidth, startHeight, startX, startY;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            isResizing = true;
            startWidth = noteElement.offsetWidth;
            startHeight = noteElement.offsetHeight;
            startX = e.clientX;
            startY = e.clientY;
            
            noteElement.style.cursor = 'nwse-resize';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const newWidth = Math.max(250, startWidth + (e.clientX - startX));
            const newHeight = Math.max(180, startHeight + (e.clientY - startY));
            
            noteElement.style.width = `${newWidth}px`;
            noteElement.style.height = `${newHeight}px`;
            
            this.notes.get(noteId).data.width = newWidth;
            this.notes.get(noteId).data.height = newHeight;
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                noteElement.style.cursor = '';
                document.body.style.userSelect = '';
                this.saveNoteToStorage(noteId);
            }
        });
    }

    // ===== DRAGGING =====
    
    startDragging(noteId, e) {
        const noteElement = document.getElementById(`sticky-note-${noteId}`);
        if (!noteElement) return;
        
        const noteData = this.notes.get(noteId);
        if (noteData.data.locked) return;
        
        this.dragState = {
            isDragging: true,
            noteId: noteId,
            offsetX: e.clientX - noteElement.offsetLeft,
            offsetY: e.clientY - noteElement.offsetTop
        };
        
        noteElement.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        this.bringToFront(noteId);
    }

    handleDocumentMouseMove(e) {
        if (!this.dragState.isDragging || !this.dragState.noteId) return;
        
        const noteElement = document.getElementById(`sticky-note-${this.dragState.noteId}`);
        if (!noteElement) return;
        
        const newX = e.clientX - this.dragState.offsetX;
        const newY = e.clientY - this.dragState.offsetY;
        
        noteElement.style.left = `${newX}px`;
        noteElement.style.top = `${newY}px`;
        
        // Update note data
        const noteData = this.notes.get(this.dragState.noteId);
        noteData.data.left = newX;
        noteData.data.top = newY;
    }

    handleDocumentMouseUp() {
        if (this.dragState.isDragging && this.dragState.noteId) {
            const noteElement = document.getElementById(`sticky-note-${this.dragState.noteId}`);
            if (noteElement) {
                noteElement.style.cursor = '';
            }
            
            // Save position
            this.saveNoteToStorage(this.dragState.noteId);
        }
        
        this.dragState = {
            isDragging: false,
            noteId: null,
            offsetX: 0,
            offsetY: 0
        };
        
        document.body.style.userSelect = '';
    }

    // ===== NOTE FEATURES =====
    
    togglePin(noteId) {
        const noteData = this.notes.get(noteId);
        if (!noteData) return;
        
        noteData.data.pinned = !noteData.data.pinned;
        noteData.element.classList.toggle('pinned', noteData.data.pinned);
        
        const pinBtn = noteData.element.querySelector('.pin-btn');
        pinBtn.classList.toggle('active', noteData.data.pinned);
        
        this.saveNoteToStorage(noteId);
    }

    toggleHide(noteId) {
        const noteData = this.notes.get(noteId);
        if (!noteData) return;
        
        noteData.data.hidden = !noteData.data.hidden;
        noteData.element.classList.toggle('hidden', noteData.data.hidden);
        
        const hideBtn = noteData.element.querySelector('.hide-btn');
        const hideIcon = hideBtn.querySelector('i');
        
        if (noteData.data.hidden) {
            hideIcon.className = 'fas fa-eye';
        } else {
            hideIcon.className = 'fas fa-eye-slash';
        }
        
        hideBtn.classList.toggle('active', noteData.data.hidden);
        this.saveNoteToStorage(noteId);
    }

    toggleMinimize(noteId) {
        const noteData = this.notes.get(noteId);
        if (!noteData) return;
        
        noteData.data.minimized = !noteData.data.minimized;
        noteData.element.classList.toggle('minimized', noteData.data.minimized);
        
        const minimizeBtn = noteData.element.querySelector('.minimize-btn');
        minimizeBtn.classList.toggle('active', noteData.data.minimized);
        
        if (noteData.data.minimized) {
            noteData.element.style.height = '48px';
        } else {
            noteData.element.style.height = `${noteData.data.height}px`;
        }
        
        this.saveNoteToStorage(noteId);
    }

    toggleLock(noteId) {
        const noteData = this.notes.get(noteId);
        if (!noteData) return;
        
        noteData.data.locked = !noteData.data.locked;
        noteData.element.classList.toggle('locked', noteData.data.locked);
        
        const lockBtn = noteData.element.querySelector('.lock-btn');
        const lockIcon = lockBtn.querySelector('i');
        const content = noteData.element.querySelector('.note-content');
        
        if (noteData.data.locked) {
            lockIcon.className = 'fas fa-lock';
            content.contentEditable = false;
        } else {
            lockIcon.className = 'fas fa-lock-open';
            content.contentEditable = true;
        }
        
        lockBtn.classList.toggle('active', noteData.data.locked);
        this.saveNoteToStorage(noteId);
    }

    changeNoteColor(noteId, color) {
        const noteData = this.notes.get(noteId);
        if (!noteData) return;
        
        noteData.data.color = color;
        this.applyNoteColor(noteData.element, color);
        
        // Update active color in picker
        const colorOptions = noteData.element.querySelectorAll('.color-option');
        colorOptions.forEach(opt => {
            opt.classList.remove('active');
            if (opt.dataset.color === color) {
                opt.classList.add('active');
            }
        });
        
        this.saveNoteToStorage(noteId);
    }

    applyNoteColor(noteElement, color) {
        const colorMap = {
            yellow: '#FFF9C4',
            blue: '#E3F2FD',
            green: '#E8F5E9',
            pink: '#FCE4EC',
            orange: '#FFF3E0',
            purple: '#F3E5F5',
            teal: '#E0F2F1',
            gray: '#F5F5F5'
        };
        
        noteElement.style.background = colorMap[color] || '#FFF9C4';
    }

    changeNoteFontSize(noteId, size) {
        const noteData = this.notes.get(noteId);
        if (!noteData) return;
        
        noteData.data.fontSize = size;
        const content = noteData.element.querySelector('.note-content');
        content.style.fontSize = `${size}px`;
        
        this.saveNoteToStorage(noteId);
    }

    formatNoteText(noteId, command) {
        const noteData = this.notes.get(noteId);
        if (!noteData) return;
        
        const content = noteData.element.querySelector('.note-content');
        content.focus();
        document.execCommand(command, false, null);
        
        this.updateNoteContent(noteId, content.innerHTML);
    }

    insertTime(noteId) {
        const noteData = this.notes.get(noteId);
        if (!noteData) return;
        
        const time = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        const content = noteData.element.querySelector('.note-content');
        content.focus();
        document.execCommand('insertText', false, `🕒 ${time} `);
        
        this.updateNoteContent(noteId, content.innerHTML);
    }

    insertDate(noteId) {
        const noteData = this.notes.get(noteId);
        if (!noteData) return;
        
        const date = new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const content = noteData.element.querySelector('.note-content');
        content.focus();
        document.execCommand('insertText', false, `📅 ${date} `);
        
        this.updateNoteContent(noteId, content.innerHTML);
    }

    // ===== UTILITY FUNCTIONS =====
    
    bringToFront(noteId) {
        const noteData = this.notes.get(noteId);
        if (!noteData) return;
        
        noteData.element.style.zIndex = ++this.currentZIndex;
    }

    focusNoteContent(noteId) {
        const noteData = this.notes.get(noteId);
        if (!noteData) return;
        
        this.bringToFront(noteId);
        const content = noteData.element.querySelector('.note-content');
        content.focus();
        
        // Show formatting toolbar
        noteData.element.querySelector('.format-toolbar').style.display = 'flex';
    }

    showAllNotes() {
        this.notes.forEach((noteData, noteId) => {
            noteData.element.classList.remove('hidden');
            noteData.element.style.opacity = '1';
            
            const hideBtn = noteData.element.querySelector('.hide-btn');
            const hideIcon = hideBtn.querySelector('i');
            hideIcon.className = 'fas fa-eye-slash';
            hideBtn.classList.remove('active');
            
            noteData.data.hidden = false;
        });
    }

    hideAllNotes() {
        this.notes.forEach((noteData, noteId) => {
            noteData.element.classList.add('hidden');
            
            const hideBtn = noteData.element.querySelector('.hide-btn');
            const hideIcon = hideBtn.querySelector('i');
            hideIcon.className = 'fas fa-eye';
            hideBtn.classList.add('active');
            
            noteData.data.hidden = true;
        });
    }

    updateNoteContent(noteId, content) {
        const noteData = this.notes.get(noteId);
        if (noteData) {
            noteData.data.content = content;
            noteData.data.updatedAt = new Date().toISOString();
        }
    }

    updateCounters(noteElement) {
        const content = noteElement.querySelector('.note-content');
        const text = content.innerText || '';
        
        const charCount = text.length;
        const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        
        noteElement.querySelector('.char-count').textContent = `${charCount} chars`;
        noteElement.querySelector('.word-count').textContent = `${wordCount} words`;
    }

    showSaveFeedback(saveBtn) {
        const originalHTML = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check"></i>';
        saveBtn.classList.add('active');
        
        setTimeout(() => {
            saveBtn.innerHTML = originalHTML;
            saveBtn.classList.remove('active');
        }, 1000);
    }

    closeNote(noteId) {
        if (!confirm('Close this sticky note?')) return;
        
        const noteData = this.notes.get(noteId);
        if (noteData) {
            // Save before closing
            this.saveNoteToStorage(noteId);
            
            // Remove from page
            noteData.element.remove();
            
            // Remove from storage
            this.removeNoteFromStorage(noteId);
            
            // Remove from local map
            this.notes.delete(noteId);
        }
    }

    removeNote(noteId) {
        const noteData = this.notes.get(noteId);
        if (noteData) {
            noteData.element.remove();
            this.notes.delete(noteId);
        }
    }

    // ===== STORAGE FUNCTIONS =====
    
    saveNoteToStorage(noteId) {
        const noteData = this.notes.get(noteId);
        if (!noteData) return;
        
        const url = window.location.href;
        chrome.storage.local.get(['stickyNotes'], (result) => {
            const allNotes = result.stickyNotes || {};
            const urlKey = this.getUrlKey(url);
            
            if (!allNotes[urlKey]) allNotes[urlKey] = {};
            allNotes[urlKey][noteId] = noteData.data;
            
            chrome.storage.local.set({ stickyNotes: allNotes });
        });
    }

    removeNoteFromStorage(noteId) {
        const url = window.location.href;
        chrome.storage.local.get(['stickyNotes'], (result) => {
            const allNotes = result.stickyNotes || {};
            const urlKey = this.getUrlKey(url);
            
            if (allNotes[urlKey] && allNotes[urlKey][noteId]) {
                delete allNotes[urlKey][noteId];
                
                // Clean up empty URL entries
                if (Object.keys(allNotes[urlKey]).length === 0) {
                    delete allNotes[urlKey];
                }
                
                chrome.storage.local.set({ stickyNotes: allNotes });
            }
        });
    }

    loadExistingNotes() {
        const url = window.location.href;
        chrome.storage.local.get(['stickyNotes'], (result) => {
            const allNotes = result.stickyNotes || {};
            const urlKey = this.getUrlKey(url);
            const pageNotes = allNotes[urlKey] || {};
            
            Object.entries(pageNotes).forEach(([noteId, noteData]) => {
                this.createNote({ ...noteData, id: noteId });
            });
        });
    }

    getUrlKey(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.origin + urlObj.pathname;
        } catch {
            return url;
        }
    }
}

// ===== GLOBAL EVENT LISTENERS =====

document.addEventListener('mousemove', (e) => {
    if (window.stickyNoteManager) {
        window.stickyNoteManager.handleDocumentMouseMove(e);
    }
});

document.addEventListener('mouseup', () => {
    if (window.stickyNoteManager) {
        window.stickyNoteManager.handleDocumentMouseUp();
    }
});

// ===== INITIALIZATION =====

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.stickyNoteManager = new StickyNoteManager();
    });
} else {
    window.stickyNoteManager = new StickyNoteManager();
}