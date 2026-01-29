// 1. Listen for "Apply Manual Mode"
document.getElementById('applyBtn').addEventListener('click', () => {
    const val = document.getElementById('tempSlider').value;
    injectFilter(val);
});

// 2. Listen for "Auto Night Mode"
document.getElementById('autoBtn').addEventListener('click', () => {
    const hour = new Date().getHours();
    // If it is after 6 PM (18) OR before 6 AM (6), use Warm mode
    if (hour >= 18 || hour < 6) {
        document.getElementById('tempSlider').value = 40; 
        injectFilter(40); 
    } else {
        document.getElementById('tempSlider').value = 0; 
        injectFilter(0); 
    }
});

// 3. Listen for "Reset / Turn Off"
document.getElementById('resetBtn').addEventListener('click', async () => {
    document.getElementById('tempSlider').value = 0;
    
    // Safety Wrapper
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Don't try to run on chrome:// urls
        if (tab.url.startsWith("chrome://")) return; 

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const overlay = document.getElementById('eye-protector-overlay');
                if (overlay) overlay.remove();
            }
        });
    } catch (error) {
        console.log("Cannot run on this page.");
    }
});

// Helper Function to Inject Script with Error Handling
async function injectFilter(value) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Check if the URL is restricted
        if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("edge://")) {
            alert("This extension cannot run on browser system pages. Please try a normal website like Google or Wikipedia.");
            return;
        }

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: applyOverlayColor,
            args: [value]
        });
    } catch (err) {
        console.error("Error applying filter:", err);
    }
}

// THIS FUNCTION RUNS INSIDE THE WEBPAGE
function applyOverlayColor(value) {
    let overlay = document.getElementById('eye-protector-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'eye-protector-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            pointer-events: none;
            z-index: 2147483647;
            mix-blend-mode: multiply;
            transition: background-color 0.5s ease;
        `;
        document.body.appendChild(overlay);
    }

    let r, g, b, alpha;
    
    if (value > 0) {
        r = 255; g = 160; b = 0;
        alpha = value / 150; 
    } else {
        r = 0; g = 100; b = 255;
        alpha = Math.abs(value) / 300;
    }

    if (value == 0) {
        overlay.style.backgroundColor = 'transparent';
    } else {
        overlay.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}