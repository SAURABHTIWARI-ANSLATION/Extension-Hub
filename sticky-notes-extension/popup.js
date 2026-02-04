// popup.js - Simplified Version

document.addEventListener('DOMContentLoaded', function() {
    const newNoteBtn = document.getElementById('newNoteBtn');
    const showAllBtn = document.getElementById('showAllBtn');
    const hideAllBtn = document.getElementById('hideAllBtn');
    const autoSaveCheckbox = document.getElementById('autoSave');
    const startOnBootCheckbox = document.getElementById('startOnBoot');
    
    let currentTabId = null;

    // Initialize
    init();

    function init() {
        // Get current tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                currentTabId = tabs[0].id;
            }
        });
        
        // Load settings
        loadSettings();
        
        // Setup event listeners
        setupEventListeners();
    }

    function setupEventListeners() {
        newNoteBtn.addEventListener('click', createNewNote);
        showAllBtn.addEventListener('click', showAllNotes);
        hideAllBtn.addEventListener('click', hideAllNotes);
        autoSaveCheckbox.addEventListener('change', saveSettings);
        startOnBootCheckbox.addEventListener('change', saveSettings);
    }

    function createNewNote() {
        if (!currentTabId) {
            alert('Please refresh and try again');
            return;
        }

        const noteData = {
            id: `note_${Date.now()}`,
            title: 'New Note',
            content: '',
            color: 'yellow',
            left: 100,
            top: 100,
            width: 320,
            height: 380,
            createdAt: new Date().toISOString()
        };
        
        // Send to content script
        chrome.tabs.sendMessage(currentTabId, {
            action: 'createNote',
            noteData: noteData
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('Note created on page');
            }
        });
        
        // Show feedback
        showButtonFeedback(newNoteBtn, 'Note Added!');
    }

    function showAllNotes() {
        if (!currentTabId) return;
        
        chrome.tabs.sendMessage(currentTabId, {
            action: 'showAllNotes'
        });
        
        showButtonFeedback(showAllBtn, 'Showing All');
    }

    function hideAllNotes() {
        if (!currentTabId) return;
        
        chrome.tabs.sendMessage(currentTabId, {
            action: 'hideAllNotes'
        });
        
        showButtonFeedback(hideAllBtn, 'Hiding All');
    }

    function loadSettings() {
        chrome.storage.local.get(['settings'], (result) => {
            const settings = result.settings || {};
            autoSaveCheckbox.checked = settings.autoSave !== false;
            startOnBootCheckbox.checked = settings.startOnBoot || false;
        });
    }

    function saveSettings() {
        const settings = {
            autoSave: autoSaveCheckbox.checked,
            startOnBoot: startOnBootCheckbox.checked
        };
        
        chrome.storage.local.set({ settings: settings });
    }

    function showButtonFeedback(button, text) {
        const originalHTML = button.innerHTML;
        button.innerHTML = `<i class="fas fa-check"></i> ${text}`;
        button.disabled = true;
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.disabled = false;
        }, 1500);
    }
});