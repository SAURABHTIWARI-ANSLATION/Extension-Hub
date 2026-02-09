// =============================================
// PARTICLE SYSTEM - Updated for Dark Theme
// =============================================
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.mouse = { x: 0, y: 0, radius: 100 };
    this.resize();
    this.init();
    this.animate();
    
    // Handle window resize
    window.addEventListener('resize', () => this.resize());
    
    // Mouse interaction
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = 0;
      this.mouse.y = 0;
    });
  }

  resize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.init(); // Reinitialize particles on resize
  }

  init() {
    this.particles = [];
    const particleCount = Math.min(Math.floor((this.canvas.width * this.canvas.height) / 8000), 60);
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        color: i % 3 === 0 ? '#8b5cf6' : i % 3 === 1 ? '#6366f1' : '#06b6d4'
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw gradient background
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      Math.max(this.canvas.width, this.canvas.height) / 1.5
    );
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
    gradient.addColorStop(1, 'rgba(10, 10, 26, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and draw particles
    this.particles.forEach((particle, i) => {
      // Mouse interaction
      const dx = this.mouse.x - particle.x;
      const dy = this.mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.mouse.radius) {
        const angle = Math.atan2(dy, dx);
        const force = (this.mouse.radius - distance) / this.mouse.radius;
        particle.vx -= Math.cos(angle) * force * 0.05;
        particle.vy -= Math.sin(angle) * force * 0.05;
      }
      
      // Update position with velocity dampening
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.99;
      particle.vy *= 0.99;
      
      // Wrap around edges
      if (particle.x < -10) particle.x = this.canvas.width + 10;
      if (particle.x > this.canvas.width + 10) particle.x = -10;
      if (particle.y < -10) particle.y = this.canvas.height + 10;
      if (particle.y > this.canvas.height + 10) particle.y = -10;
      
      // Draw particle
      this.ctx.beginPath();
      const particleGradient = this.ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.radius * 3
      );
      particleGradient.addColorStop(0, `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`);
      particleGradient.addColorStop(1, 'transparent');
      
      this.ctx.fillStyle = particleGradient;
      this.ctx.arc(particle.x, particle.y, particle.radius * 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw connections
      this.particles.forEach((otherParticle, j) => {
        if (i < j) { // Only draw each connection once
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            this.ctx.beginPath();
            const alpha = 0.15 * (1 - distance / 120);
            this.ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            this.ctx.lineWidth = 0.8;
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.lineTo(otherParticle.x, otherParticle.y);
            this.ctx.stroke();
          }
        }
      });
    });
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// =============================================
// NOTIFICATION SYSTEM
// =============================================
class NotificationSystem {
  constructor() {
    this.container = this.createContainer();
    this.queue = [];
    this.isShowing = false;
  }

  createContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
      background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(15, 15, 35, 0.95));
      backdrop-filter: blur(20px);
      border: 1px solid ${this.getBorderColor(type)};
      border-radius: 12px;
      padding: 12px 20px;
      color: #e0e7ff;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease;
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 300px;
      border-left: 4px solid ${this.getBorderColor(type)};
    `;

    // Add icon based on type
    const icon = this.getIcon(type);
    notification.innerHTML = `
      ${icon}
      <span style="flex: 1">${message}</span>
      <button class="notification-close" style="
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        font-size: 18px;
        line-height: 1;
      ">&times;</button>
    `;

    this.container.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 10);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.removeNotification(notification);
    });

    // Auto-remove
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
    }

    return notification;
  }

  removeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  getIcon(type) {
    const icons = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path><path d="M22 4L12 14.01l-3-3"></path></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M15 9l-6 6"></path><path d="M9 9l6 6"></path></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };
    return icons[type] || icons.info;
  }

  getBorderColor(type) {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#8b5cf6'
    };
    return colors[type] || colors.info;
  }
}

// =============================================
// SESSION MANAGER - Enhanced with new features
// =============================================
class SessionManager {
  constructor() {
    this.sessions = [];
    this.filteredSessions = [];
    this.currentMode = 'custom';
    this.settings = {
      autoSave: true,
      preservePinned: true,
      maxSessions: 50,
      confirmRestore: true
    };
    this.notifications = new NotificationSystem();
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      await this.loadData();
      this.renderSessions();
      this.attachEventListeners();
      this.setupKeyboardShortcuts();
      this.setupAutoRefresh();
      this.isInitialized = true;
      this.log('Session Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Session Manager:', error);
      this.showError('Failed to load sessions. Please refresh.');
    }
  }

  log(message, data = null) {
    console.log(`[Tab Context Saver] ${message}`, data || '');
  }

  async loadData() {
    const result = await chrome.storage.local.get(['sessions', 'settings']);
    this.sessions = result.sessions || [];
    this.settings = { ...this.settings, ...(result.settings || {}) };
    this.filteredSessions = [...this.sessions];
    
    // Debug logging
    this.log('Loaded sessions:', this.sessions.length);
    if (this.sessions.length > 0) {
      this.log('Session IDs:', this.sessions.map(s => ({ id: s.id, type: typeof s.id })));
      this.log('First session ID type:', typeof this.sessions[0].id, 'value:', this.sessions[0].id);
    }
  }

  async saveData() {
    await chrome.storage.local.set({ 
      sessions: this.sessions,
      settings: this.settings 
    });
  }

  async saveCurrentSession(name, mode) {
    if (!name || name.trim().length === 0) {
      this.notifications.show('Please enter a session name', 'warning');
      return;
    }

    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      
      if (tabs.length === 0) {
        this.notifications.show('No tabs to save', 'warning');
        return;
      }

      // Send to background script
      chrome.runtime.sendMessage({
        action: 'saveSession',
        data: {
          name: name.trim(),
          mode: mode || this.currentMode,
          tabCount: tabs.length
        }
      }, (response) => {
        if (response && response.success) {
          this.sessions.unshift(response.session);
          if (this.sessions.length > this.settings.maxSessions) {
            this.sessions = this.sessions.slice(0, this.settings.maxSessions);
          }
          this.filteredSessions = [...this.sessions];
          this.renderSessions();
          this.showTimeTravelEffect();
          this.notifications.show(`Session "${name}" saved!`, 'success');
        } else {
          this.notifications.show('Failed to save session', 'error');
        }
      });
    } catch (error) {
      this.log('Error saving session:', error);
      this.notifications.show('Failed to save session', 'error');
    }
  }

  async restoreSession(sessionId, bypassConfirm = false) {
    // Ensure sessionId is a number for proper comparison
    const sessionIdNum = typeof sessionId === 'string' ? parseInt(sessionId) : sessionId;
    
    this.log('Attempting to restore session:', { sessionId, sessionIdNum, type: typeof sessionId, idType: typeof sessionIdNum });
    this.log('Available sessions:', this.sessions.map(s => ({ id: s.id, name: s.name, idType: typeof s.id })));
    
    const session = this.sessions.find(s => s.id === sessionIdNum);
    if (!session) {
      this.notifications.show('Session not found', 'error');
      this.log('Session not found in list');
      return;
    }

    // Confirmation dialog
    if (this.settings.confirmRestore && !bypassConfirm) {
      const confirmed = await this.showConfirmation(
        'Restore Session',
        `Restore "${session.name}" with ${session.tabCount || session.tabs.length} tabs?`,
        'Restore',
        'Cancel'
      );
      if (!confirmed) return;
    }

    this.showTimeTravelEffect();
    this.notifications.show(`Restoring "${session.name}"...`, 'info');

    chrome.runtime.sendMessage({
      action: 'restoreSession',
      sessionId: sessionIdNum
    }, (response) => {
      if (response && response.success) {
        this.notifications.show(`Session restored successfully!`, 'success');
        // Close popup after delay
        setTimeout(() => {
          if (window.chrome && chrome.runtime) {
            window.close();
          }
        }, 800);
      } else {
        this.notifications.show(response?.error || 'Failed to restore session', 'error');
      }
    });
  }

  async deleteSession(sessionId, showUndo = true) {
    // Ensure sessionId is a number for proper comparison
    const sessionIdNum = typeof sessionId === 'string' ? parseInt(sessionId) : sessionId;
    
    this.log('Attempting to delete session:', { sessionId, sessionIdNum, type: typeof sessionId, idType: typeof sessionIdNum });
    this.log('Available sessions before deletion:', this.sessions.map(s => ({ id: s.id, name: s.name, idType: typeof s.id })));
    
    // Debug: Check each session for exact match
    this.sessions.forEach((s, index) => {
      this.log(`Session ${index}: id=${s.id} (type: ${typeof s.id}), looking for=${sessionIdNum} (type: ${typeof sessionIdNum}), match=${s.id === sessionIdNum}`);
    });
    
    const session = this.sessions.find(s => s.id === sessionIdNum);
    if (!session) {
      this.log('Session not found for deletion');
      return;
    }

    const sessionIndex = this.sessions.findIndex(s => s.id === sessionIdNum);
    const deletedSession = { ...session };

    // Optimistic UI update
    this.sessions.splice(sessionIndex, 1);
    this.filteredSessions = this.filteredSessions.filter(s => s.id !== sessionIdNum);
    this.renderSessions();
    
    this.log('Session removed from UI, remaining sessions:', this.sessions.length);

    // Actually delete from storage
    chrome.runtime.sendMessage({
      action: 'deleteSession',
      sessionId: sessionIdNum
    }, (response) => {
      if (response && response.success) {
        if (showUndo) {
          // Show undo notification
          this.showUndoNotification(
            `Session "${session.name}" deleted`,
            () => this.undoDelete(sessionIndex, deletedSession)
          );
        }
      } else {
        // Revert UI if deletion failed
        this.sessions.splice(sessionIndex, 0, deletedSession);
        this.filteredSessions = [...this.sessions];
        this.renderSessions();
        this.notifications.show('Failed to delete session', 'error');
      }
    });
  }

  async undoDelete(index, session) {
    this.sessions.splice(index, 0, session);
    this.filteredSessions = [...this.sessions];
    this.renderSessions();
    this.saveData();
    this.notifications.show('Session restored', 'success');
  }

  async switchMode(mode) {
    this.currentMode = mode;
    const modeSessions = this.sessions.filter(s => s.mode === mode);
    
    if (modeSessions.length > 0) {
      await this.restoreSession(modeSessions[0].id, true);
    } else {
      this.notifications.show(`No ${mode} sessions found`, 'info');
    }

    // Update active state of mode buttons
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.mode-btn[data-mode="${mode}"]`)?.classList.add('active');
  }

  renderSessions() {
    const sessionsList = document.getElementById('sessionsList');
    const emptyState = document.getElementById('emptyState');
    
    if (this.filteredSessions.length === 0) {
      sessionsList.innerHTML = '';
      emptyState.classList.add('show');
      return;
    }
    
    emptyState.classList.remove('show');
    
    sessionsList.innerHTML = this.filteredSessions.map(session => {
      const modeColors = {
        work: '#3b82f6',
        study: '#8b5cf6',
        entertainment: '#10b981',
        custom: '#f59e0b'
      };
      
      const color = modeColors[session.mode] || '#8b5cf6';
      
      // Debug logging for session card rendering
      this.log('Rendering session card:', { id: session.id, type: typeof session.id });
      
      return `
      <div class="session-card" data-session-id="${session.id}" style="--mode-color: ${color}">
        <div class="session-header">
          <div class="session-info">
            <div class="session-name">${this.escapeHtml(session.name)}</div>
            <div class="session-meta">
              <span class="session-timestamp">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${this.formatTimestamp(session.timestamp)}
              </span>
              <span class="session-tab-count">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"></path>
                </svg>
                ${session.tabCount || session.tabs.length} tabs
              </span>
            </div>
          </div>
          <div class="session-actions">
            <button class="session-action-btn restore-btn" title="Restore Session">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 102.13-9.36L1 10"></path>
              </svg>
            </button>
            <button class="session-action-btn delete-btn" title="Delete Session">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="session-mode-tag" style="
          background: ${color}15;
          color: ${color};
          border: 1px solid ${color}30;
          box-shadow: 0 0 10px ${color}20;
        ">
          ${this.capitalizeFirst(session.mode)}
        </div>
        <div class="session-visual">
          ${Array(Math.min(session.tabCount || session.tabs.length, 8))
            .fill(0)
            .map((_, i) => 
              `<div class="node" style="
                animation-delay: ${i * 0.2}s;
                background: linear-gradient(135deg, ${color}, ${this.lightenColor(color, 30)});
              "></div>`
            ).join('')}
          ${(session.tabCount || session.tabs.length) > 8 ? 
            `<span class="more-tabs">+${(session.tabCount || session.tabs.length) - 8} more</span>` : 
            ''}
        </div>
      </div>
    `}).join('');
    
    this.attachSessionListeners();
  }

  attachSessionListeners() {
    document.querySelectorAll('.session-card').forEach(card => {
      const sessionId = parseInt(card.dataset.sessionId);
      
      // Restore on card click
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.session-action-btn')) {
          this.restoreSession(sessionId);
        }
      });
      
      // Restore button
      card.querySelector('.restore-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.restoreSession(sessionId);
      });
      
      // Delete button
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
      } else {
        this.notifications.show('No sessions to restore', 'info');
      }
    });
    
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.switchMode(mode);
      });
    });
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filterSessions(e.target.value);
      }, 300);
    });
    
    // Clear search button
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        this.filterSessions('');
      }
    });
    
    // Modal events
    document.getElementById('cancelSaveBtn').addEventListener('click', () => {
      this.hideSaveModal();
    });
    
    document.getElementById('confirmSaveBtn').addEventListener('click', () => {
      const name = document.getElementById('sessionNameInput').value.trim();
      const selectedMode = document.querySelector('.mode-option.active');
      const mode = selectedMode ? selectedMode.dataset.mode : 'custom';
      
      this.saveCurrentSession(name, mode);
      this.hideSaveModal();
    });
    
    // Mode options in modal
    document.querySelectorAll('.mode-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.mode-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
      });
    });
    
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.notifications.show('Settings coming soon!', 'info');
    });
    
    // Keyboard shortcuts in modal
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('saveModal');
      if (modal.classList.contains('show')) {
        if (e.key === 'Escape') {
          this.hideSaveModal();
        } else if (e.key === 'Enter' && e.ctrlKey) {
          document.getElementById('confirmSaveBtn').click();
        }
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.showSaveModal();
      }
      
      // Ctrl/Cmd + F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
      }
    });
  }

  setupAutoRefresh() {
    // Refresh sessions every 30 seconds if popup is open
    this.refreshInterval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        await this.loadData();
        this.renderSessions();
      }
    }, 30000);
    
    // Also refresh when popup becomes visible
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        await this.loadData();
        this.renderSessions();
      }
    });
  }

  showSaveModal() {
    const modal = document.getElementById('saveModal');
    const input = document.getElementById('sessionNameInput');
    
    // Generate default name
    const defaultName = `Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    input.value = defaultName;
    
    modal.classList.add('show');
    input.focus();
    input.select();
  }

  hideSaveModal() {
    const modal = document.getElementById('saveModal');
    modal.classList.remove('show');
  }

  showTimeTravelEffect() {
    const overlay = document.getElementById('timeTravelOverlay');
    overlay.classList.add('active');
    
    // Add sound effect (optional)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // Audio not supported or blocked, ignore
    }
    
    setTimeout(() => overlay.classList.remove('active'), 1000);
  }

  filterSessions(query) {
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
      this.filteredSessions = [...this.sessions];
    } else {
      this.filteredSessions = this.sessions.filter(session => 
        session.name.toLowerCase().includes(lowerQuery) ||
        session.mode.toLowerCase().includes(lowerQuery) ||
        session.tabs.some(tab => 
          tab.title.toLowerCase().includes(lowerQuery) ||
          tab.url.toLowerCase().includes(lowerQuery)
        )
      );
    }
    
    this.renderSessions();
  }

  formatTimestamp(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }

  async showConfirmation(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'confirmation-modal';
      modal.innerHTML = `
        <div class="confirmation-backdrop"></div>
        <div class="confirmation-content">
          <h3>${title}</h3>
          <p>${message}</p>
          <div class="confirmation-actions">
            <button class="confirmation-cancel">${cancelText}</button>
            <button class="confirmation-confirm">${confirmText}</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const confirmBtn = modal.querySelector('.confirmation-confirm');
      const cancelBtn = modal.querySelector('.confirmation-cancel');
      
      const cleanup = () => {
        modal.remove();
      };
      
      confirmBtn.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });
      
      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });
      
      // Close on backdrop click
      modal.querySelector('.confirmation-backdrop').addEventListener('click', () => {
        cleanup();
        resolve(false);
      });
    });
  }

  showUndoNotification(message, undoCallback) {
    const notification = this.notifications.show(
      `${message} <button class="undo-btn" style="
        background: rgba(99, 102, 241, 0.2);
        border: 1px solid rgba(99, 102, 241, 0.4);
        color: #8b5cf6;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        margin-left: 8px;
        transition: all 0.2s;
      ">Undo</button>`,
      'info',
      5000
    );
    
    // Attach undo handler
    setTimeout(() => {
      const undoBtn = notification.querySelector('.undo-btn');
      if (undoBtn) {
        undoBtn.addEventListener('click', () => {
          undoCallback();
          this.notifications.removeNotification(notification);
        });
      }
    }, 100);
  }

  showError(message) {
    this.notifications.show(message, 'error');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (
      0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  }

  cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// =============================================
// INITIALIZATION
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize particle system
  const canvas = document.getElementById('particleCanvas');
  const particleSystem = new ParticleSystem(canvas);
  
  // Initialize session manager
  const sessionManager = new SessionManager();
  
  // Cleanup on page unload
  window.addEventListener('unload', () => {
    particleSystem.destroy();
    sessionManager.cleanup();
  });
  
  // Add some debug info
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     Tab Context Saver v1.1.0            ║
  ║     Time-travel for your tabs           ║
  ╚══════════════════════════════════════════╝
  
  Shortcuts:
  • Ctrl/Cmd + S: Save session
  • Ctrl/Cmd + F: Search sessions
  • Esc: Close modal/clear search
  
  Ready to travel through time! 🚀
  `);
});