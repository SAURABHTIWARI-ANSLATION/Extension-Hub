/**
 * @module logger
 * @description Structured, leveled logging with persistent debug mode support.
 * All logs are stored in memory and optionally persisted to chrome.storage.local.
 */

const LOG_LEVELS = Object.freeze({ DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 });
const LOG_LEVEL_NAMES = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
const MAX_LOG_ENTRIES = 500;

class Logger {
    constructor(namespace = 'ExtensionVault') {
        this.namespace = namespace;
        this.entries = [];
        this.debugMode = false;
        this.listeners = new Set();
    }

    /** Enable or disable debug mode */
    setDebugMode(enabled) {
        this.debugMode = !!enabled;
        this._emit('debug-mode-changed', { enabled: this.debugMode });
    }

    /** Subscribe to log events */
    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    _emit(type, payload) {
        this.listeners.forEach(fn => {
            try { fn(type, payload); } catch (_) { }
        });
    }

    _log(level, message, data = null) {
        if (!this.debugMode && level === LOG_LEVELS.DEBUG) return;

        const entry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            level: LOG_LEVEL_NAMES[level],
            namespace: this.namespace,
            message,
            data: data ? this._sanitize(data) : null,
        };

        this.entries.push(entry);

        // Trim log buffer
        if (this.entries.length > MAX_LOG_ENTRIES) {
            this.entries = this.entries.slice(-MAX_LOG_ENTRIES);
        }

        // Browser console output
        const prefix = `[${entry.timestamp}] [${entry.namespace}] [${entry.level}]`;
        const args = data ? [prefix, message, data] : [prefix, message];

        switch (level) {
            case LOG_LEVELS.DEBUG: console.debug(...args); break;
            case LOG_LEVELS.INFO: console.info(...args); break;
            case LOG_LEVELS.WARN: console.warn(...args); break;
            case LOG_LEVELS.ERROR: console.error(...args); break;
        }

        this._emit('log', entry);
    }

    _sanitize(data) {
        try {
            return JSON.parse(JSON.stringify(data));
        } catch (_) {
            return String(data);
        }
    }

    debug(message, data) { this._log(LOG_LEVELS.DEBUG, message, data); }
    info(message, data) { this._log(LOG_LEVELS.INFO, message, data); }
    warn(message, data) { this._log(LOG_LEVELS.WARN, message, data); }
    error(message, data) { this._log(LOG_LEVELS.ERROR, message, data); }

    /** Get all log entries as formatted text */
    exportLogs() {
        return this.entries
            .map(e => `[${e.timestamp}] [${e.level}] ${e.message}${e.data ? '\n  ' + JSON.stringify(e.data) : ''}`)
            .join('\n');
    }

    /** Clear log buffer */
    clear() {
        this.entries = [];
        this._emit('cleared', {});
    }

    /** Get entries filtered by level */
    getEntries(minLevel = LOG_LEVELS.DEBUG) {
        const minIdx = typeof minLevel === 'string'
            ? LOG_LEVEL_NAMES.indexOf(minLevel.toUpperCase())
            : minLevel;
        return this.entries.filter(e => LOG_LEVEL_NAMES.indexOf(e.level) >= minIdx);
    }
}

export const logger = new Logger('ExtensionVault');
export { LOG_LEVELS, LOG_LEVEL_NAMES };