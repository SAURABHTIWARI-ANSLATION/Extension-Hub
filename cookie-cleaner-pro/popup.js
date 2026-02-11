// DOM Elements
const cleanBtn = document.getElementById('cleanBtn');
const addCurrentBtn = document.getElementById('addCurrentBtn');
const addDomainBtn = document.getElementById('addDomainBtn');
const domainInput = document.getElementById('domainInput');
const whitelistContainer = document.getElementById('whitelistContainer');
const whitelistCount = document.getElementById('whitelistCount');
const cleanedCount = document.getElementById('cleanedCount');
const statusMessage = document.getElementById('statusMessage');
const viewAllBtn = document.getElementById('viewAllBtn');
const autoProtect = document.getElementById('autoProtect');
const notifications = document.getElementById('notifications');

// State
let whitelist = [];
let stats = { cleaned: 0 };

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Load data from storage
    const data = await chrome.storage.sync.get(['whitelist', 'stats', 'settings']);
    
    whitelist = data.whitelist || [];
    stats = data.stats || { cleaned: 0 };
    
    // Load settings
    if (data.settings) {
        autoProtect.checked = data.settings.autoProtect || false;
        notifications.checked = data.settings.notifications || true;
    }
    
    updateUI();
    
    // Get current tab info
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.url && tab.url.startsWith('http')) {
            const domain = extractDomain(tab.url);
            addCurrentBtn.innerHTML = `<i class="fas fa-plus-circle"></i> Protect ${domain}`;
        }
    } catch (error) {
        console.log('Cannot access tab:', error);
    }
}

// Event Listeners
cleanBtn.addEventListener('click', cleanNonEssentialCookies);
addCurrentBtn.addEventListener('click', addCurrentSiteToWhitelist);
addDomainBtn.addEventListener('click', addDomainFromInput);
viewAllBtn.addEventListener('click', viewAllCookies);
domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addDomainFromInput();
});

// Settings change listeners
autoProtect.addEventListener('change', saveSettings);
notifications.addEventListener('change', saveSettings);

// Main Functions
async function cleanNonEssentialCookies() {
    showStatus('🔍 Scanning cookies...', 'info');
    
    try {
        const cookies = await chrome.cookies.getAll({});
        let deletedCount = 0;
        
        for (const cookie of cookies) {
            const cookieDomain = cleanDomain(cookie.domain);
            
            // Check if cookie domain is in whitelist
            const isWhitelisted = whitelist.some(domain => 
                cookieDomain.includes(domain) || domain.includes(cookieDomain)
            );
            
            // Delete if NOT whitelisted
            if (!isWhitelisted) {
                try {
                    const url = `http${cookie.secure ? 's' : ''}://${cookieDomain}${cookie.path || '/'}`;
                    await chrome.cookies.remove({
                        url: url,
                        name: cookie.name
                    });
                    deletedCount++;
                } catch (error) {
                    console.log('Failed to delete cookie:', cookie.name, error);
                }
            }
        }
        
        // Update stats
        stats.cleaned += deletedCount;
        await chrome.storage.sync.set({ stats });
        
        // Show result
        if (deletedCount > 0) {
            showStatus(`🧹 Cleaned ${deletedCount} non-essential cookies`, 'success');
            
            if (notifications.checked) {
                chrome.runtime.sendMessage({
                    type: 'SHOW_NOTIFICATION',
                    message: `Cleaned ${deletedCount} cookies`
                });
            }
        } else {
            showStatus('✅ All cookies are protected or none found', 'success');
        }
        
        updateUI();
        
    } catch (error) {
        console.error('Error cleaning cookies:', error);
        showStatus('❌ Error cleaning cookies', 'error');
    }
}

async function addCurrentSiteToWhitelist() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url || !tab.url.startsWith('http')) {
            showStatus('❌ Cannot add this page to whitelist', 'error');
            return;
        }
        
        const domain = extractDomain(tab.url);
        await addToWhitelist(domain);
        
    } catch (error) {
        console.error('Error adding current site:', error);
        showStatus('❌ Error adding site', 'error');
    }
}

async function addDomainFromInput() {
    const domain = domainInput.value.trim().toLowerCase();
    
    if (!domain) {
        showStatus('❌ Please enter a domain', 'error');
        return;
    }
    
    // Basic domain validation
    if (!isValidDomain(domain)) {
        showStatus('❌ Invalid domain format', 'error');
        return;
    }
    
    await addToWhitelist(domain);
    domainInput.value = '';
}

async function addToWhitelist(domain) {
    if (!whitelist.includes(domain)) {
        whitelist.push(domain);
        await chrome.storage.sync.set({ whitelist });
        updateUI();
        showStatus(`✅ Added ${domain} to protected sites`, 'success');
    } else {
        showStatus(`⚠️ ${domain} is already protected`, 'warning');
    }
}

function removeFromWhitelist(domain) {
    whitelist = whitelist.filter(d => d !== domain);
    chrome.storage.sync.set({ whitelist });
    updateUI();
    showStatus(`🗑️ Removed ${domain} from protected sites`, 'info');
}

async function viewAllCookies() {
    try {
        const cookies = await chrome.cookies.getAll({});
        showStatus(`📊 Found ${cookies.length} total cookies`, 'info');
        
        // Open in a new tab or show in popup
        // For simplicity, just show count
        alert(`Total cookies in browser: ${cookies.length}\nProtected domains: ${whitelist.length}`);
        
    } catch (error) {
        console.error('Error viewing cookies:', error);
        showStatus('❌ Error loading cookies', 'error');
    }
}

// Helper Functions
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '');
    } catch {
        return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    }
}

function cleanDomain(domain) {
    return domain.replace(/^\./, '').replace(/^www\./, '');
}

function isValidDomain(domain) {
    // Basic domain validation
    const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    return pattern.test(domain) || domain.includes('.');
}

function updateUI() {
    // Update whitelist display
    whitelistContainer.innerHTML = '';
    whitelist.forEach(domain => {
        const item = document.createElement('div');
        item.className = 'whitelist-item';
        item.innerHTML = `
            <span class="domain-name">${domain}</span>
            <button class="remove-domain" data-domain="${domain}">
                <i class="fas fa-times"></i>
            </button>
        `;
        whitelistContainer.appendChild(item);
        
        // Add event listener to remove button
        item.querySelector('.remove-domain').addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromWhitelist(domain);
        });
    });
    
    // Update counters
    whitelistCount.textContent = whitelist.length;
    cleanedCount.textContent = stats.cleaned;
}

function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    
    // Reset classes
    statusMessage.className = 'status-message';
    
    // Add type class
    if (type === 'success') {
        statusMessage.style.background = '#d4edda';
        statusMessage.style.color = '#155724';
    } else if (type === 'error') {
        statusMessage.style.background = '#f8d7da';
        statusMessage.style.color = '#721c24';
    } else if (type === 'warning') {
        statusMessage.style.background = '#fff3cd';
        statusMessage.style.color = '#856404';
    } else {
        statusMessage.style.background = '#e9ecef';
        statusMessage.style.color = '#666';
    }
}

async function saveSettings() {
    const settings = {
        autoProtect: autoProtect.checked,
        notifications: notifications.checked
    };
    await chrome.storage.sync.set({ settings });
}