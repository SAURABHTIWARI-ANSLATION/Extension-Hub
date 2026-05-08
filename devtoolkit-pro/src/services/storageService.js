// storageService.js — Wraps chrome.storage with async/await

export const storageService = {
  async get(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  },

  async set(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  },

  async getPinnedTools() {
    const { pinnedTools = [] } = await this.get("pinnedTools");
    return pinnedTools;
  },

  async pinTool(toolId) {
    const pins = await this.getPinnedTools();
    if (!pins.includes(toolId)) {
      await this.set({ pinnedTools: [...pins, toolId] });
    }
  },

  async unpinTool(toolId) {
    const pins = await this.getPinnedTools();
    await this.set({ pinnedTools: pins.filter(id => id !== toolId) });
  },

  async getActiveTools() {
    const { activeTools = {} } = await this.get("activeTools");
    return activeTools;
  },

  async setToolActive(toolId, active) {
    const activeTools = await this.getActiveTools();
    activeTools[toolId] = active;
    await this.set({ activeTools });
  },

  async getDarkMode() {
    const { darkMode = false } = await this.get("darkMode");
    return darkMode;
  },

  async setDarkMode(val) {
    await this.set({ darkMode: val });
  },

  async getShortcuts() {
    const { toolShortcuts = {} } = await this.get("toolShortcuts");
    return toolShortcuts;
  },

  async setShortcut(toolId, key) {
    const shortcuts = await this.getShortcuts();
    shortcuts[toolId] = key;
    await this.set({ toolShortcuts: shortcuts });
  }
};
