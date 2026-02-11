console.log('Tech Detector Pro content script loaded');

// Check if already loaded to avoid redeclaration
if (typeof window.TECH_DETECTOR_LOADED === 'undefined') {
  window.TECH_DETECTOR_LOADED = true;

  // Load technology patterns from technologies.json
  let TECH_PATTERNS = {};
  let TECH_DATABASE_LOADED = false;

  // Load technologies.json file
  async function loadTechnologies() {
    try {
      const response = await fetch(chrome.runtime.getURL('technologies.json'));
      const data = await response.json();

      // Convert technologies.json format to TECH_PATTERNS format
      TECH_PATTERNS = {};

      // Process each category
      Object.entries(data.technologies).forEach(([category, techs]) => {
        techs.forEach(tech => {
          TECH_PATTERNS[tech.id] = {
            name: tech.name,
            category: category,
            patterns: tech.patterns,
            icon: tech.icon,
            website: tech.website,
            versionCheck: tech.versionCheck
          };
        });
      });

      TECH_DATABASE_LOADED = true;
      console.log('✅ Technologies database loaded:', Object.keys(TECH_PATTERNS).length, 'technologies');
      return true;
    } catch (error) {
      console.error('❌ Error loading technologies.json:', error);
      return false;
    }
  }

  // Enhanced detection functions
  async function detectTechnologies() {
    // Load technologies first if not already loaded
    if (!TECH_DATABASE_LOADED) {
      await loadTechnologies();
    }

    const detected = {
      frontend: [],
      backend: [],
      cms: [],
      analytics: [],
      hosting: [],
      libraries: [],
      payment: [],
      build_tools: []
    };

    // Track scraping statistics
    let patternsChecked = 0;
    let patternsMatched = 0;

    try {
      // Get relevant page data (REAL SCRAPING)
      const scripts = Array.from(document.scripts);
      const links = Array.from(document.querySelectorAll('link'));
      const metaTags = Array.from(document.querySelectorAll('meta'));
      const htmlSource = document.documentElement.outerHTML;
      const htmlSourceLower = htmlSource.substring(0, 50000).toLowerCase();

      // Log scraping activity
      console.log('🔍 SCRAPING PAGE DATA:');
      console.log(`  - Scripts found: ${scripts.length}`);
      console.log(`  - Links found: ${links.length}`);
      console.log(`  - Meta tags found: ${metaTags.length}`);
      console.log(`  - HTML source size: ${htmlSource.length} characters`);
      console.log(`  - Analyzing patterns in technologies.json...`);

      // Check for React FIRST (before pattern matching)
      detectReactSpecial(detected, scripts, htmlSourceLower);

      // Check for Vue
      detectVueSpecial(detected, scripts, htmlSourceLower);

      // Check for Next.js
      detectNextJsSpecial(detected, scripts, htmlSourceLower);

      // Check each technology (REAL PATTERN MATCHING)
      Object.entries(TECH_PATTERNS).forEach(([techId, tech]) => {
        try {
          let found = false;
          let detectionMethod = 'html';

          // Check in page source (SCRAPING HTML)
          for (const pattern of tech.patterns) {
            patternsChecked++;
            const patternLower = pattern.toLowerCase();
            if (htmlSourceLower.includes(patternLower)) {
              found = true;
              patternsMatched++;
              detectionMethod = 'html';
              break;
            }
          }

          // Check script sources (SCRAPING SCRIPT URLs)
          if (!found) {
            for (const script of scripts) {
              if (script.src) {
                const srcLower = script.src.toLowerCase();
                for (const pattern of tech.patterns) {
                  patternsChecked++;
                  const patternLower = pattern.toLowerCase();
                  if (srcLower.includes(patternLower)) {
                    found = true;
                    patternsMatched++;
                    detectionMethod = 'script';
                    console.log(`  ✓ Matched "${tech.name}" via script: ${script.src.substring(0, 50)}...`);
                    break;
                  }
                }
                if (found) break;
              }
            }
          }

          // Check links
          if (!found) {
            for (const link of links) {
              const href = (link.href || '').toLowerCase();
              for (const pattern of tech.patterns) {
                const patternLower = pattern.toLowerCase();
                if (href.includes(patternLower)) {
                  found = true;
                  detectionMethod = 'link';
                  break;
                }
              }
              if (found) break;
            }
          }

          // Check meta tags
          if (!found) {
            for (const meta of metaTags) {
              const content = (meta.content || '').toLowerCase();
              const name = (meta.name || '').toLowerCase();
              const property = (meta.getAttribute('property') || '').toLowerCase();

              for (const pattern of tech.patterns) {
                const patternLower = pattern.toLowerCase();
                if (content.includes(patternLower) ||
                  name.includes(patternLower) ||
                  property.includes(patternLower)) {
                  found = true;
                  detectionMethod = 'meta';
                  break;
                }
              }
              if (found) break;
            }
          }

          if (found) {
            // Try to detect version
            const version = detectVersion(techId, htmlSourceLower, scripts);

            detected[tech.category].push({
              id: techId,
              name: tech.name,
              category: tech.category,
              version: version,
              confidence: 'high',
              detectionMethod: detectionMethod,
              detectedAt: new Date().toISOString()
            });
          }
        } catch (techError) {
          console.warn(`Error detecting ${techId}:`, techError);
        }
      });

      // Check for additional technologies
      detectAdditionalTechnologies(detected, htmlSourceLower, scripts, metaTags);

    } catch (error) {
      console.error('Error in detectTechnologies:', error);
      detected.error = error.message;
    }

    // Log final results with scraping statistics
    const totalDetected = Object.values(detected).reduce((sum, arr) => {
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 SCRAPING & DETECTION COMPLETE');
    console.log(`  - Patterns checked: ${patternsChecked || 'N/A'}`);
    console.log(`  - Patterns matched: ${patternsMatched || 'N/A'}`);
    console.log(`  - Technologies found: ${totalDetected}`);
    console.log('  - Detection method: Real-time page analysis');
    console.log('  - Data source: Live webpage scraping');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Detected technologies:', detected);

    return detected;
  }

  function detectVersion(techId, pageSource, scripts) {
    const versionPatterns = {
      react: [
        /react[\/\-@](\d+\.\d+\.\d+)/gi,
        /react@(\d+\.\d+\.\d+)/gi
      ],
      vue: [
        /vue[\/\-@](\d+\.\d+\.\d+)/gi,
        /vue@(\d+\.\d+\.\d+)/gi
      ],
      jquery: [
        /jquery[\/\-@](\d+\.\d+\.\d+)/gi,
        /jquery-(\d+\.\d+\.\d+)/gi
      ],
      bootstrap: [
        /bootstrap[\/\-@](\d+\.\d+\.\d+)/gi,
        /bootstrap-(\d+\.\d+\.\d+)/gi
      ],
      angular: [
        /angular[\/\-@](\d+\.\d+\.\d+)/gi,
        /ng-version="(\d+\.\d+\.\d+)"/gi
      ]
    };

    const patterns = versionPatterns[techId];
    if (!patterns) return null;

    // Check in page source
    for (const pattern of patterns) {
      const match = pageSource.match(pattern);
      if (match && match.length > 0) {
        const versionMatch = match[0].match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) return versionMatch[1];
      }
    }

    // Check in script URLs
    for (const script of scripts) {
      if (script.src) {
        const src = script.src.toLowerCase();
        for (const pattern of patterns) {
          const match = src.match(pattern);
          if (match) {
            const versionMatch = match[0].match(/(\d+\.\d+\.\d+)/);
            if (versionMatch) return versionMatch[1];
          }
        }
      }
    }

    return null;
  }

  function detectAdditionalTechnologies(detected, pageSource, scripts, metaTags) {
    try {
      // Detect by meta tags
      metaTags.forEach(meta => {
        try {
          const generator = (meta.getAttribute('generator') || '').toLowerCase();
          const content = (meta.getAttribute('content') || '').toLowerCase();

          if (generator.includes('wordpress') || content.includes('wordpress')) {
            addIfNotExists(detected.cms, {
              id: 'wordpress_meta',
              name: 'WordPress',
              category: 'cms',
              confidence: 'high',
              detectionMethod: 'meta',
              detectedAt: new Date().toISOString()
            });
          }
        } catch (metaError) {
          // Ignore individual meta tag errors
        }
      });

      // Detect window object properties
      detectFromWindowObject(detected);

      // Detect from performance API
      detectFromPerformanceAPI(detected);

      // Enhanced script URL detection
      scripts.forEach(script => {
        try {
          if (!script.src) return;

          const src = script.src.toLowerCase();

          // Google Analytics
          if (src.includes('gtag.js') || (src.includes('googletagmanager') && src.includes('gtag'))) {
            addIfNotExists(detected.analytics, {
              id: 'ga4',
              name: 'Google Analytics 4',
              category: 'analytics',
              confidence: 'high',
              detectionMethod: 'script',
              detectedAt: new Date().toISOString()
            });
          }

          // Facebook Pixel
          if (src.includes('facebook.net') && src.includes('fbevents')) {
            addIfNotExists(detected.analytics, {
              id: 'facebook_pixel_script',
              name: 'Facebook Pixel',
              category: 'analytics',
              confidence: 'high',
              detectionMethod: 'script',
              detectedAt: new Date().toISOString()
            });
          }

          // Public CDN detection
          if (src.includes('cdn.jsdelivr.net') ||
            src.includes('cdnjs.cloudflare.com') ||
            src.includes('unpkg.com')) {
            addIfNotExists(detected.hosting, {
              id: 'cdn_public',
              name: 'Public CDN',
              category: 'hosting',
              confidence: 'medium',
              detectionMethod: 'script',
              detectedAt: new Date().toISOString()
            });
          }
        } catch (scriptError) {
          // Ignore script detection errors
        }
      });

    } catch (error) {
      console.error('Error in detectAdditionalTechnologies:', error);
    }
  }

  function detectFromWindowObject(detected) {
    try {
      const indicators = [
        { key: 'React', tech: { id: 'react_window', name: 'React', category: 'frontend' } },
        { key: '__REACT_DEVTOOLS_GLOBAL_HOOK__', tech: { id: 'react_devtools', name: 'React', category: 'frontend' } },
        { key: 'Vue', tech: { id: 'vue_window', name: 'Vue.js', category: 'frontend' } },
        { key: '__VUE__', tech: { id: 'vue_app', name: 'Vue.js', category: 'frontend' } },
        { key: '__NUXT__', tech: { id: 'nuxt_app', name: 'Nuxt.js', category: 'frontend' } },
        { key: '__NEXT_DATA__', tech: { id: 'next_data', name: 'Next.js', category: 'frontend' } },
        { key: 'angular', tech: { id: 'angular_window', name: 'Angular', category: 'frontend' } },
        { key: 'jQuery', tech: { id: 'jquery_window', name: 'jQuery', category: 'libraries' } },
        { key: 'Shopify', tech: { id: 'shopify_window', name: 'Shopify', category: 'cms' } }
      ];

      indicators.forEach(({ key, tech }) => {
        try {
          if (typeof window !== 'undefined' && window[key] !== undefined) {
            addIfNotExists(detected[tech.category], {
              id: tech.id,
              name: tech.name,
              category: tech.category,
              confidence: 'high',
              detectionMethod: 'window',
              windowProperty: key,
              detectedAt: new Date().toISOString()
            });
          }
        } catch (e) {
          // Ignore errors accessing window properties
        }
      });

    } catch (error) {
      console.error('Error in detectFromWindowObject:', error);
    }
  }

  function detectFromPerformanceAPI(detected) {
    try {
      if (typeof performance === 'undefined' || !performance.getEntriesByType) {
        return;
      }

      const entries = performance.getEntriesByType('resource');

      entries.forEach(entry => {
        try {
          const url = entry.name.toLowerCase();

          const hostingPatterns = [
            { pattern: 'cloudflare', id: 'cf_perf', name: 'Cloudflare' },
            { pattern: 'amazonaws.com', id: 'aws_perf', name: 'AWS' },
            { pattern: 'cloudfront.net', id: 'cloudfront_perf', name: 'AWS CloudFront' },
            { pattern: 'azureedge.net', id: 'azure_perf', name: 'Microsoft Azure' },
            { pattern: 'googleapis.com', id: 'gcp_perf', name: 'Google Cloud' },
            { pattern: 'gstatic.com', id: 'gstatic_perf', name: 'Google Cloud' },
            { pattern: 'netlify', id: 'netlify_perf', name: 'Netlify' },
            { pattern: 'vercel', id: 'vercel_perf', name: 'Vercel' },
            { pattern: 'herokuapp.com', id: 'heroku_perf', name: 'Heroku' }
          ];

          for (const { pattern, id, name } of hostingPatterns) {
            if (url.includes(pattern)) {
              addIfNotExists(detected.hosting, {
                id: id,
                name: name,
                category: 'hosting',
                confidence: 'medium',
                detectionMethod: 'performance',
                resourceUrl: entry.name,
                detectedAt: new Date().toISOString()
              });
              break;
            }
          }
        } catch (entryError) {
          // Ignore individual entry errors
        }
      });
    } catch (e) {
      // Ignore performance API errors
    }
  }

  // Special React detection for production builds
  function detectReactSpecial(detected, scripts, pageSource) {
    let reactFound = false;
    let reactVersion = null;

    // Method 1: Check for React in window object
    try {
      if (typeof window !== 'undefined') {
        if (window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
          reactFound = true;
        }
      }
    } catch (e) { }

    // Method 2: Check script URLs for React
    scripts.forEach(script => {
      if (script.src) {
        const src = script.src.toLowerCase();
        if (src.includes('react') || src.includes('/static/js/') || src.includes('/assets/')) {
          // Common React build patterns
          if (src.includes('react') || src.match(/\/static\/js\/main\.[a-f0-9]+\.js/)) {
            reactFound = true;
          }
        }
      }
    });

    // Method 3: Check for React DOM patterns in HTML
    const reactPatterns = [
      'data-reactroot',
      'data-reactid',
      '__react',
      'react-root',
      'id="root"',
      'id="app"',
      'class="app"'
    ];

    reactPatterns.forEach(pattern => {
      if (pageSource.includes(pattern.toLowerCase())) {
        reactFound = true;
      }
    });

    // Method 4: Check for JSX-like attributes
    if (pageSource.includes('classname=') || pageSource.includes('onclick=')) {
      reactFound = true;
    }

    // Method 5: Check meta tags
    try {
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach(meta => {
        const content = (meta.content || '').toLowerCase();
        if (content.includes('react') || content.includes('create-react-app')) {
          reactFound = true;
        }
      });
    } catch (e) { }

    if (reactFound) {
      addIfNotExists(detected.frontend, {
        id: 'react_detected',
        name: 'React',
        category: 'frontend',
        version: reactVersion,
        confidence: 'high',
        detectionMethod: 'enhanced',
        detectedAt: new Date().toISOString()
      });
    }
  }

  // Special Vue detection
  function detectVueSpecial(detected, scripts, pageSource) {
    let vueFound = false;

    try {
      if (typeof window !== 'undefined' && (window.Vue || window.__VUE__)) {
        vueFound = true;
      }
    } catch (e) { }

    scripts.forEach(script => {
      if (script.src && script.src.toLowerCase().includes('vue')) {
        vueFound = true;
      }
    });

    if (pageSource.includes('data-v-') || pageSource.includes('v-if') || pageSource.includes('v-for')) {
      vueFound = true;
    }

    if (vueFound) {
      addIfNotExists(detected.frontend, {
        id: 'vue_detected',
        name: 'Vue.js',
        category: 'frontend',
        confidence: 'high',
        detectionMethod: 'enhanced',
        detectedAt: new Date().toISOString()
      });
    }
  }

  // Special Next.js detection
  function detectNextJsSpecial(detected, scripts, pageSource) {
    let nextFound = false;

    try {
      if (typeof window !== 'undefined' && window.__NEXT_DATA__) {
        nextFound = true;
      }
    } catch (e) { }

    scripts.forEach(script => {
      if (script.src) {
        const src = script.src.toLowerCase();
        if (src.includes('/_next/') || src.includes('next.js') || src.includes('next/')) {
          nextFound = true;
        }
      }
    });

    if (pageSource.includes('__next') || pageSource.includes('_next')) {
      nextFound = true;
    }

    if (nextFound) {
      addIfNotExists(detected.frontend, {
        id: 'nextjs_detected',
        name: 'Next.js',
        category: 'frontend',
        confidence: 'high',
        detectionMethod: 'enhanced',
        detectedAt: new Date().toISOString()
      });
    }
  }

  function addIfNotExists(array, item) {
    if (!Array.isArray(array)) {
      console.warn('addIfNotExists: array is not an array', array);
      return;
    }

    if (!array.some(i => i.id === item.id && i.name === item.name)) {
      array.push(item);
    }
  }

  // Message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Tech Detector: Received message:', message.type);

    // Handle async operations
    (async () => {
      try {
        if (message.type === 'DETECT_TECHNOLOGIES') {
          const technologies = await detectTechnologies();

          const result = {
            url: window.location.href,
            hostname: window.location.hostname,
            title: document.title,
            technologies: technologies,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          };

          // Send to background script
          try {
            chrome.runtime.sendMessage({
              type: 'TECH_DATA',
              data: result
            }).catch(err => {
              console.warn('Could not send to background:', err);
            });
          } catch (sendError) {
            console.warn('Could not send message to background:', sendError);
          }

          sendResponse({ success: true, data: result });
          return;
        }

        if (message.type === 'PING') {
          sendResponse({ pong: true, timestamp: new Date().toISOString() });
          return;
        }

      } catch (error) {
        console.error('Message handler error:', error);
        sendResponse({
          error: true,
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    })();

    return true; // Keep channel open for async response
  });

  // Auto-detect on page load if enabled
  try {
    chrome.storage.sync.get(['autoScan'], (result) => {
      if (result && result.autoScan) {
        setTimeout(async () => {
          try {
            const techData = await detectTechnologies();

            chrome.runtime.sendMessage({
              type: 'TECH_DATA',
              data: {
                url: window.location.href,
                hostname: window.location.hostname,
                title: document.title,
                technologies: techData,
                timestamp: new Date().toISOString(),
                autoDetected: true
              }
            }).catch(err => {
              console.warn('Auto-detection message failed:', err);
            });
          } catch (autoDetectError) {
            console.error('Auto-detection error:', autoDetectError);
          }
        }, 2000);
      }
    });
  } catch (storageError) {
    console.warn('Storage access error:', storageError);
  }
}

console.log('Tech Detector Pro content script ready');