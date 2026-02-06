// Particle Animation for Background
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.resize();
    this.init();
    this.animate();
    
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  }

  init() {
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and draw particles
    this.particles.forEach((particle, i) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;
      
      // Draw particle
      this.ctx.beginPath();
      const gradient = this.ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.radius * 2
      );
      gradient.addColorStop(0, `rgba(126, 34, 206, ${particle.opacity})`);
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.arc(particle.x, particle.y, particle.radius * 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw connections
      this.particles.forEach((otherParticle, j) => {
        if (i !== j) {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(126, 34, 206, ${0.1 * (1 - distance / 100)})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.lineTo(otherParticle.x, otherParticle.y);
            this.ctx.stroke();
          }
        }
      });
    });
    
    requestAnimationFrame(() => this.animate());
  }
}

// Session Manager
class SessionManager {
  constructor() {
    this.sessions = [];
    this.currentMode = 'custom';
    this.init();
  }

  async init() {
    await this.loadSessions();
    this.renderSessions();
    this.attachEventListeners();
  }

  async loadSessions() {
    const result = await chrome.storage.local.get(['sessions']);
    this.sessions = result.sessions || [];
  }

  async saveSessions() {
    await chrome.storage.local.set({ sessions: this.sessions });
  }

  async saveCurrentSession(name, mode) {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const session = {
      id: Date.now(),
      name: name || `Session ${this.sessions.length + 1}`,
      mode: mode || this.currentMode,
      timestamp: Date.now(),
      tabs: tabs.map(tab => ({
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl
      }))
    };
    
    this.sessions.unshift(session);
    await this.saveSessions();
    this.renderSessions();
    this.showTimeTravelEffect();
  }

  async restoreSession(sessionId) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    this.showTimeTravelEffect();
    
    // Close current tabs
    const currentTabs = await chrome.tabs.query({ currentWindow: true });
    const tabIds = currentTabs.map(tab => tab.id);
    await chrome.tabs.remove(tabIds);
    
    // Open session tabs
    for (const tab of session.tabs) {
      await chrome.tabs.create({ url: tab.url, active: false });
    }
  }

  async deleteSession(sessionId) {
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
    await this.saveSessions();
    this.renderSessions();
  }

  async switchMode(mode) {
    const modeSessions = this.sessions.filter(s => s.mode === mode);
    if (modeSessions.length > 0) {
      await this.restoreSession(modeSessions[0].id);
    }
  }

  renderSessions() {
    const sessionsList = document.getElementById('sessionsList');
    const emptyState = document.getElementById('emptyState');
    
    if (this.sessions.length === 0) {
      sessionsList.innerHTML = '';
      emptyState.classList.add('show');
      return;
    }
    
    emptyState.classList.remove('show');
    
    sessionsList.innerHTML = this.sessions.map(session => `
      <div class="session-card" data-session-id="${session.id}">
        <div class="session-header">
          <div class="session-info">
            <div class="session-name">${this.escapeHtml(session.name)}</div>
            <div class="session-meta">
              <span class="session-timestamp">
                🕐 ${this.formatTimestamp(session.timestamp)}
              </span>
              <span class="session-tab-count">
                ${session.tabs.length} tabs
              </span>
            </div>
          </div>
          <div class="session-actions">
            <button class="session-action-btn restore-btn" title="Restore">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 102.13-9.36L1 10"></path>
              </svg>
            </button>
            <button class="session-action-btn delete-btn" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="session-mode-tag ${session.mode}">${session.mode}</div>
        <div class="session-visual">
          ${Array(Math.min(session.tabs.length, 10)).fill('<div class="node"></div>').join('')}
        </div>
      </div>
    `).join('');
    
    // Attach event listeners to session cards
    this.attachSessionListeners();
  }

  attachSessionListeners() {
    document.querySelectorAll('.session-card').forEach(card => {
      const sessionId = parseInt(card.dataset.sessionId);
      
      card.querySelector('.restore-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.restoreSession(sessionId);
      });
      
      card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteSession(sessionId);
      });
    });
  }

  attachEventListeners() {
    // Save button
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.showSaveModal();
    });
    
    // Restore last session button
    document.getElementById('restoreBtn').addEventListener('click', () => {
      if (this.sessions.length > 0) {
        this.restoreSession(this.sessions[0].id);
      }
    });
    
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.switchMode(mode);
        
        // Update active state
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.filterSessions(e.target.value);
    });
    
    // Modal events
    document.getElementById('cancelSaveBtn').addEventListener('click', () => {
      this.hideSaveModal();
    });
    
    document.getElementById('confirmSaveBtn').addEventListener('click', () => {
      const name = document.getElementById('sessionNameInput').value.trim();
      const selectedMode = document.querySelector('.mode-option.active');
      const mode = selectedMode ? selectedMode.dataset.mode : 'custom';
      
      if (name) {
        this.saveCurrentSession(name, mode);
        this.hideSaveModal();
      }
    });
    
    // Mode options in modal
    document.querySelectorAll('.mode-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.mode-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
      });
    });
    
    // Ripple effect
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        const container = this.querySelector('.ripple-container');
        if (container) {
          container.appendChild(ripple);
          setTimeout(() => ripple.remove(), 600);
        }
      });
    });
  }

  showSaveModal() {
    const modal = document.getElementById('saveModal');
    modal.classList.add('show');
    document.getElementById('sessionNameInput').focus();
  }

  hideSaveModal() {
    const modal = document.getElementById('saveModal');
    modal.classList.remove('show');
    document.getElementById('sessionNameInput').value = '';
  }

  showTimeTravelEffect() {
    const overlay = document.getElementById('timeTravelOverlay');
    overlay.classList.add('active');
    setTimeout(() => overlay.classList.remove('active'), 1000);
  }

  filterSessions(query) {
    const lowerQuery = query.toLowerCase();
    const filteredSessions = this.sessions.filter(session => 
      session.name.toLowerCase().includes(lowerQuery) ||
      session.mode.toLowerCase().includes(lowerQuery)
    );
    
    const sessionsList = document.getElementById('sessionsList');
    if (filteredSessions.length === 0) {
      sessionsList.innerHTML = '<div class="empty-state show"><p>No sessions found</p></div>';
      return;
    }
    
    // Re-render with filtered sessions
    const originalSessions = this.sessions;
    this.sessions = filteredSessions;
    this.renderSessions();
    this.sessions = originalSessions;
  }

  formatTimestamp(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize on popup load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize particle system
  const canvas = document.getElementById('particleCanvas');
  new ParticleSystem(canvas);
  
  // Initialize session manager
  new SessionManager();
});
