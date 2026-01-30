// background.js
class BackgroundMusicPlayer {
    constructor() {
        this.currentTrack = null;
        this.isPlaying = false;
        this.audioContext = null;
        this.audioSource = null;
        this.audioBuffer = null;
        this.startTime = 0;
        this.pauseTime = 0;
        this.volume = 1.0;
        this.playbackRate = 1.0;
        this.storageKey = 'backgroundPlayerSettings';
        
        this.init();
    }
    
    init() {
        console.log('Background music player initialized');
        this.loadSettings();
    }
    
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([this.storageKey]);
            if (result[this.storageKey]) {
                const settings = result[this.storageKey];
                this.volume = settings.volume || 1.0;
                this.playbackRate = settings.playbackRate || 1.0;
            }
            console.log('Loaded background player settings');
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    async saveSettings() {
        try {
            await chrome.storage.local.set({
                [this.storageKey]: {
                    volume: this.volume,
                    playbackRate: this.playbackRate
                }
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    createAudioContext() {
        if (!this.audioContext) {
            // Service worker mein AudioContext alag tarike se create karna padta hai
            this.audioContext = new (self.AudioContext || self.webkitAudioContext)();
        }
        
        // Resume audio context if it's suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        return this.audioContext;
    }
    
    async decodeAudioData(base64Data) {
        try {
            // Remove data URL prefix (e.g., "data:audio/mp3;base64,")
            const base64 = base64Data.split(',')[1];
            
            // Convert base64 to ArrayBuffer
            const binaryString = self.atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const audioContext = this.createAudioContext();
            
            // Use decodeAudioData with promise
            return new Promise((resolve, reject) => {
                audioContext.decodeAudioData(
                    bytes.buffer,
                    (buffer) => resolve(buffer),
                    (error) => reject(error)
                );
            });
            
        } catch (error) {
            console.error('Error decoding audio data:', error);
            throw error;
        }
    }
    
    async playTrack(trackData) {
        try {
            if (!trackData || !trackData.dataUrl) {
                throw new Error('Invalid track data');
            }
            
            // Stop current playback
            this.stop();
            
            // Decode audio data
            this.audioBuffer = await this.decodeAudioData(trackData.dataUrl);
            
            // Create audio context
            const audioContext = this.createAudioContext();
            
            // Create source node
            this.audioSource = audioContext.createBufferSource();
            this.audioSource.buffer = this.audioBuffer;
            
            // Create gain node for volume control
            const gainNode = audioContext.createGain();
            gainNode.gain.value = this.volume;
            
            // Connect nodes
            this.audioSource.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Set playback rate
            this.audioSource.playbackRate.value = this.playbackRate;
            
            // Start playback
            const startOffset = 0;
            this.audioSource.start(audioContext.currentTime, startOffset);
            this.startTime = audioContext.currentTime - startOffset;
            
            this.currentTrack = trackData;
            this.isPlaying = true;
            this.pauseTime = 0;
            
            console.log('Playing track:', trackData.name);
            
            // Set up onended callback
            this.audioSource.onended = () => {
                console.log('Track ended');
                this.isPlaying = false;
                this.currentTrack = null;
                this.audioSource = null;
                this.sendStatusUpdate();
            };
            
            this.sendStatusUpdate();
            return { success: true };
            
        } catch (error) {
            console.error('Error playing track in background:', error);
            this.isPlaying = false;
            this.currentTrack = null;
            this.audioSource = null;
            return { success: false, error: error.message };
        }
    }
    
    pause() {
        if (!this.isPlaying || !this.audioSource || !this.audioContext) return;
        
        try {
            this.audioSource.stop(0);
            this.pauseTime = this.audioContext.currentTime - this.startTime;
            this.isPlaying = false;
            this.audioSource = null;
            
            console.log('Playback paused at:', this.pauseTime);
            this.sendStatusUpdate();
        } catch (error) {
            console.error('Error pausing playback:', error);
        }
    }
    
    resume() {
        if (!this.currentTrack || !this.audioBuffer || this.isPlaying) return;
        
        try {
            const audioContext = this.createAudioContext();
            
            // Create new source from buffer
            this.audioSource = audioContext.createBufferSource();
            this.audioSource.buffer = this.audioBuffer;
            
            // Create gain node
            const gainNode = audioContext.createGain();
            gainNode.gain.value = this.volume;
            
            // Connect nodes
            this.audioSource.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Set playback rate
            this.audioSource.playbackRate.value = this.playbackRate;
            
            // Calculate offset (don't exceed duration)
            const offset = Math.min(this.pauseTime, this.audioBuffer.duration);
            
            // Start from pause point
            const startTime = audioContext.currentTime;
            this.audioSource.start(startTime, offset);
            this.startTime = startTime - offset;
            
            this.isPlaying = true;
            
            console.log('Playback resumed from:', offset);
            
            // Set up onended callback
            this.audioSource.onended = () => {
                console.log('Track ended after resume');
                this.isPlaying = false;
                this.currentTrack = null;
                this.audioSource = null;
                this.sendStatusUpdate();
            };
            
            this.sendStatusUpdate();
            
        } catch (error) {
            console.error('Error resuming playback:', error);
        }
    }
    
    stop() {
        if (this.audioSource) {
            try {
                this.audioSource.stop(0);
                this.audioSource.disconnect();
            } catch (e) {
                // Ignore errors if already stopped
            }
            this.audioSource = null;
        }
        
        this.isPlaying = false;
        this.pauseTime = 0;
        this.startTime = 0;
        
        console.log('Playback stopped');
        this.sendStatusUpdate();
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
        console.log('Volume set to:', this.volume);
        
        // Note: Can't change volume of currently playing audio directly
        // Need to recreate audio source with new volume
        this.sendStatusUpdate();
    }
    
    getCurrentTime() {
        if (!this.isPlaying || !this.audioContext) return this.pauseTime;
        const currentTime = this.audioContext.currentTime - this.startTime;
        return Math.min(currentTime, this.audioBuffer ? this.audioBuffer.duration : 0);
    }
    
    getDuration() {
        return this.audioBuffer ? this.audioBuffer.duration : 0;
    }
    
    sendStatusUpdate() {
        try {
            chrome.runtime.sendMessage({
                action: 'PLAYBACK_STATUS_UPDATE',
                data: {
                    isPlaying: this.isPlaying,
                    currentTrack: this.currentTrack,
                    currentTime: this.getCurrentTime(),
                    duration: this.getDuration(),
                    volume: this.volume
                }
            }).catch(error => {
                // Ignore errors if no popup is open
                console.log('No popup to send status update to');
            });
        } catch (error) {
            console.error('Error sending status update:', error);
        }
    }
    
    getStatus() {
        return {
            isPlaying: this.isPlaying,
            currentTrack: this.currentTrack,
            currentTime: this.getCurrentTime(),
            duration: this.getDuration(),
            volume: this.volume
        };
    }
}

// Initialize background player
const backgroundPlayer = new BackgroundMusicPlayer();

// Message listener for communication with popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request.action);
    
    switch (request.action) {
        case 'PLAY_TRACK':
            backgroundPlayer.playTrack(request.trackData)
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true; // Will respond asynchronously
            
        case 'PAUSE':
            backgroundPlayer.pause();
            sendResponse({ success: true });
            break;
            
        case 'RESUME':
            backgroundPlayer.resume();
            sendResponse({ success: true });
            break;
            
        case 'STOP':
            backgroundPlayer.stop();
            sendResponse({ success: true });
            break;
            
        case 'SET_VOLUME':
            backgroundPlayer.setVolume(request.volume);
            sendResponse({ success: true });
            break;
            
        case 'GET_STATUS':
            sendResponse(backgroundPlayer.getStatus());
            break;
            
        case 'GET_CURRENT_TIME':
            sendResponse({ currentTime: backgroundPlayer.getCurrentTime() });
            break;
            
        case 'GET_DURATION':
            sendResponse({ duration: backgroundPlayer.getDuration() });
            break;
            
        case 'POPUP_CLOSING':
            // Popup is closing, keep playing if requested
            if (request.keepPlaying && backgroundPlayer.isPlaying) {
                console.log('Popup closing but keeping background playback');
            }
            sendResponse({ success: true });
            break;
            
        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

// Keep background service worker alive
chrome.runtime.onInstalled.addListener(() => {
    console.log('Music Player Extension installed/updated');
});

// Optional: Send periodic updates for progress bar
setInterval(() => {
    if (backgroundPlayer.isPlaying) {
        backgroundPlayer.sendStatusUpdate();
    }
}, 500);

// When popup opens, send current status immediately
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'popup') {
        console.log('Popup connected');
        // Send current status to newly opened popup
        setTimeout(() => {
            backgroundPlayer.sendStatusUpdate();
        }, 100);
        
        port.onDisconnect.addListener(() => {
            console.log('Popup disconnected, but background playback continues');
        });
    }
});