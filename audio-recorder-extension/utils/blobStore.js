// utils/blobStore.js
// IndexedDB-backed blob storage shared by extension contexts.
var BlobStore = (function () {
  'use strict';

  var DB_NAME = 'audio_recorder_db';
  var STORE_NAME = 'recording_blobs';
  var DB_VERSION = 1;
  var dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('Failed to open DB')); };
    });
    return dbPromise;
  }

  function tx(storeName, mode) {
    return openDb().then(function (db) {
      return db.transaction(storeName, mode).objectStore(storeName);
    });
  }

  var BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var BASE64_LOOKUP = (function () {
    var table = new Int16Array(128);
    for (var i = 0; i < table.length; i++) table[i] = -1;
    for (var j = 0; j < BASE64_ALPHABET.length; j++) table[BASE64_ALPHABET.charCodeAt(j)] = j;
    return table;
  })();

  var MAX_BLOB_BYTES = 120 * 1024 * 1024; // safety cap to avoid freezes/crashes

  function base64ToArrayBuffer(base64) {
    if (!base64 || typeof base64 !== 'string') throw new Error('Invalid base64');
    var s = base64.replace(/[\r\n\s]/g, '');
    if (s.length % 4 === 1) throw new Error('Invalid base64 length');
    var padding = 0;
    if (s.endsWith('==')) padding = 2;
    else if (s.endsWith('=')) padding = 1;
    var byteLen = Math.floor((s.length * 3) / 4) - padding;
    if (byteLen < 0) throw new Error('Invalid base64');
    if (byteLen > MAX_BLOB_BYTES) throw new Error('Blob too large');

    var out = new Uint8Array(byteLen);
    var outIdx = 0;
    for (var i = 0; i < s.length; i += 4) {
      var c1 = s.charCodeAt(i);
      var c2 = s.charCodeAt(i + 1);
      var c3 = s.charCodeAt(i + 2);
      var c4 = s.charCodeAt(i + 3);

      var v1 = c1 < 128 ? BASE64_LOOKUP[c1] : -1;
      var v2 = c2 < 128 ? BASE64_LOOKUP[c2] : -1;
      var v3 = c3 === 61 ? 0 : (c3 < 128 ? BASE64_LOOKUP[c3] : -1); // '='
      var v4 = c4 === 61 ? 0 : (c4 < 128 ? BASE64_LOOKUP[c4] : -1);
      if (v1 < 0 || v2 < 0 || v3 < 0 || v4 < 0) throw new Error('Invalid base64');

      var triple = (v1 << 18) | (v2 << 12) | (v3 << 6) | v4;
      if (outIdx < byteLen) out[outIdx++] = (triple >> 16) & 255;
      if (outIdx < byteLen) out[outIdx++] = (triple >> 8) & 255;
      if (outIdx < byteLen) out[outIdx++] = triple & 255;
    }
    return out.buffer;
  }

  function arrayBufferToBase64(buffer) {
    var bytes = new Uint8Array(buffer || new ArrayBuffer(0));
    if (bytes.byteLength > MAX_BLOB_BYTES) throw new Error('Blob too large');
    var parts = [];
    var chunk = '';
    for (var i = 0; i < bytes.length; i += 3) {
      var a = bytes[i];
      var b = i + 1 < bytes.length ? bytes[i + 1] : 0;
      var c = i + 2 < bytes.length ? bytes[i + 2] : 0;
      var triple = (a << 16) | (b << 8) | c;
      var enc1 = (triple >> 18) & 63;
      var enc2 = (triple >> 12) & 63;
      var enc3 = (triple >> 6) & 63;
      var enc4 = triple & 63;

      chunk += BASE64_ALPHABET.charAt(enc1) + BASE64_ALPHABET.charAt(enc2);
      chunk += (i + 1 < bytes.length) ? BASE64_ALPHABET.charAt(enc3) : '=';
      chunk += (i + 2 < bytes.length) ? BASE64_ALPHABET.charAt(enc4) : '=';

      if (chunk.length >= 16384) { parts.push(chunk); chunk = ''; }
    }
    if (chunk) parts.push(chunk);
    return parts.join('');
  }

  function requestToPromise(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error('IDB request failed')); };
    });
  }

  async function putBase64(id, base64, mimeType) {
    if (!id || !base64) throw new Error('Missing blob data');
    var buffer = base64ToArrayBuffer(base64);
    var store = await tx(STORE_NAME, 'readwrite');
    await requestToPromise(store.put({
      id: String(id),
      mimeType: mimeType || 'audio/webm',
      buffer: buffer,
      size: buffer.byteLength,
      updatedAt: Date.now()
    }));
    return { size: buffer.byteLength };
  }

  async function getBase64(id) {
    if (!id) return null;
    var store = await tx(STORE_NAME, 'readonly');
    var row = await requestToPromise(store.get(String(id)));
    if (!row || !row.buffer) return null;
    return {
      id: row.id,
      mimeType: row.mimeType || 'application/octet-stream',
      size: row.size || (row.buffer.byteLength || 0),
      data: arrayBufferToBase64(row.buffer)
    };
  }

  async function remove(id) {
    if (!id) return;
    var store = await tx(STORE_NAME, 'readwrite');
    await requestToPromise(store.delete(String(id)));
  }

  async function clear() {
    var store = await tx(STORE_NAME, 'readwrite');
    await requestToPromise(store.clear());
  }

  async function usage() {
    var store = await tx(STORE_NAME, 'readonly');
    var rows = await requestToPromise(store.getAll());
    var totalBytes = 0;
    for (var i = 0; i < rows.length; i++) {
      totalBytes += rows[i]?.size || rows[i]?.buffer?.byteLength || 0;
    }
    return { count: rows.length, totalBytes: totalBytes };
  }

  return {
    putBase64: putBase64,
    getBase64: getBase64,
    remove: remove,
    clear: clear,
    usage: usage
  };
})();
