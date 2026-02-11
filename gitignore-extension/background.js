// ======== GITIGNORE PREMIUM - ENTERPRISE DETECTION ENGINE ========

'use strict';

// Premium detection signatures with multiple file patterns
const DETECTION_SIGNATURES = [
  // Node.js ecosystem
  { name: "node", files: ["/package.json", "/yarn.lock", "/pnpm-lock.yaml"], weight: 1 },
  { name: "npm", files: ["/package-lock.json", "/.npmrc"], weight: 0.8 },
  { name: "yarn", files: ["/yarn.lock", "/.yarnrc.yml"], weight: 0.8 },
  { name: "pnpm", files: ["/pnpm-lock.yaml", "/pnpm-workspace.yaml"], weight: 0.8 },
  
  // Python ecosystem
  { name: "python", files: ["/requirements.txt", "/pyproject.toml", "/setup.py", "/Pipfile"], weight: 1 },
  { name: "django", files: ["/manage.py", "/wsgi.py"], weight: 0.9 },
  { name: "flask", files: ["/app.py", "/wsgi.py"], weight: 0.9 },
  { name: "fastapi", files: ["/main.py", "/api.py"], weight: 0.9 },
  
  // JavaScript frameworks
  { name: "react", files: ["/src/App.js", "/src/App.tsx", "/vite.config.js"], weight: 0.9 },
  { name: "next", files: ["/next.config.js", "/next.config.mjs", "/.next/"], weight: 0.95 },
  { name: "vue", files: ["/vue.config.js", "/src/main.js", "/src/App.vue"], weight: 0.9 },
  { name: "angular", files: ["/angular.json", "/tsconfig.json"], weight: 0.9 },
  { name: "svelte", files: ["/svelte.config.js", "/src/App.svelte"], weight: 0.9 },
  
  // Backend technologies
  { name: "java", files: ["/pom.xml", "/build.gradle", "/settings.gradle"], weight: 1 },
  { name: "spring", files: ["/src/main/resources/application.properties"], weight: 0.9 },
  { name: "php", files: ["/composer.json", "/artisan", "/index.php"], weight: 1 },
  { name: "laravel", files: ["/artisan", "/.env.example"], weight: 0.9 },
  { name: "go", files: ["/go.mod", "/go.sum"], weight: 1 },
  { name: "rust", files: ["/Cargo.toml", "/Cargo.lock"], weight: 1 },
  { name: "ruby", files: ["/Gemfile", "/Gemfile.lock", "/config.ru"], weight: 1 },
  { name: "rails", files: ["/bin/rails", "/app/controllers"], weight: 0.9 },
  
  // DevOps & Cloud
  { name: "docker", files: ["/Dockerfile", "/docker-compose.yml"], weight: 1 },
  { name: "kubernetes", files: ["/k8s/", "/deployment.yaml", "/service.yaml"], weight: 0.9 },
  { name: "terraform", files: ["/*.tf", "/terraform.tfvars"], weight: 0.95 },
  { name: "ansible", files: ["/ansible.cfg", "/playbook.yml"], weight: 0.9 },
  
  // Mobile
  { name: "android", files: ["/AndroidManifest.xml", "/gradlew"], weight: 1 },
  { name: "ios", files: ["/Info.plist", "/Podfile"], weight: 1 },
  { name: "flutter", files: ["/pubspec.yaml", "/lib/main.dart"], weight: 1 },
  { name: "react-native", files: ["/android/app/build.gradle", "/ios/Podfile"], weight: 0.95 },
  
  // Databases
  { name: "mysql", files: ["/my.cnf", "/.my.cnf"], weight: 0.7 },
  { name: "postgresql", files: ["/postgresql.conf"], weight: 0.7 },
  { name: "mongodb", files: ["/mongod.conf"], weight: 0.7 },
  
  // CMS Platforms
  { name: "wordpress", files: ["/wp-config.php", "/wp-content/"], weight: 0.9 },
  { name: "drupal", files: ["/web/sites/default/settings.php"], weight: 0.9 },
  { name: "shopify", files: ["/config.yml", "/.shopify/"], weight: 0.9 }
];

// Cache for detection results
const detectionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Enterprise-grade file existence checker with timeout and error handling
 */
async function checkFileExists(url, timeout = 3000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'force-cache',
      mode: 'cors',
      credentials: 'omit'
    });
    
    clearTimeout(timeoutId);
    return response.status === 200;
  } catch (error) {
    clearTimeout(timeoutId);
    return false;
  }
}

/**
 * Premium detection with parallel execution and scoring
 */
async function detectTechStack(tabId, tabUrl) {
  // Check cache first
  const cacheKey = `${tabId}-${tabUrl}`;
  const cached = detectionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results;
  }
  
  try {
    // Execute detection in page context
    const injectionResult = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (signatures) => {
        const baseUrl = window.location.origin;
        const detectionResults = [];
        
        // Group by weight for priority checking
        const highPriority = signatures.filter(s => s.weight >= 0.9);
        const mediumPriority = signatures.filter(s => s.weight >= 0.7);
        const lowPriority = signatures.filter(s => s.weight < 0.7);
        
        // Check high priority first
        for (const check of highPriority) {
          for (const file of check.files) {
            try {
              const response = await fetch(`${baseUrl}${file}`, { 
                method: 'HEAD',
                cache: 'force-cache'
              });
              if (response.ok) {
                detectionResults.push({
                  name: check.name,
                  confidence: check.weight * 100,
                  file
                });
                break;
              }
            } catch { continue; }
          }
        }
        
        // Then medium priority
        for (const check of mediumPriority) {
          for (const file of check.files) {
            try {
              const response = await fetch(`${baseUrl}${file}`, { 
                method: 'HEAD',
                cache: 'force-cache'
              });
              if (response.ok) {
                detectionResults.push({
                  name: check.name,
                  confidence: check.weight * 80,
                  file
                });
                break;
              }
            } catch { continue; }
          }
        }
        
        return detectionResults;
      },
      args: [DETECTION_SIGNATURES]
    });
    
    const results = injectionResult?.[0]?.result || [];
    
    // Process and deduplicate results
    const techMap = new Map();
    results.forEach(({ name, confidence }) => {
      if (!techMap.has(name) || techMap.get(name).confidence < confidence) {
        techMap.set(name, { name, confidence });
      }
    });
    
    const processedResults = Array.from(techMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .map(t => t.name);
    
    // Cache results
    detectionCache.set(cacheKey, {
      timestamp: Date.now(),
      results: processedResults
    });
    
    return processedResults;
  } catch (error) {
    console.error('[GitIgnore Premium] Detection error:', error);
    return [];
  }
}

/**
 * Message handler with premium features
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.action === "detectTechStack") {
    // ✅ Check if tab exists
    chrome.tabs.get(request.tabId, async (tab) => {
      if (chrome.runtime.lastError) {
        console.error('[GitIgnore Premium] Tab error:', chrome.runtime.lastError);
        sendResponse([]);
        return;
      }
      
      const results = await detectTechStack(request.tabId, tab.url);
      sendResponse(results);
    });
    
    return true; // Keep message channel open
  }
  
  if (request?.action === "clearCache") {
    detectionCache.clear();
    sendResponse({ success: true });
    return false;
  }
  
  // ✅ Handle ping to check if background is alive
  if (request?.action === "ping") {
    sendResponse({ status: "alive" });
    return false;
  }
});

// Clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of detectionCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      detectionCache.delete(key);
    }
  }
}, 60000); // Every minute

console.log('[GitIgnore Premium] Background script initialized');