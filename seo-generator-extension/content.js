/* -------------------------------------------
   SEO Analyzer Pro – Content Script
   Simple Version
-------------------------------------------- */

(function() {
  'use strict';
  
  console.log("Content script loaded");
  
  // Collect SEO data
  function collectSEOData() {
    const seoData = {
      url: window.location.href,
      title: document.title?.trim() || '',
      metaDescription: '',
      h1: [],
      h2: [],
      canonical: false,
      robots: '',
      viewport: '',
      charset: '',
      og: {}
    };
    
    // Meta tags
    document.querySelectorAll('meta').forEach(meta => {
      const name = meta.getAttribute('name')?.toLowerCase();
      const property = meta.getAttribute('property')?.toLowerCase();
      const content = meta.getAttribute('content')?.trim();
      
      if (name === 'description') seoData.metaDescription = content;
      if (name === 'robots') seoData.robots = content;
      if (name === 'viewport') seoData.viewport = content;
      if (name === 'charset') seoData.charset = content;
      
      if (property?.startsWith('og:')) {
        const key = property.replace('og:', '');
        seoData.og[key] = content;
      }
    });
    
    // Canonical
    const canonicalEl = document.querySelector("link[rel='canonical']");
    if (canonicalEl?.href) {
      seoData.canonical = true;
      seoData.canonicalUrl = canonicalEl.href;
    }
    
    // Headings
    document.querySelectorAll('h1').forEach(h => {
      const text = h.textContent?.trim();
      if (text) seoData.h1.push(text);
    });
    
    document.querySelectorAll('h2').forEach(h => {
      const text = h.textContent?.trim();
      if (text) seoData.h2.push(text);
    });
    
    console.log("SEO data collected:", seoData);
    return seoData;
  }
  
  // Send to background
  function sendSEOData() {
    const data = collectSEOData();
    chrome.runtime.sendMessage({
      type: 'SEO_DATA',
      data: data
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending SEO data:", chrome.runtime.lastError);
      } else {
        console.log("SEO data sent successfully");
      }
    });
  }
  
  // Listen for messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Content script received:", message.type);
    
    if (message.type === 'GET_SEO_DATA') {
      const data = collectSEOData();
      sendResponse(data);
      return true;
    }
    
    if (message.type === 'QUICK_HEADINGS') {
      const h1 = Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim()).filter(Boolean);
      const h2 = Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim()).filter(Boolean);
      sendResponse({ h1, h2 });
      return true;
    }
    
    if (message.type === 'QUICK_META') {
      let title = document.title?.trim() || '';
      let metaDescription = '';
      
      document.querySelectorAll('meta').forEach(meta => {
        const name = meta.getAttribute('name')?.toLowerCase();
        if (name === 'description') {
          metaDescription = meta.getAttribute('content')?.trim() || '';
        }
      });
      
      sendResponse({ title, metaDescription });
      return true;
    }
  });
  
  // Auto-collect on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendSEOData);
  } else {
    sendSEOData();
  }
  
})();