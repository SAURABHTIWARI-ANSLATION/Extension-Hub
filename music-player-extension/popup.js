class MusicPlayerPopup {
    constructor() {
        this.audioPlayer = document.getElementById('audio-player-small');
        this.tracks = [];
        this.playlists = [
            {
                id: 'default',
                name: 'All Songs',
                trackIds: [],
                createdAt: new Date().toISOString(),
                trackCount: 0
            }
        ];
        this.currentTrackIndex = -1;
        this.isPlaying = false;
        this.db = null;
        this.dbName = 'MusicPlayerDB';
        this.dbVersion = 1;
        this.usingBackgroundPlayback = false;
        this.backgroundPlaybackInitialized = false;
        
        this.init();
    }
    
    async init() {
        await this.initDatabase();
        await this.loadData();
        this.setupEventListeners();
        this.setupBackgroundCommunication();
        this.render();
        this.updateStats();
        await this.checkBackgroundStatus();
        this.setupUnloadHandlers();
    }
    
    // ========== BACKGROUND PLAYBACK METHODS ==========
    
    setupUnloadHandlers() {
        // Save state before popup closes
        window.addEventListener('beforeunload', () => {
            this.savePopupState();
        });
        
        // Listen for visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Popup is being hidden (tab switched or minimized)
                console.log('Popup hidden, background playback should continue');
            } else {
                // Popup is visible again
                this.checkBackgroundStatus();
            }
        });
    }
    
    async savePopupState() {
        try {
            await chrome.storage.local.set({
                popupState: {
                    currentTrackIndex: this.currentTrackIndex,
                    isPlaying: this.isPlaying,
                    usingBackgroundPlayback: this.usingBackgroundPlayback,
                    volume: this.audioPlayer.volume
                }
            });
        } catch (error) {
            console.error('Error saving popup state:', error);
        }
    }
    
    async loadPopupState() {
        try {
            const result = await chrome.storage.local.get(['popupState']);
            if (result.popupState) {
                return result.popupState;
            }
        } catch (error) {
            console.error('Error loading popup state:', error);
        }
        return null;
    }
    
    setupBackgroundCommunication() {
        // Listen for status updates from background
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'PLAYBACK_STATUS_UPDATE') {
                this.handleBackgroundStatusUpdate(request.data);
            }
            sendResponse({ received: true });
        });
    }
    
    async checkBackgroundStatus() {
        try {
            const response = await chrome.runtime.sendMessage({ 
                action: 'GET_STATUS' 
            });
            
            if (response && response.isPlaying && response.currentTrack) {
                // Background is playing, update UI
                this.usingBackgroundPlayback = true;
                this.isPlaying = true;
                document.getElementById('play-btn-small').innerHTML = '<i class="fas fa-pause"></i>';
                document.getElementById('current-track-small').textContent = response.currentTrack.name;
                document.getElementById('current-artist-small').textContent = 'Playing in background';
                
                // Set volume slider to match background
                if (response.volume !== undefined) {
                    const volumePercent = response.volume * 100;
                    document.getElementById('volume-slider-small').value = volumePercent;
                    this.audioPlayer.volume = response.volume;
                }
                
                // Find the track in our library
                const trackIndex = this.tracks.findIndex(t => t.id === response.currentTrack.id);
                if (trackIndex !== -1) {
                    this.currentTrackIndex = trackIndex;
                }
                
                console.log('Background playback detected and synced');
            } else {
                this.usingBackgroundPlayback = false;
                // Check if we need to restore local playback state
                const savedState = await this.loadPopupState();
                if (savedState && savedState.isPlaying && !savedState.usingBackgroundPlayback) {
                    // We need to restart local playback
                    if (savedState.currentTrackIndex !== -1 && this.tracks[savedState.currentTrackIndex]) {
                        setTimeout(() => {
                            this.playTrackLocally(savedState.currentTrackIndex);
                        }, 100);
                    }
                }
            }
        } catch (error) {
            // Background not responding or no playback
            console.log('No background playback detected');
            this.usingBackgroundPlayback = false;
        }
    }
    
    handleBackgroundStatusUpdate(data) {
        // This is called when background sends status updates
        if (data.isPlaying !== undefined) {
            this.isPlaying = data.isPlaying;
            this.usingBackgroundPlayback = true;
            
            // Update play button
            document.getElementById('play-btn-small').innerHTML = 
                this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
            
            if (data.currentTrack) {
                document.getElementById('current-track-small').textContent = data.currentTrack.name;
                document.getElementById('current-artist-small').textContent = 'Playing in background';
                
                // Update current track index
                const trackIndex = this.tracks.findIndex(t => t.id === data.currentTrack.id);
                if (trackIndex !== -1) {
                    this.currentTrackIndex = trackIndex;
                }
            }
            
            // Update progress if available
            if (data.currentTime !== undefined && data.duration !== undefined) {
                this.updateBackgroundProgress(data.currentTime, data.duration);
            }
            
            // Update volume
            if (data.volume !== undefined && this.usingBackgroundPlayback) {
                const volumePercent = data.volume * 100;
                document.getElementById('volume-slider-small').value = volumePercent;
            }
        }
    }
    
    updateBackgroundProgress(currentTime, duration) {
        if (duration > 0) {
            const progress = (currentTime / duration) * 100;
            document.getElementById('progress-fill').style.width = `${progress}%`;
            document.getElementById('current-time-small').textContent = this.formatTime(currentTime);
            document.getElementById('total-time-small').textContent = this.formatTime(duration);
        }
    }
    // ========== DATABASE METHODS ==========
    
    initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database opened successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('tracks')) {
                    const tracksStore = db.createObjectStore('tracks', { keyPath: 'id' });
                    tracksStore.createIndex('name', 'name', { unique: false });
                    tracksStore.createIndex('addedAt', 'addedAt', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('playlists')) {
                    const playlistsStore = db.createObjectStore('playlists', { keyPath: 'id' });
                    playlistsStore.createIndex('name', 'name', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'id' });
                }
            };
        });
    }
    
    async saveTrack(track) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            const request = store.put(track);
            
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    async getAllTracks() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const request = store.getAll();
            
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    async deleteTrack(trackId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            const request = store.delete(trackId);
            
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    async savePlaylist(playlist) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readwrite');
            const store = transaction.objectStore('playlists');
            const request = store.put(playlist);
            
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    async getAllPlaylists() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readonly');
            const store = transaction.objectStore('playlists');
            const request = store.getAll();
            
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    async deletePlaylist(playlistId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readwrite');
            const store = transaction.objectStore('playlists');
            const request = store.delete(playlistId);
            
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    async saveSettings(settings) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            const request = store.put({ id: 'playerSettings', ...settings });
            
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    async getSettings() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get('playerSettings');
            
            request.onsuccess = (event) => resolve(event.target.result || {});
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    // ========== EVENT LISTENERS ==========
    
    setupEventListeners() {
        // Player controls
        document.getElementById('play-btn-small').addEventListener('click', () => this.togglePlay());
        document.getElementById('prev-btn-small').addEventListener('click', () => this.previousTrack());
        document.getElementById('next-btn-small').addEventListener('click', () => this.nextTrack());
        
        document.getElementById('volume-slider-small').addEventListener('input', (e) => {
            this.setVolume(e.target.value);
        });
        
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('ended', () => this.nextTrack());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
        
        // Upload
        document.getElementById('upload-btn-small').addEventListener('click', () => {
            document.getElementById('file-input-small').click();
        });
        
        document.getElementById('file-input-small').addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // New playlist button
        document.getElementById('new-playlist-btn-small').addEventListener('click', () => {
            this.createPlaylist();
        });
        
        // Progress bar click
        document.querySelector('.progress-bar-compact').addEventListener('click', (e) => {
            const rect = e.target.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.seekTo(percent * 100);
        });

        // Add double-click for playlists
        document.addEventListener('click', (e) => {
            const playlistItem = e.target.closest('.playlist-item-compact');
            if (playlistItem && !e.target.closest('.playlist-actions-small')) {
                const playlistId = playlistItem.dataset.id;
                
                if (e.detail === 2) {
                    this.playPlaylist(playlistId);
                } else {
                    this.showPlaylistTracks(playlistId);
                }
            }
        });
    }
    
    // ========== TRACK PLAYBACK METHODS ==========
    async playTrack(index) {
        if (index < 0 || index >= this.tracks.length) return;
        
        this.currentTrackIndex = index;
        const track = this.tracks[index];
        
        // Try background playback (it should work now)
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'PLAY_TRACK',
                trackData: track
            });
            
            if (response && response.success) {
                this.usingBackgroundPlayback = true;
                this.isPlaying = true;
                document.getElementById('current-track-small').textContent = track.name;
                document.getElementById('current-artist-small').textContent = 'Playing in background';
                document.getElementById('play-btn-small').innerHTML = '<i class="fas fa-pause"></i>';
                
                // Update play count
                track.playCount = (track.playCount || 0) + 1;
                await this.saveTrack(track);
                
                this.switchTab('player');
                return;
            } else {
                console.log('Background playback failed:', response?.error);
            }
        } catch (error) {
            console.log('Background playback error:', error);
        }
        
        // Fallback to local playback
        this.playTrackLocally(index);
    }
    
    playTrackLocally(index) {
        const track = this.tracks[index];
        this.usingBackgroundPlayback = false;
        
        this.audioPlayer.src = track.dataUrl;
        this.audioPlayer.play();
        this.isPlaying = true;
        
        document.getElementById('current-track-small').textContent = track.name;
        document.getElementById('current-artist-small').textContent = 'Uploaded File';
        document.getElementById('play-btn-small').innerHTML = '<i class="fas fa-pause"></i>';
        
        track.playCount = (track.playCount || 0) + 1;
        this.saveTrack(track);
        
        this.switchTab('player');
        
        // Save state
        this.savePopupState();
    }
    
    togglePlay() {
        if (this.currentTrackIndex === -1) {
            if (this.tracks.length > 0) {
                this.playTrack(0);
            }
            return;
        }
        
        if (this.usingBackgroundPlayback) {
            // Control background playback
            if (this.isPlaying) {
                chrome.runtime.sendMessage({ action: 'PAUSE' })
                    .then(() => {
                        this.isPlaying = false;
                        document.getElementById('play-btn-small').innerHTML = '<i class="fas fa-play"></i>';
                        this.savePopupState();
                    })
                    .catch(() => {
                        // Fallback to local
                        this.isPlaying = false;
                        document.getElementById('play-btn-small').innerHTML = '<i class="fas fa-play"></i>';
                    });
            } else {
                chrome.runtime.sendMessage({ action: 'RESUME' })
                    .then(() => {
                        this.isPlaying = true;
                        document.getElementById('play-btn-small').innerHTML = '<i class="fas fa-pause"></i>';
                        this.savePopupState();
                    })
                    .catch(() => {
                        // Fallback to local
                        if (this.audioPlayer.src) {
                            this.audioPlayer.play();
                            this.isPlaying = true;
                            document.getElementById('play-btn-small').innerHTML = '<i class="fas fa-pause"></i>';
                        }
                    });
            }
        } else {
            // Local playback
            if (this.isPlaying) {
                this.audioPlayer.pause();
                this.isPlaying = false;
                document.getElementById('play-btn-small').innerHTML = '<i class="fas fa-play"></i>';
            } else {
                this.audioPlayer.play();
                this.isPlaying = true;
                document.getElementById('play-btn-small').innerHTML = '<i class="fas fa-pause"></i>';
            }
            this.savePopupState();
        }
    }
    
    previousTrack() {
        if (this.tracks.length === 0) return;
        
        let newIndex = this.currentTrackIndex - 1;
        if (newIndex < 0) newIndex = this.tracks.length - 1;
        
        this.playTrack(newIndex);
    }
    
    nextTrack() {
        if (this.tracks.length === 0) return;
        
        let newIndex = this.currentTrackIndex + 1;
        if (newIndex >= this.tracks.length) newIndex = 0;
        
        this.playTrack(newIndex);
    }
    
    seekTo(percentage) {
        if (this.usingBackgroundPlayback) {
            // Can't seek in background playback without more complex implementation
            console.log('Seeking not supported in background playback');
            return;
        }
        
        if (!this.audioPlayer.duration) return;
        
        const time = (percentage / 100) * this.audioPlayer.duration;
        this.audioPlayer.currentTime = time;
    }
    
    setVolume(percentage) {
        const volume = percentage / 100;
        
        // Set local volume
        this.audioPlayer.volume = volume;
        
        // Save to local storage
        this.saveSettings({ volume: volume });
        
        // Send to background if it's playing
        if (this.usingBackgroundPlayback) {
            chrome.runtime.sendMessage({
                action: 'SET_VOLUME',
                volume: volume
            }).catch(() => {
                // Ignore if background not available
            });
        }
    }
    
    updateProgress() {
        // Only update progress for local playback
        if (this.usingBackgroundPlayback) {
            // For background playback, we can't get current time
            // You could implement periodic status updates from background
            return;
        }
        
        if (!this.audioPlayer.duration) return;
        
        const currentTime = this.audioPlayer.currentTime;
        const duration = this.audioPlayer.duration;
        const progress = (currentTime / duration) * 100;
        
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('current-time-small').textContent = this.formatTime(currentTime);
    }
    
    updateDuration() {
        if (this.usingBackgroundPlayback) {
            // Can't get duration from background
            return;
        }
        
        const duration = this.audioPlayer.duration;
        document.getElementById('total-time-small').textContent = this.formatTime(duration);
    }
    
    // ========== FILE UPLOAD METHODS ==========
    
    async handleFiles(fileList) {
        const files = Array.from(fileList).filter(file => 
            file.type.startsWith('audio/')
        );
        
        if (files.length === 0) {
            alert('Please select audio files only (MP3, WAV, OGG, etc.)');
            return;
        }
        
        // Show loading message
        const originalText = document.getElementById('upload-btn-small').innerHTML;
        document.getElementById('upload-btn-small').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        document.getElementById('upload-btn-small').disabled = true;
        
        try {
            for (const file of files) {
                await this.addTrack(file);
            }
            
            await this.saveData();
            this.render();
            this.updateStats();
            this.switchTab('library');
            
            alert(`Successfully uploaded ${files.length} file(s)!`);
            
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading files. Please try smaller files or fewer files.');
        } finally {
            document.getElementById('upload-btn-small').innerHTML = originalText;
            document.getElementById('upload-btn-small').disabled = false;
        }
    }
    
    async addTrack(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const track = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name: file.name.replace(/\.[^/.]+$/, ""),
                        fileName: file.name,
                        dataUrl: e.target.result,
                        type: file.type,
                        size: file.size,
                        duration: 0,
                        addedAt: new Date().toISOString(),
                        playCount: 0,
                        favorite: false
                    };
                    
                    const audio = new Audio();
                    audio.src = track.dataUrl;
                    
                    audio.addEventListener('loadedmetadata', async () => {
                        track.duration = audio.duration;
                        this.tracks.unshift(track);
                        await this.saveTrack(track);
                        resolve();
                    });
                    
                    audio.addEventListener('error', async () => {
                        track.duration = 0;
                        this.tracks.unshift(track);
                        await this.saveTrack(track);
                        resolve();
                    });
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('File reading failed'));
            };
            
            const maxSize = 50 * 1024 * 1024;
            if (file.size > maxSize) {
                if (!confirm(`File "${file.name}" is ${(file.size / (1024*1024)).toFixed(1)}MB. Large files may cause performance issues. Continue?`)) {
                    resolve();
                    return;
                }
            }
            
            reader.readAsDataURL(file);
        });
    }
    
    // ========== PLAYLIST METHODS ==========
    
    async createPlaylist() {
        const name = prompt('Enter playlist name:');
        if (!name || name.trim() === '') return;
        
        const playlist = {
            id: Date.now().toString(),
            name: name.trim(),
            trackIds: [],
            createdAt: new Date().toISOString(),
            trackCount: 0
        };
        
        this.playlists.push(playlist);
        await this.savePlaylist(playlist);
        
        alert(`Playlist "${name}" created!`);
        
        this.renderPlaylistList();
        this.updateStats();
        this.switchTab('playlists');
    }
    
    async playPlaylist(playlistId) {
        try {
            const playlist = this.playlists.find(p => p.id === playlistId);
            if (!playlist) {
                alert('Playlist not found!');
                return;
            }
            
            if (playlist.trackIds.length === 0) {
                alert('This playlist is empty! Add some tracks first.');
                return;
            }
            
            const firstTrackId = playlist.trackIds[0];
            const trackIndex = this.tracks.findIndex(t => t.id === firstTrackId);
            
            if (trackIndex === -1) {
                alert('Could not find track in library. It may have been deleted.');
                return;
            }
            
            await this.playTrack(trackIndex);
            this.switchTab('player');
            alert(`Now playing: "${playlist.name}" playlist`);
            
        } catch (error) {
            console.error('Error playing playlist:', error);
            alert('Error playing playlist. Please try again.');
        }
    }
    
    // ========== UI RENDERING METHODS ==========
    
    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        document.getElementById('player-tab').style.display = tabName === 'player' ? 'block' : 'none';
        document.getElementById('library-tab').style.display = tabName === 'library' ? 'block' : 'none';
        document.getElementById('playlists-tab').style.display = tabName === 'playlists' ? 'block' : 'none';
        
        if (tabName === 'library') {
            this.renderTrackList();
        } else if (tabName === 'playlists') {
            this.renderPlaylistList();
        }
    }
    
    render() {
        this.renderTrackList();
        this.renderPlaylistList();
    }
    
    renderTrackList() {
        const container = document.getElementById('track-list-small');
        
        if (this.tracks.length === 0) {
            container.innerHTML = `
                <div class="empty-state-compact">
                    <i class="fas fa-music"></i>
                    <p>No tracks yet</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.tracks.map((track, index) => `
            <div class="track-item-compact" data-index="${index}" data-id="${track.id}">
                <div class="track-number-small">${index + 1}</div>
                <div class="track-info-micro">
                    <h5 title="${this.escapeHtml(track.name)}">${this.truncateText(track.name, 25)}</h5>
                    <p>${this.formatFileSize(track.size)} • ${this.formatTime(track.duration)}</p>
                </div>
                <div class="track-duration-small">${this.formatTime(track.duration)}</div>
                <div class="track-actions-small" style="margin-left: 8px; display: flex; gap: 4px;">
                    <button class="add-to-playlist-btn" data-id="${track.id}" title="Add to playlist" style="
                        background: none;
                        border: none;
                        color: #4361ee;
                        cursor: pointer;
                        font-size: 12px;
                        padding: 2px 6px;
                        border-radius: 4px;
                    ">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="delete-track-btn" data-id="${track.id}" title="Delete" style="
                        background: none;
                        border: none;
                        color: #ff6b6b;
                        cursor: pointer;
                        font-size: 12px;
                        padding: 2px 6px;
                        border-radius: 4px;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Play track on click
        container.querySelectorAll('.track-item-compact').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.track-actions-small')) {
                    const index = parseInt(item.dataset.index);
                    this.playTrack(index);
                }
            });
        });
        
        // Add to playlist buttons
        container.querySelectorAll('.add-to-playlist-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const trackId = btn.dataset.id;
                await this.showAddToPlaylistDialog(trackId);
            });
        });
        
        // Delete track buttons
        container.querySelectorAll('.delete-track-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const trackId = btn.dataset.id;
                
                if (confirm('Delete this track permanently?')) {
                    await this.deleteTrackById(trackId);
                }
            });
        });
    }
    
    renderPlaylistList() {
        const container = document.getElementById('playlist-list-small');
        
        const displayPlaylists = this.playlists.filter(p => p.id !== 'default');
        
        if (displayPlaylists.length === 0) {
            container.innerHTML = `
                <div class="empty-state-compact">
                    <i class="fas fa-list-alt"></i>
                    <p>No playlists yet</p>
                    <p style="font-size: 12px; margin-top: 8px;">Click "New Playlist" to create one</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = displayPlaylists.map(playlist => `
            <div class="playlist-item-compact" data-id="${playlist.id}">
                <div class="playlist-icon-small">
                    <i class="fas fa-music"></i>
                </div>
                <div class="playlist-info-small">
                    <h5 title="${this.escapeHtml(playlist.name)}">${this.truncateText(playlist.name, 20)}</h5>
                    <p>${playlist.trackIds.length} tracks</p>
                </div>
                <div class="playlist-actions-small">
                    <button class="play-playlist-btn" data-id="${playlist.id}" title="Play playlist" style="
                        background: none;
                        border: none;
                        color: #4361ee;
                        cursor: pointer;
                        font-size: 12px;
                        padding: 2px 6px;
                        border-radius: 4px;
                    ">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="view-playlist-btn" data-id="${playlist.id}" title="View tracks" style="
                        background: none;
                        border: none;
                        color: #48bb78;
                        cursor: pointer;
                        font-size: 12px;
                        padding: 2px 6px;
                        border-radius: 4px;
                    ">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="delete-playlist-btn" data-id="${playlist.id}" title="Delete" style="
                        background: none;
                        border: none;
                        color: #ff6b6b;
                        cursor: pointer;
                        font-size: 12px;
                        padding: 2px 6px;
                        border-radius: 4px;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Play playlist buttons
        container.querySelectorAll('.play-playlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.dataset.id;
                this.playPlaylist(playlistId);
            });
        });
        
        // View playlist buttons
        container.querySelectorAll('.view-playlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.dataset.id;
                this.showPlaylistTracks(playlistId);
            });
        });
        
        // Delete playlist buttons
        container.querySelectorAll('.delete-playlist-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const playlistId = btn.dataset.id;
                
                if (confirm('Delete this playlist permanently?')) {
                    await this.deletePlaylistById(playlistId);
                }
            });
        });
    }
    
    // ========== UTILITY METHODS ==========
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    updateStats() {
        document.getElementById('total-tracks-small').textContent = this.tracks.length;
        document.getElementById('playlist-count-small').textContent = this.playlists.length;
        
        const totalSize = this.tracks.reduce((sum, track) => sum + (track.size || 0), 0);
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(1);
        document.getElementById('total-size-small').textContent = sizeInMB;
    }
    
    async loadData() {
        try {
            this.tracks = await this.getAllTracks();
            this.playlists = await this.getAllPlaylists();
            
            const settings = await this.getSettings();
            if (settings.volume !== undefined) {
                this.audioPlayer.volume = settings.volume;
                document.getElementById('volume-slider-small').value = settings.volume * 100;
            }
            
            console.log('Data loaded successfully:', {
                tracks: this.tracks.length,
                playlists: this.playlists.length
            });
            
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading your music library. Some data may be lost.');
        }
    }
    
    async saveData() {
        // Data is saved immediately to IndexedDB in respective methods
    }
    
    // ========== MODAL METHODS ==========
    
    async showAddToPlaylistDialog(trackId) {
        if (this.playlists.length === 0) {
            alert('First create a playlist from the Playlists tab!');
            this.switchTab('playlists');
            return;
        }
        
        const dialogId = 'add-to-playlist-dialog-' + Date.now();
        
        const dialogHTML = `
            <div id="${dialogId}" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            ">
                <div style="
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    width: 300px;
                    max-width: 90%;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                ">
                    <h4 style="margin: 0 0 16px 0; color: #212529;">Add to Playlist</h4>
                    <div id="playlist-options" style="max-height: 200px; overflow-y: auto; margin-bottom: 20px;">
                        ${this.playlists.map(playlist => `
                            <div style="
                                padding: 10px;
                                border-bottom: 1px solid #f1f3f5;
                                cursor: pointer;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            " data-id="${playlist.id}">
                                <span>${this.escapeHtml(playlist.name)}</span>
                                <span style="font-size: 12px; color: #6c757d;">${playlist.trackIds.length} tracks</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button id="cancel-dialog" style="
                            padding: 8px 16px;
                            background: #f8f9fa;
                            border: 1px solid #dee2e6;
                            border-radius: 6px;
                            color: #212529;
                            cursor: pointer;
                        ">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add dialog to page
        const dialog = document.createElement('div');
        dialog.innerHTML = dialogHTML;
        document.body.appendChild(dialog);
        
        const closeDialog = () => {
            const dialogElement = document.getElementById(dialogId);
            if (dialogElement && dialogElement.parentNode) {
                dialogElement.remove();
            }
        };
        
        // Add event listeners
        dialog.querySelector('#cancel-dialog').addEventListener('click', closeDialog);
        
        dialog.querySelectorAll('#playlist-options > div').forEach(item => {
            item.addEventListener('click', async () => {
                const playlistId = item.dataset.id;
                await this.addTrackToPlaylist(trackId, playlistId);
                closeDialog();
            });
        });
        
        // Close on background click
        dialog.querySelector('div > div').addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        dialog.addEventListener('click', closeDialog);
        
        // Escape key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeDialog();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        
        document.addEventListener('keydown', escapeHandler);
        
        // Clean up
        dialog.addEventListener('click', (e) => {
            if (e.target.id === dialogId) {
                document.removeEventListener('keydown', escapeHandler);
            }
        });
    }
    
    async addTrackToPlaylist(trackId, playlistId) {
        try {
            const playlist = this.playlists.find(p => p.id === playlistId);
            if (!playlist) {
                alert('Playlist not found!');
                return;
            }
            
            if (playlist.trackIds.includes(trackId)) {
                alert('This track is already in the playlist!');
                return;
            }
            
            playlist.trackIds.push(trackId);
            playlist.trackCount = playlist.trackIds.length;
            
            await this.savePlaylist(playlist);
            
            const track = this.tracks.find(t => t.id === trackId);
            const trackName = track ? track.name : 'Track';
            alert(`"${trackName}" added to "${playlist.name}"!`);
            
            this.renderPlaylistList();
            
        } catch (error) {
            console.error('Error adding track to playlist:', error);
            alert('Error adding track to playlist. Please try again.');
        }
    }
    
    showPlaylistTracks(playlistId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return;
        
        const trackIds = playlist.trackIds;
        
        const modalHTML = `
            <div class="modal-overlay" id="playlist-modal">
                <div class="modal-content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div>
                            <h4 style="margin: 0; color: #212529;">${this.escapeHtml(playlist.name)}</h4>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #6c757d;">
                                ${trackIds.length} tracks
                            </p>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            ${trackIds.length > 0 ? `
                            <button id="play-all-btn" style="
                                background: #4361ee;
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 6px;
                                font-size: 12px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                            ">
                                <i class="fas fa-play"></i> Play All
                            </button>
                            ` : ''}
                            <button id="close-modal" style="
                                background: none;
                                border: none;
                                font-size: 20px;
                                color: #6c757d;
                                cursor: pointer;
                            ">&times;</button>
                        </div>
                    </div>
                    <div style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
                        ${trackIds.length === 0 ? 
                            `<div style="text-align: center; padding: 40px 20px; color: #6c757d;">
                                <i class="fas fa-music" style="font-size: 32px; opacity: 0.3; margin-bottom: 12px;"></i>
                                <p>No tracks in this playlist yet</p>
                                <p style="font-size: 12px;">Add tracks from the Library tab</p>
                            </div>` :
                            trackIds.map((trackId, index) => {
                                const track = this.tracks.find(t => t.id === trackId);
                                if (!track) return '';
                                return `
                                    <div style="
                                        padding: 10px;
                                        border-bottom: 1px solid #f1f3f5;
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        cursor: pointer;
                                    " data-track-id="${trackId}">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 500; color: #212529;">${index + 1}. ${this.escapeHtml(track.name)}</div>
                                            <div style="font-size: 12px; color: #6c757d; margin-top: 2px;">
                                                ${this.formatTime(track.duration)} • ${this.formatFileSize(track.size)}
                                            </div>
                                        </div>
                                        <div style="display: flex; gap: 8px;">
                                            <button class="play-single-btn" data-track-id="${trackId}" style="
                                                background: #48bb78;
                                                color: white;
                                                border: none;
                                                padding: 6px 12px;
                                                border-radius: 6px;
                                                font-size: 12px;
                                                cursor: pointer;
                                                display: flex;
                                                align-items: center;
                                                gap: 4px;
                                            ">
                                                <i class="fas fa-play"></i> Play
                                            </button>
                                            <button class="remove-from-playlist" data-track-id="${trackId}" style="
                                                background: #ff6b6b;
                                                color: white;
                                                border: none;
                                                padding: 6px;
                                                border-radius: 6px;
                                                font-size: 12px;
                                                cursor: pointer;
                                                width: 30px;
                                                height: 30px;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                            ">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')
                        }
                    </div>
                    <div style="text-align: right;">
                        <button id="close-modal-2" style="
                            padding: 8px 16px;
                            background: #f8f9fa;
                            border: 1px solid #dee2e6;
                            border-radius: 6px;
                            color: #212529;
                            cursor: pointer;
                        ">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove any existing modal
        const existingModal = document.getElementById('playlist-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to page
        const modal = document.createElement('div');
        modal.innerHTML = modalHTML;
        modal.id = 'playlist-modal-' + Date.now(); // Unique ID
        document.body.appendChild(modal);
        
        const currentModalId = modal.id;
        
        // Safe close function
        const closeModal = () => {
            const currentModal = document.getElementById(currentModalId);
            if (currentModal && currentModal.parentNode) {
                currentModal.remove();
            }
        };
        
        // Close buttons
        modal.querySelector('#close-modal').addEventListener('click', closeModal);
        modal.querySelector('#close-modal-2').addEventListener('click', closeModal);
        
        // Play All button
        if (trackIds.length > 0) {
            modal.querySelector('#play-all-btn').addEventListener('click', () => {
                this.playPlaylist(playlistId);
                closeModal();
            });
        }
        
        // Play single track buttons
        modal.querySelectorAll('.play-single-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackId = btn.dataset.trackId;
                const trackIndex = this.tracks.findIndex(t => t.id === trackId);
                if (trackIndex !== -1) {
                    this.playTrack(trackIndex);
                    closeModal();
                    this.switchTab('player');
                }
            });
        });
        
        // Remove from playlist buttons
        modal.querySelectorAll('.remove-from-playlist').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const trackId = btn.dataset.trackId;
                if (confirm('Remove this track from playlist?')) {
                    await this.removeTrackFromPlaylist(trackId, playlistId);
                    closeModal();
                    setTimeout(() => {
                        this.showPlaylistTracks(playlistId);
                    }, 100);
                }
            });
        });
        
        // Click on track row to play
        modal.querySelectorAll('[data-track-id]').forEach(row => {
            if (!row.classList.contains('play-single-btn') && !row.classList.contains('remove-from-playlist')) {
                row.addEventListener('click', (e) => {
                    if (!e.target.closest('button')) {
                        const trackId = row.dataset.trackId;
                        const trackIndex = this.tracks.findIndex(t => t.id === trackId);
                        if (trackIndex !== -1) {
                            this.playTrack(trackIndex);
                            closeModal();
                            this.switchTab('player');
                        }
                    }
                });
            }
        });
        
        // Close on background click
        modal.querySelector('.modal-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        
        // Add escape key listener
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        
        document.addEventListener('keydown', escapeHandler);
        
        // Clean up escape listener when modal closes
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.removeEventListener('keydown', escapeHandler);
            }
        });
    }
    
    async removeTrackFromPlaylist(trackId, playlistId) {
        try {
            const playlist = this.playlists.find(p => p.id === playlistId);
            if (!playlist) return;
            
            playlist.trackIds = playlist.trackIds.filter(id => id !== trackId);
            playlist.trackCount = playlist.trackIds.length;
            
            await this.savePlaylist(playlist);
            
            this.renderPlaylistList();
            this.updateStats();
            
        } catch (error) {
            console.error('Error removing track from playlist:', error);
            alert('Error removing track from playlist. Please try again.');
        }
    }

    async deleteTrackById(trackId) {
        try {
            this.tracks = this.tracks.filter(track => track.id !== trackId);
            await this.deleteTrack(trackId);
            
            if (this.currentTrackIndex !== -1) {
                const currentTrack = this.tracks[this.currentTrackIndex];
                if (!currentTrack || currentTrack.id === trackId) {
                    this.currentTrackIndex = -1;
                    this.audioPlayer.src = '';
                    this.isPlaying = false;
                    document.getElementById('play-btn-small').innerHTML = '<i class="fas fa-play"></i>';
                    document.getElementById('current-track-small').textContent = 'No track selected';
                }
            }
            
            this.render();
            this.updateStats();
            
        } catch (error) {
            console.error('Error deleting track:', error);
            alert('Error deleting track. Please try again.');
        }
    }
    
    async deletePlaylistById(playlistId) {
        try {
            this.playlists = this.playlists.filter(p => p.id !== playlistId);
            await this.deletePlaylist(playlistId);
            
            this.renderPlaylistList();
            this.updateStats();
            
        } catch (error) {
            console.error('Error deleting playlist:', error);
            alert('Error deleting playlist. Please try again.');
        }
    }
}

// Initialize the app
let musicPlayerPopup;
document.addEventListener('DOMContentLoaded', () => {
    musicPlayerPopup = new MusicPlayerPopup();
});