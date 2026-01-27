// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadSessionHistory();
    loadStatistics();
});

function loadSessionHistory() {
    chrome.storage.local.get(null, function(items) {
        const sessions = Object.keys(items)
            .filter(key => key.startsWith('session_'))
            .map(key => ({ key, ...items[key] }))
            .sort((a, b) => b.timestamp - a.timestamp);
        
        const sessionsList = document.getElementById('sessionsList');
        
        if (sessions.length === 0) {
            sessionsList.innerHTML = '<p>No saved sessions yet.</p>';
            return;
        }
        
        sessionsList.innerHTML = sessions.map(session => `
            <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                <strong>${new Date(session.timestamp).toLocaleString()}</strong>
                <p>${session.tabs.length} tabs saved</p>
                <button onclick="restoreSession('${session.key}')">Restore</button>
                <button onclick="deleteSession('${session.key}')">Delete</button>
            </div>
        `).join('');
    });
}

function loadStatistics() {
    chrome.tabs.query({}, function(tabs) {
        const statsGrid = document.getElementById('statsGrid');
        
        const stats = {
            'Total Tabs': tabs.length,
            'Unique Domains': new Set(tabs.map(t => new URL(t.url).hostname)).size,
            'Pinned Tabs': tabs.filter(t => t.pinned).length,
            'Audio Playing': tabs.filter(t => t.audible).length,
            'Duplicate Tabs': calculateDuplicates(tabs),
            'Estimated Memory': `${Math.round(tabs.length * 75)} MB`
        };
        
        statsGrid.innerHTML = Object.entries(stats).map(([label, value]) => `
            <div class="stat">
                <div class="stat-value">${value}</div>
                <div class="stat-label">${label}</div>
            </div>
        `).join('');
    });
}

function calculateDuplicates(tabs) {
    const urlMap = new Map();
    let duplicates = 0;
    
    tabs.forEach(tab => {
        const url = new URL(tab.url).hostname + new URL(tab.url).pathname;
        if (urlMap.has(url)) {
            duplicates++;
        } else {
            urlMap.set(url, true);
        }
    });
    
    return duplicates;
}

function restoreSession(sessionKey) {
    chrome.storage.local.get(sessionKey, function(result) {
        const session = result[sessionKey];
        
        session.tabs.forEach(tab => {
            chrome.tabs.create({ url: tab.url, pinned: tab.pinned });
        });
        
        alert(`Restoring ${session.tabs.length} tabs...`);
    });
}

function deleteSession(sessionKey) {
    if (confirm('Delete this session?')) {
        chrome.storage.local.remove(sessionKey, function() {
            loadSessionHistory();
        });
    }
}