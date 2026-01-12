// preview.js - Handles the data preview functionality

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

// Render overview tab
function renderOverview(data) {
    if (!data || data.length === 0) {
        document.getElementById('overview-content').innerHTML = '<div class="no-data"><p>No data available to display</p></div>';
        return;
    }

    const item = data[0];
    let html = '';

    // Page information
    html += `
        <div class="section">
            <h2 class="section-title">📄 Page Information</h2>
            <div class="data-grid">
                <div class="data-card">
                    <h3>Basic Info</h3>
                    <div class="data-item">
                        <div class="data-label">Title</div>
                        <div class="data-value">${item.title || 'Untitled Page'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">URL</div>
                        <div class="data-value"><a href="${item.url}" class="url-link" target="_blank">${item.url}</a></div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Description</div>
                        <div class="data-value">${item.description || 'No description available'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Scraped At</div>
                        <div class="data-value">${item.scrapedAt ? new Date(item.scrapedAt).toLocaleString() : 'Unknown'}</div>
                    </div>
                </div>
                
                <div class="data-card">
                    <h3>Content Summary</h3>
                    <div class="data-item">
                        <div class="data-label">Headings</div>
                        <div class="data-value">${item.headings ? item.headings.length : 0} headings</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Paragraphs</div>
                        <div class="data-value">${item.paragraphs ? item.paragraphs.length : 0} paragraphs</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Images</div>
                        <div class="data-value">${item.images ? item.images.length : 0} images</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Links</div>
                        <div class="data-value">${(item.links?.internal?.length || 0) + (item.links?.external?.length || 0)} links</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Quick preview of content
    html += `
        <div class="section">
            <h2 class="section-title">🔍 Quick Preview</h2>
    `;

    // Show first few headings
    if (item.headings && item.headings.length > 0) {
        html += `
            <div class="data-card">
                <h3>Headings</h3>
        `;
        item.headings.slice(0, 5).forEach(heading => {
            html += `
                <div class="data-item">
                    <div class="data-label">${heading.tag.toUpperCase()}</div>
                    <div class="data-value">${heading.text}</div>
                </div>
            `;
        });
        html += `</div>`;
    }

    // Show first few paragraphs
    if (item.paragraphs && item.paragraphs.length > 0) {
        html += `
            <div class="data-card">
                <h3>Paragraphs</h3>
        `;
        item.paragraphs.slice(0, 3).forEach(paragraph => {
            if (paragraph.trim() !== '') {
                html += `
                    <div class="data-item">
                        <div class="data-value">${paragraph.substring(0, 200)}${paragraph.length > 200 ? '...' : ''}</div>
                    </div>
                `;
            }
        });
        html += `</div>`;
    }

    html += `</div>`;

    document.getElementById('overview-content').innerHTML = html;
}

// Render content tab
function renderContent(data) {
    if (!data || data.length === 0) {
        document.getElementById('content-data').innerHTML = '<div class="no-data"><p>No data available to display</p></div>';
        return;
    }

    const item = data[0];
    let html = '';

    // Headings
    if (item.headings && item.headings.length > 0) {
        html += `
            <div class="section">
                <h2 class="section-title">🔤 Headings</h2>
                <div class="data-grid">
        `;
        item.headings.forEach(heading => {
            html += `
                <div class="data-card">
                    <h3>${heading.tag.toUpperCase()}</h3>
                    <div class="data-value">${heading.text}</div>
                </div>
            `;
        });
        html += `</div></div>`;
    }

    // Paragraphs
    if (item.paragraphs && item.paragraphs.length > 0) {
        html += `
            <div class="section">
                <h2 class="section-title">📝 Paragraphs</h2>
                <div class="data-grid">
        `;
        item.paragraphs.slice(0, 10).forEach(paragraph => {
            if (paragraph.trim() !== '') {
                html += `
                    <div class="data-card">
                        <div class="data-value">${paragraph}</div>
                    </div>
                `;
            }
        });
        html += `</div></div>`;
    }

    // Lists
    if (item.lists && item.lists.length > 0) {
        html += `
            <div class="section">
                <h2 class="section-title">📋 Lists</h2>
        `;
        item.lists.slice(0, 5).forEach((list, index) => {
            html += `
                <div class="data-card">
                    <h3>List ${index + 1}</h3>
                    <div class="list-container">
                        <ul>
            `;
            list.slice(0, 10).forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `
                        </ul>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    // Tables
    if (item.tables && item.tables.length > 0) {
        html += `
            <div class="section">
                <h2 class="section-title">📊 Tables</h2>
        `;
        item.tables.slice(0, 2).forEach((table, index) => {
            html += `
                <div class="data-card">
                    <h3>Table ${index + 1}</h3>
                    <div class="table-container">
                        <table>
            `;
            table.forEach((row, rowIndex) => {
                html += '<tr>';
                row.forEach(cell => {
                    const tag = rowIndex === 0 ? 'th' : 'td';
                    html += `<${tag}>${cell || ''}</${tag}>`;
                });
                html += '</tr>';
            });
            html += `
                        </table>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    document.getElementById('content-data').innerHTML = html || '<div class="no-data"><p>No content data available</p></div>';
}

// Render media tab
function renderMedia(data) {
    if (!data || data.length === 0) {
        document.getElementById('media-data').innerHTML = '<div class="no-data"><p>No data available to display</p></div>';
        return;
    }

    const item = data[0];
    let html = '';

    // Images
    if (item.images && item.images.length > 0) {
        html += `
            <div class="section">
                <h2 class="section-title">🖼️ Images</h2>
                <div class="image-gallery">
        `;
        item.images.slice(0, 12).forEach(image => {
            if (image.src) {
                html += `
                    <div class="image-item">
                        <img src="${image.src}" alt="${image.alt || 'No description'}" onerror="this.parentElement.style.display='none'">
                        <div class="image-alt" title="${image.alt || 'No alt text'}">${image.alt || 'No alt text'}</div>
                    </div>
                `;
            }
        });
        html += `</div></div>`;
    }

    // Videos
    if (item.videos && item.videos.length > 0) {
        html += `
            <div class="section">
                <h2 class="section-title">🎬 Videos</h2>
                <div class="data-grid">
        `;
        item.videos.slice(0, 5).forEach((video, index) => {
            html += `
                <div class="data-card">
                    <h3>Video ${index + 1}</h3>
                    <div class="data-item">
                        <div class="data-label">Source</div>
                        <div class="data-value">${video.src || 'None'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Poster</div>
                        <div class="data-value">${video.poster || 'None'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Controls</div>
                        <div class="data-value">${video.controls ? 'Yes' : 'No'}</div>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
    }

    // Audio
    if (item.audios && item.audios.length > 0) {
        html += `
            <div class="section">
                <h2 class="section-title">🎵 Audio</h2>
                <div class="data-grid">
        `;
        item.audios.slice(0, 5).forEach((audio, index) => {
            html += `
                <div class="data-card">
                    <h3>Audio ${index + 1}</h3>
                    <div class="data-item">
                        <div class="data-label">Source</div>
                        <div class="data-value">${audio.src || 'None'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Controls</div>
                        <div class="data-value">${audio.controls ? 'Yes' : 'No'}</div>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
    }

    document.getElementById('media-data').innerHTML = html || '<div class="no-data"><p>No media data available</p></div>';
}

// Render structure tab
function renderStructure(data) {
    if (!data || data.length === 0) {
        document.getElementById('structure-data').innerHTML = '<div class="no-data"><p>No data available to display</p></div>';
        return;
    }

    const item = data[0];
    let html = '';

    // Links
    if (item.links) {
        html += `
            <div class="section">
                <h2 class="section-title">🔗 Links</h2>
        `;
        
        if (item.links.internal && item.links.internal.length > 0) {
            html += `
                <div class="data-card">
                    <h3>Internal Links (${item.links.internal.length})</h3>
            `;
            item.links.internal.slice(0, 10).forEach(link => {
                html += `
                    <div class="data-item">
                        <div class="data-value"><a href="${link}" class="url-link" target="_blank">${link}</a></div>
                    </div>
                `;
            });
            html += `</div>`;
        }
        
        if (item.links.external && item.links.external.length > 0) {
            html += `
                <div class="data-card">
                    <h3>External Links (${item.links.external.length})</h3>
            `;
            item.links.external.slice(0, 10).forEach(link => {
                html += `
                    <div class="data-item">
                        <div class="data-value"><a href="${link}" class="url-link" target="_blank">${link}</a></div>
                    </div>
                `;
            });
            html += `</div>`;
        }
        
        html += `</div>`;
    }

    // Forms
    if (item.forms && item.forms.length > 0) {
        html += `
            <div class="section">
                <h2 class="section-title">📝 Forms</h2>
                <div class="data-grid">
        `;
        item.forms.forEach((form, index) => {
            html += `
                <div class="data-card">
                    <h3>Form ${index + 1}</h3>
                    <div class="data-item">
                        <div class="data-label">Action</div>
                        <div class="data-value">${form.action || 'None'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Method</div>
                        <div class="data-value">${form.method || 'GET'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Inputs (${form.inputs.length})</div>
                        <div class="list-container">
                            <ul>
            `;
            form.inputs.forEach(input => {
                html += `<li>${input.name} (${input.type}) ${input.required ? '(required)' : ''}</li>`;
            });
            html += `
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
    }

    // Iframes
    if (item.iframes && item.iframes.length > 0) {
        html += `
            <div class="section">
                <h2 class="section-title">🔲 Iframes</h2>
                <div class="data-grid">
        `;
        item.iframes.slice(0, 5).forEach((iframe, index) => {
            html += `
                <div class="data-card">
                    <h3>Iframe ${index + 1}</h3>
                    <div class="data-item">
                        <div class="data-label">Source</div>
                        <div class="data-value">${iframe.src || 'None'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Title</div>
                        <div class="data-value">${iframe.title || 'No title'}</div>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
    }

    document.getElementById('structure-data').innerHTML = html || '<div class="no-data"><p>No structure data available</p></div>';
}

// Render raw data tab
function renderRawData(data) {
    if (!data || data.length === 0) {
        document.getElementById('raw-data').innerHTML = '<div class="no-data"><p>No data available to display</p></div>';
        return;
    }

    const item = data[0];
    const html = `
        <div class="section">
            <h2 class="section-title">💻 Raw JSON Data</h2>
            <div class="json-preview">${syntaxHighlight(JSON.stringify(item, null, 2))}</div>
        </div>
    `;

    document.getElementById('raw-data').innerHTML = html;
}

// Render summary statistics
function renderSummary(data) {
    if (!data || data.length === 0) {
        document.getElementById('summary-stats').innerHTML = '<div class="no-data"><p>No data available</p></div>';
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

    let html = '<div class="stats-grid">';
    stats.forEach(stat => {
        html += `
            <div class="stat-card">
                <div class="stat-value">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
            </div>
        `;
    });
    html += '</div>';

    document.getElementById('summary-stats').innerHTML = html;
}

// Render quick links
function renderQuickLinks(data) {
    if (!data || data.length === 0) {
        document.getElementById('quick-links').innerHTML = '<div class="no-data"><p>No links available</p></div>';
        return;
    }

    const item = data[0];
    
    if (!item.links) {
        document.getElementById('quick-links').innerHTML = '<div class="no-data"><p>No links available</p></div>';
        return;
    }

    const allLinks = [...(item.links.internal || []), ...(item.links.external || [])];
    
    if (allLinks.length === 0) {
        document.getElementById('quick-links').innerHTML = '<div class="no-data"><p>No links available</p></div>';
        return;
    }

    let html = '<div class="list-container"><ul>';
    allLinks.slice(0, 10).forEach(link => {
        html += `<li><a href="${link}" class="url-link" target="_blank">${link}</a></li>`;
    });
    html += '</ul></div>';

    document.getElementById('quick-links').innerHTML = html;
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
    chrome.storage.local.get(['scrapedData'], function(result) {
        if (result.scrapedData && result.scrapedData.length > 0) {
            scrapedData = result.scrapedData;
            renderAllTabs(scrapedData);
        } else {
            // Show no data message in all tabs
            const noDataHtml = '<div class="no-data"><p>No scraped data found. Please run the scraper first.</p></div>';
            document.getElementById('overview-content').innerHTML = noDataHtml;
            document.getElementById('content-data').innerHTML = noDataHtml;
            document.getElementById('media-data').innerHTML = noDataHtml;
            document.getElementById('structure-data').innerHTML = noDataHtml;
            document.getElementById('raw-data').innerHTML = noDataHtml;
            document.getElementById('summary-stats').innerHTML = '<div class="no-data"><p>No data available</p></div>';
            document.getElementById('quick-links').innerHTML = '<div class="no-data"><p>No links available</p></div>';
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
    const filename = `easy-scraper-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    
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
    const filename = `easy-scraper-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    
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
closeBtn.addEventListener('click', function() {
    window.close();
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupTabNavigation();
    loadData();
});