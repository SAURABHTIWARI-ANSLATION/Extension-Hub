document.addEventListener('DOMContentLoaded', function() {
    let snippets = [];
    let currentEditId = null;
    let hasChanges = false;

    const elements = {
        newSnippet: document.getElementById('newSnippet'),
        editorView: document.getElementById('editorView'),
        snippetsList: document.getElementById('snippetsList'),
        noSnippets: document.getElementById('noSnippets'),
        saveSnippet: document.getElementById('saveSnippet'),
        cancelEdit: document.getElementById('cancelEdit'),
        search: document.getElementById('search'),
        filterLanguage: document.getElementById('filterLanguage'),
        snippetTitle: document.getElementById('snippetTitle'),
        snippetLanguage: document.getElementById('snippetLanguage'),
        snippetCode: document.getElementById('snippetCode'),
        createFirstSnippet: document.getElementById('createFirstSnippet'),
        insertToPage: document.getElementById('insertToPage'),
        notification: document.getElementById('notification'),
        exportSnippets: document.getElementById('exportSnippets')
    };

    // Initialize
    loadSnippets();

    // Event Listeners
    elements.newSnippet.addEventListener('click', () => showEditor());
    elements.createFirstSnippet.addEventListener('click', () => showEditor());
    elements.saveSnippet.addEventListener('click', saveSnippet);
    elements.cancelEdit.addEventListener('click', cancelEdit);
    elements.search.addEventListener('input', filterSnippets);
    elements.filterLanguage.addEventListener('change', filterSnippets);
    elements.insertToPage.addEventListener('click', insertToPage);
    if (elements.exportSnippets) elements.exportSnippets.addEventListener('click', exportSnippets);

    // Track changes for better UX
    elements.snippetTitle.addEventListener('input', () => { hasChanges = true; });
    elements.snippetCode.addEventListener('input', () => { hasChanges = true; });
    elements.snippetLanguage.addEventListener('change', () => { hasChanges = true; });

    /**
     * Load snippets from storage with proper error handling
     */
    async function loadSnippets() {
        try {
            const result = await storageManager.loadSnippets();
            
            if (!result.success) {
                showNotification(`Error loading snippets: ${result.error}`, 'error');
                snippets = [];
            } else {
                snippets = result.snippets || [];
                if (result.source === 'local') {
                    showNotification('Loaded from backup storage', 'info');
                }
            }
            
            renderSnippets();
            updateUI();
        } catch (error) {
            console.error('Load error:', error);
            showNotification('Failed to load snippets', 'error');
            snippets = [];
            updateUI();
        }
    }

    /**
     * Show editor for creating or editing a snippet
     */
    function showEditor(snippet = null) {
        elements.editorView.classList.remove('hidden');
        elements.snippetsList.classList.add('hidden');
        elements.noSnippets.classList.add('hidden');
        hasChanges = false;
        
        if (snippet) {
            elements.snippetTitle.value = snippet.title || '';
            elements.snippetLanguage.value = snippet.language || 'javascript';
            elements.snippetCode.value = snippet.code || '';
            currentEditId = snippet.id;
            elements.saveSnippet.innerHTML = '<i class="fas fa-save"></i> Update';
        } else {
            elements.snippetTitle.value = '';
            elements.snippetLanguage.value = 'javascript';
            elements.snippetCode.value = '';
            currentEditId = null;
            elements.saveSnippet.innerHTML = '<i class="fas fa-save"></i> Save';
        }
        
        elements.snippetTitle.focus();
    }

    /**
     * Save snippet with proper validation and error handling
     */
    async function saveSnippet() {
        const title = elements.snippetTitle.value.trim();
        const language = elements.snippetLanguage.value;
        const code = elements.snippetCode.value.trim();

        // Validation
        const snippet = { title, language, code };
        const validation = storageManager.validateSnippet(snippet);
        
        if (!validation.valid) {
            showNotification(validation.error, 'error');
            return;
        }

        // Disable button during save
        elements.saveSnippet.disabled = true;
        const originalText = elements.saveSnippet.innerHTML;
        elements.saveSnippet.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            if (currentEditId) {
                // Update existing snippet
                const index = snippets.findIndex(s => s.id === currentEditId);
                if (index !== -1) {
                    snippets[index] = {
                        id: currentEditId,
                        title,
                        language,
                        code,
                        date: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                }
            } else {
                // Add new snippet
                const newSnippet = {
                    id: Date.now().toString(),
                    title,
                    language,
                    code,
                    date: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                snippets.push(newSnippet);
            }

            // Save to storage
            const saveResult = await storageManager.saveSnippets(snippets);
            
            if (!saveResult.success) {
                showNotification(`Save failed: ${saveResult.error}`, 'error');
                return;
            }

            showNotification(currentEditId ? 'Snippet updated successfully!' : 'Snippet saved successfully!', 'success');
            hasChanges = false;
            
            // Reload and show list
            await loadSnippets();
            cancelEdit();
        } catch (error) {
            console.error('Save error:', error);
            showNotification(`Error saving snippet: ${error.message}`, 'error');
        } finally {
            // Re-enable button
            elements.saveSnippet.disabled = false;
            elements.saveSnippet.innerHTML = originalText;
        }
    }

    /**
     * Cancel editing and return to list view
     */
    function cancelEdit() {
        if (hasChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to discard them?')) {
                return;
            }
        }
        
        elements.editorView.classList.add('hidden');
        elements.snippetsList.classList.remove('hidden');
        currentEditId = null;
        hasChanges = false;
        updateUI();
    }

    /**
     * Render snippets with proper syntax highlighting
     */
    function renderSnippets() {
        elements.snippetsList.innerHTML = '';
        
        let filteredSnippets = snippets;
        
        // Apply search filter
        const searchTerm = elements.search.value.toLowerCase();
        if (searchTerm) {
            filteredSnippets = filteredSnippets.filter(snippet =>
                snippet.title.toLowerCase().includes(searchTerm) ||
                snippet.code.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply language filter
        const languageFilter = elements.filterLanguage.value;
        if (languageFilter) {
            filteredSnippets = filteredSnippets.filter(snippet =>
                snippet.language === languageFilter
            );
        }
        
        if (filteredSnippets.length === 0) {
            elements.snippetsList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #a0aec0;">
                    <i class="fas fa-search fa-2x"></i>
                    <p>No snippets found</p>
                </div>
            `;
            return;
        }
        
        filteredSnippets.forEach(snippet => {
            const date = new Date(snippet.date);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            const snippetElement = document.createElement('div');
            snippetElement.className = 'snippet-item';
            snippetElement.innerHTML = `
                <div class="snippet-header">
                    <div class="snippet-title-section">
                        <div class="snippet-title">${escapeHtml(snippet.title)}</div>
                        <div class="snippet-date">${dateStr}</div>
                    </div>
                    <div class="snippet-language">${snippet.language}</div>
                </div>
                <pre class="snippet-code"><code class="language-${snippet.language}">${escapeHtml(snippet.code)}</code></pre>
                <div class="snippet-actions">
                    <button class="btn-primary edit-btn" data-id="${snippet.id}" title="Edit snippet">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-success insert-btn" data-id="${snippet.id}" title="Insert to page">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="btn-warning copy-clipboard-btn" data-id="${snippet.id}" title="Copy to clipboard">
                        <i class="fas fa-clipboard"></i>
                    </button>
                    <button class="btn-danger delete-btn" data-id="${snippet.id}" title="Delete snippet">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            elements.snippetsList.appendChild(snippetElement);
            
            // Highlight code (hljs removed due to CSP restrictions in Manifest V3)
            // Code is displayed with basic CSS styling instead
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.edit-btn').dataset.id;
                const snippet = snippets.find(s => s.id === id);
                if (snippet) showEditor(snippet);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.closest('.delete-btn').dataset.id;
                if (confirm('Are you sure you want to delete this snippet?')) {
                    try {
                        const result = await storageManager.deleteSnippet(id, snippets);
                        if (result.success) {
                            snippets = snippets.filter(s => s.id !== id);
                            await loadSnippets();
                            showNotification('Snippet deleted successfully', 'success');
                        } else {
                            showNotification('Failed to delete snippet', 'error');
                        }
                    } catch (error) {
                        showNotification('Error deleting snippet', 'error');
                    }
                }
            });
        });
        
        document.querySelectorAll('.insert-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.insert-btn').dataset.id;
                const snippet = snippets.find(s => s.id === id);
                if (snippet) insertSnippetToPage(snippet);
            });
        });

        document.querySelectorAll('.copy-clipboard-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.copy-clipboard-btn').dataset.id;
                const snippet = snippets.find(s => s.id === id);
                if (snippet) {
                    navigator.clipboard.writeText(snippet.code).then(() => {
                        showNotification('Code copied to clipboard!', 'success');
                    }).catch(() => {
                        showNotification('Failed to copy to clipboard', 'error');
                    });
                }
            });
        });
    }

    /**
     * Filter snippets based on search and language
     */
    function filterSnippets() {
        renderSnippets();
    }

    /**
     * Update UI visibility
     */
    function updateUI() {
        if (snippets.length === 0 && elements.editorView.classList.contains('hidden')) {
            elements.noSnippets.classList.remove('hidden');
            elements.snippetsList.classList.add('hidden');
        } else {
            elements.noSnippets.classList.add('hidden');
            if (elements.editorView.classList.contains('hidden')) {
                elements.snippetsList.classList.remove('hidden');
            }
        }
    }

    /**
     * Insert snippet to page
     */
    function insertSnippetToPage(snippet) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (!tabs || tabs.length === 0) {
                showNotification('No active tab found', 'error');
                return;
            }

            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'insertCode',
                code: snippet.code,
                language: snippet.language
            }, function(response) {
                if (chrome.runtime.lastError) {
                    showNotification('Cannot insert on this page. Try a different page.', 'error');
                } else {
                    showNotification('Code inserted successfully!', 'success');
                    setTimeout(() => window.close(), 1000);
                }
            });
        });
    }

    /**
     * Insert snippet from editor view
     */
    function insertToPage() {
        const snippet = {
            code: elements.snippetCode.value,
            language: elements.snippetLanguage.value
        };
        insertSnippetToPage(snippet);
    }

    /**
     * Export snippets as JSON
     */
    function exportSnippets() {
        if (snippets.length === 0) {
            showNotification('No snippets to export', 'info');
            return;
        }

        try {
            const dataStr = JSON.stringify(snippets, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `code-snippets-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showNotification('Snippets exported successfully!', 'success');
        } catch (error) {
            showNotification('Failed to export snippets', 'error');
        }
    }

    /**
     * Show notification message
     */
    function showNotification(message, type = 'info') {
        elements.notification.textContent = message;
        elements.notification.className = `notification show ${type}`;
        
        setTimeout(() => {
            elements.notification.classList.remove('show');
        }, 3000);
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});