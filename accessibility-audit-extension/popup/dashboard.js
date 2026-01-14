// dashboard.js
class AccessibilityDashboard {
    constructor() {
        this.reports = [];
        this.init();
    }
    
    async init() {
        // Load data
        await this.loadReports();
        
        // Setup event listeners
        document.getElementById('newScanBtn').addEventListener('click', () => this.newScan());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());
        document.getElementById('exportAllBtn').addEventListener('click', () => this.exportAllData());
        document.getElementById('startScanningBtn').addEventListener('click', () => this.newScan());
        
        // Render dashboard
        this.renderDashboard();
    }
    
    async loadReports() {
        try {
            const response = await new Promise(resolve => {
                chrome.runtime.sendMessage({ type: 'GET_REPORTS' }, resolve);
            });
            
            this.reports = response.reports || [];
            
            // Hide loading, show appropriate state
            document.getElementById('loadingState').style.display = 'none';
            
            if (this.reports.length === 0) {
                document.getElementById('emptyState').style.display = 'block';
            } else {
                document.getElementById('emptyState').style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to load reports:', error);
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('emptyState').style.display = 'block';
        }
    }
    
    renderDashboard() {
        if (this.reports.length === 0) return;
        
        this.updateSummaryCards();
        this.renderRecentScans();
        this.renderCategoryBreakdown();
        this.renderCharts();
    }
    
    updateSummaryCards() {
        const totalScans = this.reports.length;
        const avgScore = Math.round(this.reports.reduce((sum, r) => sum + r.score, 0) / totalScans);
        const latestScore = this.reports[0]?.score || 0;
        
        // Calculate trend
        let trendIndicator = '→';
        let trendColor = '#6b7280';
        
        if (this.reports.length >= 2) {
            const current = this.reports[0].score;
            const previous = this.reports[1].score;
            
            if (current > previous + 5) {
                trendIndicator = '📈';
                trendColor = '#10b981';
            } else if (current < previous - 5) {
                trendIndicator = '📉';
                trendColor = '#ef4444';
            }
        }
        
        // Update DOM
        document.getElementById('overallScore').textContent = latestScore;
        document.getElementById('totalScans').textContent = totalScans;
        document.getElementById('avgScore').textContent = avgScore;
        
        const trendElement = document.getElementById('trendIndicator');
        trendElement.textContent = trendIndicator;
        trendElement.style.color = trendColor;
    }
    
    renderRecentScans() {
        const tbody = document.getElementById('scansTableBody');
        tbody.innerHTML = '';
        
        // Show only latest 10 scans
        const recentScans = this.reports.slice(0, 10);
        
        recentScans.forEach(report => {
            const row = document.createElement('tr');
            
            // Format date
            const date = new Date(report.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Get score badge class
            let badgeClass = '';
            let badgeText = '';
            
            if (report.score >= 90) {
                badgeClass = 'score-excellent';
                badgeText = 'Excellent';
            } else if (report.score >= 80) {
                badgeClass = 'score-good';
                badgeText = 'Good';
            } else if (report.score >= 70) {
                badgeClass = 'score-fair';
                badgeText = 'Fair';
            } else {
                badgeClass = 'score-poor';
                badgeText = 'Poor';
            }
            
            // Count total issues
            const totalIssues = report.checks ? 
                Object.values(report.checks).reduce((sum, check) => sum + (check.issues?.length || 0), 0) : 0;
            
            row.innerHTML = `
                <td>
                    <div style="font-weight: 500;">${dateStr}</div>
                    <div style="font-size: 12px; color: #6b7280;">${timeStr}</div>
                </td>
                <td>
                    <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${report.stats?.pageTitle || 'Untitled Page'}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">
                        ${report.stats?.url ? new URL(report.stats.url).hostname : ''}
                    </div>
                </td>
                <td>
                    <span style="font-weight: bold; font-size: 18px;">${report.score}</span>
                    <span style="font-size: 12px; color: #6b7280;">/100</span>
                </td>
                <td>
                    <span class="score-badge ${badgeClass}">${badgeText}</span>
                </td>
                <td>${totalIssues} issues</td>
                <td>
                    <button onclick="dashboard.viewReport('${report.id}')" 
                            style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        View Details
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    renderCategoryBreakdown() {
        const container = document.getElementById('categoryBreakdown');
        container.innerHTML = '';
        
        // Get latest report
        const latestReport = this.reports[0];
        if (!latestReport?.checks) return;
        
        const categories = [
            { key: 'contrast', name: 'Color Contrast', icon: '🎨' },
            { key: 'images', name: 'Images', icon: '🖼️' },
            { key: 'headings', name: 'Headings', icon: '#️⃣' },
            { key: 'forms', name: 'Forms', icon: '📝' },
            { key: 'navigation', name: 'Navigation', icon: '🧭' },
            { key: 'semantics', name: 'Semantics', icon: '🏷️' }
        ];
        
        categories.forEach(category => {
            const check = latestReport.checks[category.key];
            if (!check || check.total === 0) return;
            
            const percentage = Math.round((check.passed / check.total) * 100);
            
            const item = document.createElement('div');
            item.className = 'card';
            item.innerHTML = `
                <div class="category-item">
                    <div style="font-size: 24px;">${category.icon}</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-weight: 500;">${category.name}</span>
                            <span style="font-weight: bold; color: ${this.getScoreColor(percentage)}">
                                ${percentage}%
                            </span>
                        </div>
                        <div class="category-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #6b7280;">
                            <span>${check.passed} passed</span>
                            <span>${check.total} total</span>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    renderCharts() {
        // Simple text-based chart for score history
        const scoreChart = document.getElementById('scoreChart');
        
        if (this.reports.length >= 2) {
            const scores = this.reports.slice(0, 10).map(r => r.score);
            const maxScore = Math.max(...scores, 100);
            const minScore = Math.min(...scores, 0);
            
            let chartHTML = '<div style="height: 250px; display: flex; align-items: flex-end; gap: 10px;">';
            
            scores.forEach((score, index) => {
                const height = (score / maxScore) * 200;
                const date = new Date(this.reports[index].timestamp);
                const day = date.getDate();
                const month = date.toLocaleString('default', { month: 'short' });
                
                chartHTML += `
                    <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                        <div style="width: 100%; background: linear-gradient(to top, #667eea, #764ba2); 
                                    height: ${height}px; border-radius: 4px 4px 0 0;"></div>
                        <div style="margin-top: 8px; font-size: 12px; font-weight: bold;">${score}</div>
                        <div style="font-size: 10px; color: #6b7280;">${day} ${month}</div>
                    </div>
                `;
            });
            
            chartHTML += '</div>';
            scoreChart.innerHTML = chartHTML;
        }
        
        // Category distribution pie chart (simplified)
        const categoryChart = document.getElementById('categoryChart');
        const latestReport = this.reports[0];
        
        if (latestReport?.checks) {
            let totalIssues = 0;
            const categoryData = [];
            
            Object.entries(latestReport.checks).forEach(([key, check]) => {
                if (check.issues?.length > 0) {
                    totalIssues += check.issues.length;
                    categoryData.push({
                        name: key.charAt(0).toUpperCase() + key.slice(1),
                        issues: check.issues.length,
                        color: this.getCategoryColor(key)
                    });
                }
            });
            
            if (totalIssues > 0) {
                let chartHTML = '<div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: center;">';
                
                // Legend
                chartHTML += '<div style="flex: 1; min-width: 150px;">';
                categoryData.forEach(cat => {
                    const percentage = Math.round((cat.issues / totalIssues) * 100);
                    chartHTML += `
                        <div style="display: flex; align-items: center; margin-bottom: 12px;">
                            <div style="width: 12px; height: 12px; background: ${cat.color}; 
                                        border-radius: 2px; margin-right: 8px;"></div>
                            <div style="flex: 1; font-size: 14px;">${cat.name}</div>
                            <div style="font-weight: bold;">${percentage}%</div>
                        </div>
                    `;
                });
                chartHTML += '</div>';
                
                // Simple pie chart visualization
                chartHTML += '<div style="width: 150px; height: 150px; position: relative;">';
                
                let cumulativeAngle = 0;
                categoryData.forEach(cat => {
                    const percentage = cat.issues / totalIssues;
                    const angle = percentage * 360;
                    
                    if (angle > 0) {
                        chartHTML += `
                            <div style="
                                position: absolute;
                                width: 150px;
                                height: 150px;
                                border-radius: 50%;
                                background: conic-gradient(
                                    from ${cumulativeAngle}deg,
                                    ${cat.color} 0deg ${angle}deg,
                                    transparent ${angle}deg 360deg
                                );
                            "></div>
                        `;
                        cumulativeAngle += angle;
                    }
                });
                
                chartHTML += `
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 60px;
                        height: 60px;
                        background: white;
                        border-radius: 50%;
                    "></div>
                `;
                chartHTML += '</div>';
                chartHTML += '</div>';
                
                categoryChart.innerHTML = chartHTML;
            } else {
                categoryChart.innerHTML = '<div style="text-align: center; padding: 40px;">🎉 No issues found in latest scan!</div>';
            }
        }
    }
    
    getScoreColor(score) {
        if (score >= 90) return '#10b981';
        if (score >= 80) return '#3b82f6';
        if (score >= 70) return '#f59e0b';
        return '#ef4444';
    }
    
    getCategoryColor(category) {
        const colors = {
            contrast: '#ef4444',
            images: '#f59e0b',
            headings: '#3b82f6',
            forms: '#8b5cf6',
            navigation: '#10b981',
            semantics: '#06b6d4'
        };
        return colors[category] || '#667eea';
    }
    
    viewReport(reportId) {
        const report = this.reports.find(r => r.id === parseInt(reportId) || r.id === reportId);
        if (!report) return;
        
        // Create modal with report details
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        `;
        
        const date = new Date(report.timestamp);
        const dateStr = date.toLocaleString();
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 16px;
                padding: 30px;
                width: 100%;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            ">
                <button onclick="this.parentElement.remove()" 
                        style="position: absolute; top: 15px; right: 15px; background: none; border: none; 
                               font-size: 24px; cursor: pointer; color: #6b7280;">
                    ×
                </button>
                
                <h2 style="margin-bottom: 20px; color: #1f2937;">Accessibility Report</h2>
                
                <div style="display: flex; gap: 30px; margin-bottom: 30px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <h3 style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">SCORE</h3>
                        <div style="font-size: 48px; font-weight: bold; color: ${this.getScoreColor(report.score)}">
                            ${report.score}
                        </div>
                        <div style="font-size: 14px; color: #6b7280;">/100 • Grade: ${report.grade}</div>
                    </div>
                    
                    <div style="flex: 2; min-width: 300px;">
                        <h3 style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">PAGE INFO</h3>
                        <div style="font-weight: 500; margin-bottom: 4px;">${report.stats?.pageTitle || 'Untitled Page'}</div>
                        <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">${report.stats?.url || ''}</div>
                        <div style="font-size: 14px; color: #6b7280;">Scanned: ${dateStr}</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h3 style="font-size: 14px; color: #6b7280; margin-bottom: 12px;">SUGGESTIONS</h3>
                    <div style="background: #f9fafb; border-radius: 8px; padding: 20px;">
                        ${report.suggestions && report.suggestions.length > 0 ? 
                            report.suggestions.map(s => `
                                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; 
                                            ${s === report.suggestions[report.suggestions.length - 1] ? 'border-bottom: none;' : ''}">
                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; 
                                                  font-size: 12px; font-weight: bold; 
                                                  background: ${s.priority === 'high' ? '#fee2e2' : s.priority === 'medium' ? '#fef3c7' : '#dbeafe'}; 
                                                  color: ${s.priority === 'high' ? '#991b1b' : s.priority === 'medium' ? '#92400e' : '#1e40af'}">
                                            ${s.priority.toUpperCase()}
                                        </span>
                                        <strong>${s.category}</strong>
                                    </div>
                                    <div style="font-size: 14px;">${s.suggestion}</div>
                                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                                        <strong>Fix:</strong> ${s.fix}
                                    </div>
                                </div>
                            `).join('') : 
                            '<div style="text-align: center; color: #6b7280; padding: 20px;">🎉 No suggestions - great job!</div>'
                        }
                    </div>
                </div>
                
                <button onclick="dashboard.downloadReport('${report.id}')" 
                        style="padding: 12px 24px; background: #667eea; color: white; border: none; 
                               border-radius: 8px; cursor: pointer; font-weight: 600;">
                    📥 Download Full Report (JSON)
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    downloadReport(reportId) {
        const report = this.reports.find(r => r.id === parseInt(reportId) || r.id === reportId);
        if (!report) return;
        
        const data = {
            ...report,
            exportedAt: new Date().toISOString(),
            tool: 'Accessibility Score Calculator'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accessibility-report-${report.id || Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    async newScan() {
        // Open popup or redirect to extension popup
        chrome.runtime.sendMessage({ 
            type: 'OPEN_SCANNER' 
        });
    }
    
    async refreshData() {
        document.getElementById('loadingState').style.display = 'flex';
        document.getElementById('emptyState').style.display = 'none';
        
        await this.loadReports();
        this.renderDashboard();
    }
    
    async exportAllData() {
        const allData = {
            reports: this.reports,
            summary: {
                totalScans: this.reports.length,
                averageScore: Math.round(this.reports.reduce((sum, r) => sum + r.score, 0) / this.reports.length),
                generatedAt: new Date().toISOString()
            }
        };
        
        const blob = new Blob([JSON.stringify(allData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accessibility-audit-history-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AccessibilityDashboard();
    window.dashboard = dashboard; // Make globally accessible
});