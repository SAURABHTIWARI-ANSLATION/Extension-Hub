/**
 * SECURITY WARNING FOR DEVELOPERS:
 * 
 * This file uses two helper functions for DOM creation:
 * 
 * - createElement(tag, textContent, className)
 *   → SAFE: Uses textContent. Use for ALL scraped/external data.
 * 
 * - createElementWithHTML(tag, innerHTML, className)
 *   → UNSAFE: Uses innerHTML. ONLY use for static UI elements (icons, labels).
 *   → NEVER pass scraped data to this function.
 * 
 * Violation of this rule creates XSS vulnerabilities.
 * All external/scraped data MUST use createElement() with textContent.
 */

// preview.js - Handles the data preview functionality (CSP-COMPLIANT & XSS-SAFE)

let scrapedData = [];

// DOM elements
const refreshBtn = document.getElementById('refresh-btn');
const exportJsonBtn = document.getElementById('export-json-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const closeBtn = document.getElementById('close-btn');

// Tab elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Format JSON for display
function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

// Tab navigation
function setupTabNavigation() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}

// Helper: Create element with text content (safe)
function createElement(tag, textContent = '', className = '') {
    const el = document.createElement(tag);
    if (textContent) el.textContent = textContent;
    if (className) el.className = className;
    return el;
}

// Helper: Create element with HTML (only for static, safe HTML)
function createElementWithHTML(tag, innerHTML, className = '') {
    const el = document.createElement(tag);
    el.innerHTML = innerHTML;
    if (className) el.className = className;
    return el;
}

// Render overview tab
function renderOverview(data) {
    const container = document.getElementById('overview-content');
    container.innerHTML = ''; // Clear existing

    if (!data || data.length === 0) {
        container.appendChild(createElementWithHTML('div', '<p>No data available to display</p>', 'no-data'));
        return;
    }

    const item = data[0];

    // Page information section
    const pageSection = createElement('div', '', 'section');
    pageSection.appendChild(createElementWithHTML('h2', '📄 Page Information', 'section-title'));

    const dataGrid = createElement('div', '', 'data-grid');

    // Basic Info Card
    const basicCard = createElement('div', '', 'data-card');
    basicCard.appendChild(createElement('h3', 'Basic Info'));

    // Title
    const titleItem = createElement('div', '', 'data-item');
    titleItem.appendChild(createElement('div', 'Title', 'data-label'));
    titleItem.appendChild(createElement('div', item.title || 'Untitled Page', 'data-value'));
    basicCard.appendChild(titleItem);

    // URL
    const urlItem = createElement('div', '', 'data-item');
    urlItem.appendChild(createElement('div', 'URL', 'data-label'));
    const urlValue = createElement('div', '', 'data-value');
    const urlLink = createElement('a', item.url, 'url-link');
    urlLink.href = item.url;
    urlLink.target = '_blank';
    urlLink.rel = 'noopener noreferrer'; // Security: prevent tabnabbing
    urlValue.appendChild(urlLink);
    urlItem.appendChild(urlValue);
    basicCard.appendChild(urlItem);

    // Description
    const descItem = createElement('div', '', 'data-item');
    descItem.appendChild(createElement('div', 'Description', 'data-label'));
    descItem.appendChild(createElement('div', item.description || 'No description available', 'data-value'));
    basicCard.appendChild(descItem);

    // Scraped At
    const dateItem = createElement('div', '', 'data-item');
    dateItem.appendChild(createElement('div', 'Scraped At', 'data-label'));
    const dateText = item.scrapedAt ? new Date(item.scrapedAt).toLocaleString() : 'Unknown';
    dateItem.appendChild(createElement('div', dateText, 'data-value'));
    basicCard.appendChild(dateItem);

    dataGrid.appendChild(basicCard);

    // Content Summary Card
    const summaryCard = createElement('div', '', 'data-card');
    summaryCard.appendChild(createElement('h3', 'Content Summary'));

    const summaryItems = [
        { label: 'Headings', value: `${item.headings ? item.headings.length : 0} headings` },
        { label: 'Paragraphs', value: `${item.paragraphs ? item.paragraphs.length : 0} paragraphs` },
        { label: 'Images', value: `${item.images ? item.images.length : 0} images` },
        { label: 'Links', value: `${(item.links?.internal?.length || 0) + (item.links?.external?.length || 0)} links` }
    ];

    summaryItems.forEach(({ label, value }) => {
        const summaryItem = createElement('div', '', 'data-item');
        summaryItem.appendChild(createElement('div', label, 'data-label'));
        summaryItem.appendChild(createElement('div', value, 'data-value'));
        summaryCard.appendChild(summaryItem);
    });

    dataGrid.appendChild(summaryCard);
    pageSection.appendChild(dataGrid);
    container.appendChild(pageSection);

    // Quick preview section
    const previewSection = createElement('div', '', 'section');
    previewSection.appendChild(createElementWithHTML('h2', '🔍 Quick Preview', 'section-title'));

    // Headings preview
    if (item.headings && item.headings.length > 0) {
        const headingsCard = createElement('div', '', 'data-card');
        headingsCard.appendChild(createElement('h3', 'Headings'));

        item.headings.slice(0, 5).forEach(heading => {
            const headingItem = createElement('div', '', 'data-item');
            headingItem.appendChild(createElement('div', heading.tag.toUpperCase(), 'data-label'));
            headingItem.appendChild(createElement('div', heading.text, 'data-value'));
            headingsCard.appendChild(headingItem);
        });

        previewSection.appendChild(headingsCard);
    }

    // Paragraphs preview
    if (item.paragraphs && item.paragraphs.length > 0) {
        const paragraphsCard = createElement('div', '', 'data-card');
        paragraphsCard.appendChild(createElement('h3', 'Paragraphs'));

        item.paragraphs.slice(0, 3).forEach(paragraph => {
            if (paragraph.trim() !== '') {
                const paraItem = createElement('div', '', 'data-item');
                const truncated = paragraph.length > 200 ? paragraph.substring(0, 200) + '...' : paragraph;
                paraItem.appendChild(createElement('div', truncated, 'data-value'));
                paragraphsCard.appendChild(paraItem);
            }
        });

        previewSection.appendChild(paragraphsCard);
    }

    container.appendChild(previewSection);
}

// Render content tab
function renderContent(data) {
    const container = document.getElementById('content-data');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.appendChild(createElementWithHTML('div', '<p>No data available to display</p>', 'no-data'));
        return;
    }

    const item = data[0];

    // Headings
    if (item.headings && item.headings.length > 0) {
        const section = createElement('div', '', 'section');
        section.appendChild(createElementWithHTML('h2', '🔤 Headings', 'section-title'));
        const grid = createElement('div', '', 'data-grid');

        item.headings.forEach(heading => {
            const card = createElement('div', '', 'data-card');
            card.appendChild(createElement('h3', heading.tag.toUpperCase()));
            card.appendChild(createElement('div', heading.text, 'data-value'));
            grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
    }

    // Paragraphs
    if (item.paragraphs && item.paragraphs.length > 0) {
        const section = createElement('div', '', 'section');
        section.appendChild(createElementWithHTML('h2', '📝 Paragraphs', 'section-title'));
        const grid = createElement('div', '', 'data-grid');

        item.paragraphs.slice(0, 10).forEach(paragraph => {
            if (paragraph.trim() !== '') {
                const card = createElement('div', '', 'data-card');
                card.appendChild(createElement('div', paragraph, 'data-value'));
                grid.appendChild(card);
            }
        });

        section.appendChild(grid);
        container.appendChild(section);
    }

    // Lists
    if (item.lists && item.lists.length > 0) {
        const section = createElement('div', '', 'section');
        section.appendChild(createElementWithHTML('h2', '📋 Lists', 'section-title'));

        item.lists.slice(0, 5).forEach((list, index) => {
            const card = createElement('div', '', 'data-card');
            card.appendChild(createElement('h3', `List ${index + 1}`));

            const listContainer = createElement('div', '', 'list-container');
            const ul = createElement('ul');

            list.slice(0, 10).forEach(listItem => {
                ul.appendChild(createElement('li', listItem));
            });

            listContainer.appendChild(ul);
            card.appendChild(listContainer);
            section.appendChild(card);
        });

        container.appendChild(section);
    }

    // Tables
    if (item.tables && item.tables.length > 0) {
        const section = createElement('div', '', 'section');
        section.appendChild(createElementWithHTML('h2', '📊 Tables', 'section-title'));

        item.tables.slice(0, 2).forEach((table, index) => {
            const card = createElement('div', '', 'data-card');
            card.appendChild(createElement('h3', `Table ${index + 1}`));

            const tableContainer = createElement('div', '', 'table-container');
            const tableEl = createElement('table');

            table.forEach((row, rowIndex) => {
                const tr = createElement('tr');
                row.forEach(cell => {
                    const tag = rowIndex === 0 ? 'th' : 'td';
                    tr.appendChild(createElement(tag, cell || ''));
                });
                tableEl.appendChild(tr);
            });

            tableContainer.appendChild(tableEl);
            card.appendChild(tableContainer);
            section.appendChild(card);
        });

        container.appendChild(section);
    }

    if (container.children.length === 0) {
        container.appendChild(createElementWithHTML('div', '<p>No content data available</p>', 'no-data'));
    }
}

// Render media tab
function renderMedia(data) {
    const container = document.getElementById('media-data');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.appendChild(createElementWithHTML('div', '<p>No data available to display</p>', 'no-data'));
        return;
    }

    const item = data[0];

    // Images
    if (item.images && item.images.length > 0) {
        const section = createElement('div', '', 'section');
        section.appendChild(createElementWithHTML('h2', '🖼️ Images', 'section-title'));
        const gallery = createElement('div', '', 'image-gallery');

        item.images.slice(0, 12).forEach(image => {
            if (image.src) {
                const imageItem = createElement('div', '', 'image-item');

                const img = createElement('img');
                img.src = image.src;
                img.alt = image.alt || 'No description';

                // Add error handler using addEventListener (CSP-compliant)
                img.addEventListener('error', function () {
                    this.parentElement.style.display = 'none';
                });

                imageItem.appendChild(img);

                const altDiv = createElement('div', image.alt || 'No alt text', 'image-alt');
                altDiv.title = image.alt || 'No alt text';
                imageItem.appendChild(altDiv);

                gallery.appendChild(imageItem);
            }
        });

        section.appendChild(gallery);
        container.appendChild(section);
    }

    // Videos
    if (item.videos && item.videos.length > 0) {
        const section = createElement('div', '', 'section');
        section.appendChild(createElementWithHTML('h2', '🎬 Videos', 'section-title'));
        const grid = createElement('div', '', 'data-grid');

        item.videos.slice(0, 5).forEach((video, index) => {
            const card = createElement('div', '', 'data-card');
            card.appendChild(createElement('h3', `Video ${index + 1}`));

            const srcItem = createElement('div', '', 'data-item');
            srcItem.appendChild(createElement('div', 'Source', 'data-label'));
            srcItem.appendChild(createElement('div', video.src || 'None', 'data-value'));
            card.appendChild(srcItem);

            const posterItem = createElement('div', '', 'data-item');
            posterItem.appendChild(createElement('div', 'Poster', 'data-label'));
            posterItem.appendChild(createElement('div', video.poster || 'None', 'data-value'));
            card.appendChild(posterItem);

            const controlsItem = createElement('div', '', 'data-item');
            controlsItem.appendChild(createElement('div', 'Controls', 'data-label'));
            controlsItem.appendChild(createElement('div', video.controls ? 'Yes' : 'No', 'data-value'));
            card.appendChild(controlsItem);

            grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
    }

    // Audio
    if (item.audios && item.audios.length > 0) {
        const section = createElement('div', '', 'section');
        section.appendChild(createElementWithHTML('h2', '🎵 Audio', 'section-title'));
        const grid = createElement('div', '', 'data-grid');

        item.audios.slice(0, 5).forEach((audio, index) => {
            const card = createElement('div', '', 'data-card');
            card.appendChild(createElement('h3', `Audio ${index + 1}`));

            const srcItem = createElement('div', '', 'data-item');
            srcItem.appendChild(createElement('div', 'Source', 'data-label'));
            srcItem.appendChild(createElement('div', audio.src || 'None', 'data-value'));
            card.appendChild(srcItem);

            const controlsItem = createElement('div', '', 'data-item');
            controlsItem.appendChild(createElement('div', 'Controls', 'data-label'));
            controlsItem.appendChild(createElement('div', audio.controls ? 'Yes' : 'No', 'data-value'));
            card.appendChild(controlsItem);

            grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
    }

    if (container.children.length === 0) {
        container.appendChild(createElementWithHTML('div', '<p>No media data available</p>', 'no-data'));
    }
}

// Render structure tab
function renderStructure(data) {
    const container = document.getElementById('structure-data');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.appendChild(createElementWithHTML('div', '<p>No data available to display</p>', 'no-data'));
        return;
    }

    const item = data[0];

    // Links
    if (item.links) {
        const section = createElement('div', '', 'section');
        section.appendChild(createElementWithHTML('h2', '🔗 Links', 'section-title'));

        if (item.links.internal && item.links.internal.length > 0) {
            const card = createElement('div', '', 'data-card');
            card.appendChild(createElement('h3', `Internal Links (${item.links.internal.length})`));

            item.links.internal.slice(0, 10).forEach(link => {
                const linkItem = createElement('div', '', 'data-item');
                const linkValue = createElement('div', '', 'data-value');
                const linkEl = createElement('a', link, 'url-link');
                linkEl.href = link;
                linkEl.target = '_blank';
                linkEl.rel = 'noopener noreferrer'; // Security: prevent tabnabbing
                linkValue.appendChild(linkEl);
                linkItem.appendChild(linkValue);
                card.appendChild(linkItem);
            });

            section.appendChild(card);
        }

        if (item.links.external && item.links.external.length > 0) {
            const card = createElement('div', '', 'data-card');
            card.appendChild(createElement('h3', `External Links (${item.links.external.length})`));

            item.links.external.slice(0, 10).forEach(link => {
                const linkItem = createElement('div', '', 'data-item');
                const linkValue = createElement('div', '', 'data-value');
                const linkEl = createElement('a', link, 'url-link');
                linkEl.href = link;
                linkEl.target = '_blank';
                linkEl.rel = 'noopener noreferrer'; // Security: prevent tabnabbing
                linkValue.appendChild(linkEl);
                linkItem.appendChild(linkValue);
                card.appendChild(linkItem);
            });

            section.appendChild(card);
        }

        container.appendChild(section);
    }

    // Forms
    if (item.forms && item.forms.length > 0) {
        const section = createElement('div', '', 'section');
        section.appendChild(createElementWithHTML('h2', '📝 Forms', 'section-title'));
        const grid = createElement('div', '', 'data-grid');

        item.forms.forEach((form, index) => {
            const card = createElement('div', '', 'data-card');
            card.appendChild(createElement('h3', `Form ${index + 1}`));

            const actionItem = createElement('div', '', 'data-item');
            actionItem.appendChild(createElement('div', 'Action', 'data-label'));
            actionItem.appendChild(createElement('div', form.action || 'None', 'data-value'));
            card.appendChild(actionItem);

            const methodItem = createElement('div', '', 'data-item');
            methodItem.appendChild(createElement('div', 'Method', 'data-label'));
            methodItem.appendChild(createElement('div', form.method || 'GET', 'data-value'));
            card.appendChild(methodItem);

            const inputsItem = createElement('div', '', 'data-item');
            inputsItem.appendChild(createElement('div', `Inputs (${form.inputs.length})`, 'data-label'));

            const listContainer = createElement('div', '', 'list-container');
            const ul = createElement('ul');
            form.inputs.forEach(input => {
                const inputText = `${input.name} (${input.type})${input.required ? ' (required)' : ''}`;
                ul.appendChild(createElement('li', inputText));
            });
            listContainer.appendChild(ul);
            inputsItem.appendChild(listContainer);
            card.appendChild(inputsItem);

            grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
    }

    // Iframes
    if (item.iframes && item.iframes.length > 0) {
        const section = createElement('div', '', 'section');
        section.appendChild(createElementWithHTML('h2', '🔲 Iframes', 'section-title'));
        const grid = createElement('div', '', 'data-grid');

        item.iframes.slice(0, 5).forEach((iframe, index) => {
            const card = createElement('div', '', 'data-card');
            card.appendChild(createElement('h3', `Iframe ${index + 1}`));

            const srcItem = createElement('div', '', 'data-item');
            srcItem.appendChild(createElement('div', 'Source', 'data-label'));
            srcItem.appendChild(createElement('div', iframe.src || 'None', 'data-value'));
            card.appendChild(srcItem);

            const titleItem = createElement('div', '', 'data-item');
            titleItem.appendChild(createElement('div', 'Title', 'data-label'));
            titleItem.appendChild(createElement('div', iframe.title || 'No title', 'data-value'));
            card.appendChild(titleItem);

            grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
    }

    if (container.children.length === 0) {
        container.appendChild(createElementWithHTML('div', '<p>No structure data available</p>', 'no-data'));
    }
}

// Render raw data tab
function renderRawData(data) {
    const container = document.getElementById('raw-data');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.appendChild(createElementWithHTML('div', '<p>No data available to display</p>', 'no-data'));
        return;
    }

    const item = data[0];
    const section = createElement('div', '', 'section');
    section.appendChild(createElementWithHTML('h2', '💻 Raw JSON Data', 'section-title'));

    // syntaxHighlight already escapes HTML, so this is safe
    const jsonPreview = createElementWithHTML('div', syntaxHighlight(JSON.stringify(item, null, 2)), 'json-preview');
    section.appendChild(jsonPreview);

    container.appendChild(section);
}

// Render summary statistics
function renderSummary(data) {
    const container = document.getElementById('summary-stats');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.appendChild(createElementWithHTML('div', '<p>No data available</p>', 'no-data'));
        return;
    }

    const item = data[0];

    const stats = [
        { label: 'Headings', value: item.headings ? item.headings.length : 0 },
        { label: 'Paragraphs', value: item.paragraphs ? item.paragraphs.length : 0 },
        { label: 'Images', value: item.images ? item.images.length : 0 },
        { label: 'Links', value: (item.links?.internal?.length || 0) + (item.links?.external?.length || 0) },
        { label: 'Lists', value: item.lists ? item.lists.length : 0 },
        { label: 'Tables', value: item.tables ? item.tables.length : 0 },
        { label: 'Forms', value: item.forms ? item.forms.length : 0 },
        { label: 'Videos', value: item.videos ? item.videos.length : 0 }
    ];

    const statsGrid = createElement('div', '', 'stats-grid');
    stats.forEach(stat => {
        const card = createElement('div', '', 'stat-card');
        card.appendChild(createElement('div', String(stat.value), 'stat-value'));
        card.appendChild(createElement('div', stat.label, 'stat-label'));
        statsGrid.appendChild(card);
    });

    container.appendChild(statsGrid);
}

// Render quick links
function renderQuickLinks(data) {
    const container = document.getElementById('quick-links');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.appendChild(createElementWithHTML('div', '<p>No links available</p>', 'no-data'));
        return;
    }

    const item = data[0];

    if (!item.links) {
        container.appendChild(createElementWithHTML('div', '<p>No links available</p>', 'no-data'));
        return;
    }

    const allLinks = [...(item.links.internal || []), ...(item.links.external || [])];

    if (allLinks.length === 0) {
        container.appendChild(createElementWithHTML('div', '<p>No links available</p>', 'no-data'));
        return;
    }

    const listContainer = createElement('div', '', 'list-container');
    const ul = createElement('ul');

    allLinks.slice(0, 10).forEach(link => {
        const li = createElement('li');
        const linkEl = createElement('a', link, 'url-link');
        linkEl.href = link;
        linkEl.target = '_blank';
        linkEl.rel = 'noopener noreferrer'; // Security: prevent tabnabbing
        li.appendChild(linkEl);
        ul.appendChild(li);
    });

    listContainer.appendChild(ul);
    container.appendChild(listContainer);
}

// Render all tabs
function renderAllTabs(data) {
    renderOverview(data);
    renderContent(data);
    renderMedia(data);
    renderStructure(data);
    renderRawData(data);
    renderSummary(data);
    renderQuickLinks(data);
}

// Load data from storage
function loadData() {
    chrome.storage.local.get(['scrapedData'], function (result) {
        if (result.scrapedData && result.scrapedData.length > 0) {
            scrapedData = result.scrapedData;
            renderAllTabs(scrapedData);
        } else {
            // Show no data message in all tabs
            const noDataElement = createElementWithHTML('div', '<p>No scraped data found. Please run the scraper first.</p>', 'no-data');

            document.getElementById('overview-content').innerHTML = '';
            document.getElementById('overview-content').appendChild(noDataElement.cloneNode(true));

            document.getElementById('content-data').innerHTML = '';
            document.getElementById('content-data').appendChild(noDataElement.cloneNode(true));

            document.getElementById('media-data').innerHTML = '';
            document.getElementById('media-data').appendChild(noDataElement.cloneNode(true));

            document.getElementById('structure-data').innerHTML = '';
            document.getElementById('structure-data').appendChild(noDataElement.cloneNode(true));

            document.getElementById('raw-data').innerHTML = '';
            document.getElementById('raw-data').appendChild(noDataElement.cloneNode(true));

            document.getElementById('summary-stats').innerHTML = '';
            document.getElementById('summary-stats').appendChild(createElementWithHTML('div', '<p>No data available</p>', 'no-data'));

            document.getElementById('quick-links').innerHTML = '';
            document.getElementById('quick-links').appendChild(createElementWithHTML('div', '<p>No links available</p>', 'no-data'));
        }
    });
}

// Export as JSON
function exportAsJSON() {
    if (!scrapedData || scrapedData.length === 0) {
        alert('No data to export');
        return;
    }

    const blob = new Blob([JSON.stringify(scrapedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `u-scrap-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Export as CSV
function exportAsCSV() {
    if (!scrapedData || scrapedData.length === 0) {
        alert('No data to export');
        return;
    }

    // Convert JSON to CSV
    function jsonToCsv(jsonData) {
        if (!jsonData || jsonData.length === 0) return "";

        // Get all unique keys from all objects
        const allKeys = new Set();
        jsonData.forEach(item => {
            Object.keys(item).forEach(key => allKeys.add(key));
        });

        const keys = Array.from(allKeys);
        const csvRows = [];

        // Add header row
        csvRows.push(keys.map(key => `"${key}"`).join(","));

        // Add data rows
        jsonData.forEach(item => {
            const values = keys.map(key => {
                const value = item[key];
                if (value === null || value === undefined) return '""';
                if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(","));
        });

        return csvRows.join("\n");
    }

    const csvContent = jsonToCsv(scrapedData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const filename = `u-scrap-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Event listeners
refreshBtn.addEventListener('click', loadData);
exportJsonBtn.addEventListener('click', exportAsJSON);
exportCsvBtn.addEventListener('click', exportAsCSV);
closeBtn.addEventListener('click', function () {
    window.close();
});

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    setupTabNavigation();
    loadData();
});