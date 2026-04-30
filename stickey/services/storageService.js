/* global Stickey */

(() => {
  class StorageService {
    async getSettings() {
      const resp = await chrome.runtime.sendMessage({ action: 'stickey_getSettings' });
      return resp?.settings || null;
    }

    async updateSettings(settings) {
      return chrome.runtime.sendMessage({ action: 'stickey_updateSettings', settings });
    }

    async getAnnotationsForPage(pageUrl) {
      return chrome.runtime.sendMessage({ action: 'stickey_getAnnotationsForPage', pageUrl });
    }

    async upsertAnnotation(annotation) {
      return chrome.runtime.sendMessage({ action: 'stickey_upsertAnnotation', annotation });
    }

    async deleteAnnotation(id) {
      return chrome.runtime.sendMessage({ action: 'stickey_deleteAnnotation', id });
    }

    async setLink(idA, idB, linked) {
      return chrome.runtime.sendMessage({ action: 'stickey_setLink', idA, idB, linked });
    }
  }

  Stickey.services ||= {};
  Stickey.services.storage = new StorageService();
})();

