document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const linksContainer = document.querySelector('.links-container');
    const emptyState = document.getElementById('emptyState');
    const addCurrentBtn = document.getElementById('addCurrent');
    const openAllBtn = document.getElementById('openAll');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const categoryTags = document.querySelectorAll('.category-tag');
    const totalLinksSpan = document.getElementById('totalLinks');
    const totalCategoriesSpan = document.getElementById('totalCategories');
    
    let allLinks = [];
    let currentFilter = 'all';
    let currentSearch = '';

    // Initialize
    loadLinks();
    setupEventListeners();

    // Load links from Chrome storage
    function loadLinks() {
        chrome.storage.sync.get(['quickLinks'], function(result) {
            allLinks = result.quickLinks || [];
            updateUI();
        });
    }

    // Save links to Chrome storage
    function saveLinks() {
        chrome.storage.sync.set({ quickLinks: allLinks });
        updateUI();
    }

    // Update UI
    function updateUI() {
        // Filter links based on category and search
        let filteredLinks = allLinks;
        
        if (currentFilter !== 'all') {
            filteredLinks = filteredLinks.filter(link => link.category === currentFilter);
        }
        
        if (currentSearch) {
            const searchLower = currentSearch.toLowerCase();
            filteredLinks = filteredLinks.filter(link => 
                link.title.toLowerCase().includes(searchLower) || 
                link.url.toLowerCase().includes(searchLower)
            );
        }

        // Update stats
        totalLinksSpan.textContent = allLinks.length;
        const uniqueCategories = [...new Set(allLinks.map(link => link.category))];
        totalCategoriesSpan.textContent = uniqueCategories.length;

        // Clear container
        linksContainer.innerHTML = '';

        // Show/hide empty state
        if (filteredLinks.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            
            // Add links to container
            filteredLinks.forEach((link, index) => {
                const linkElement = createLinkElement(link, index);
                linksContainer.appendChild(linkElement);
            });
        }
    }

    // Create link element
    function createLinkElement(link, index) {
        const div = document.createElement('div');
        div.className = 'link-item';
        div.dataset.index = index;
        
        // Get domain for icon
        const domain = getDomainFromUrl(link.url);
        const icon = getIconForDomain(domain);
        
        div.innerHTML = `
            <div class="link-icon">${icon}</div>
            <div class="link-content">
                <div class="link-title">${link.title}</div>
                <div class="link-url">${domain}</div>
            </div>
            <div class="link-actions">
                <button class="action-btn open-btn" title="Open Link">
                    <i class="fas fa-external-link-alt"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete Link">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.link-actions')) {
                chrome.tabs.create({ url: link.url, active: false });
            }
        });
        
        div.querySelector('.open-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            chrome.tabs.create({ url: link.url, active: true });
        });
        
        div.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            allLinks.splice(index, 1);
            saveLinks();
        });
        
        return div;
    }

    // Add current page
    addCurrentBtn.addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            const currentTab = tabs[0];
            
            // Get category based on URL
            let category = 'general';
            const url = currentTab.url.toLowerCase();
            
            if (url.includes('mail') || url.includes('calendar') || url.includes('docs') || url.includes('slack')) {
                category = 'work';
            } else if (url.includes('facebook') || url.includes('twitter') || url.includes('instagram') || url.includes('linkedin')) {
                category = 'social';
            } else if (url.includes('amazon') || url.includes('flipkart') || url.includes('myntra') || url.includes('shop')) {
                category = 'shopping';
            } else if (url.includes('youtube') || url.includes('netflix') || url.includes('spotify')) {
                category = 'entertainment';
            }
            
            const newLink = {
                title: currentTab.title,
                url: currentTab.url,
                category: category,
                dateAdded: new Date().toISOString()
            };
            
            allLinks.push(newLink);
            saveLinks();
            
            // Show success animation
            addCurrentBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
            setTimeout(() => {
                addCurrentBtn.innerHTML = '<i class="fas fa-plus"></i> Add Current Page';
            }, 1000);
        });
    });

    // Open all links
    openAllBtn.addEventListener('click', function() {
        const linksToOpen = currentFilter === 'all' ? allLinks : 
                           allLinks.filter(link => link.category === currentFilter);
        
        linksToOpen.forEach(link => {
            chrome.tabs.create({ url: link.url, active: false });
        });
        
        // Show feedback
        openAllBtn.innerHTML = `<i class="fas fa-check"></i> Opened ${linksToOpen.length} links`;
        setTimeout(() => {
            openAllBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> Open All';
        }, 2000);
    });

    // Search functionality
    searchInput.addEventListener('input', function(e) {
        currentSearch = e.target.value;
        updateUI();
    });

    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        currentSearch = '';
        updateUI();
    });

    // Category filter
    categoryTags.forEach(tag => {
        tag.addEventListener('click', function() {
            // Update active class
            categoryTags.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update filter
            currentFilter = this.dataset.category;
            updateUI();
        });
    });

    // Setup event listeners
    function setupEventListeners() {
        // Add sample data if empty
        if (allLinks.length === 0) {
            addSampleData();
        }
    }

    // Add sample data
    function addSampleData() {
        const sampleLinks = [
            {
                title: 'Gmail',
                url: 'https://mail.google.com',
                category: 'work',
                dateAdded: new Date().toISOString()
            },
            {
                title: 'Instagram',
                url: 'https://instagram.com',
                category: 'social',
                dateAdded: new Date().toISOString()
            },
            {
                title: 'Amazon India',
                url: 'https://amazon.in',
                category: 'shopping',
                dateAdded: new Date().toISOString()
            },
            {
                title: 'YouTube',
                url: 'https://youtube.com',
                category: 'entertainment',
                dateAdded: new Date().toISOString()
            },
            {
                title: 'Google Calendar',
                url: 'https://calendar.google.com',
                category: 'work',
                dateAdded: new Date().toISOString()
            }
        ];
        
        allLinks = sampleLinks;
        saveLinks();
    }

    // Helper functions
    function getDomainFromUrl(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    }

    function getIconForDomain(domain) {
        const iconMap = {
            'gmail.com': '📧',
            'google.com': '🔍',
            'calendar.google.com': '📅',
            'youtube.com': '🎬',
            'instagram.com': '📷',
            'facebook.com': '👥',
            'twitter.com': '🐦',
            'linkedin.com': '💼',
            'amazon.in': '🛒',
            'flipkart.com': '📦',
            'myntra.com': '👕',
            'netflix.com': '🎥',
            'spotify.com': '🎵',
            'github.com': '💻',
            'notion.so': '📝',
            'slack.com': '💬',
            'whatsapp.com': '💚'
        };
        
        return iconMap[domain] || '🔗';
    }
});