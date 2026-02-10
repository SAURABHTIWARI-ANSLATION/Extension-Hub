const GMAIL_URL = "https://mail.google.com/mail/";
const FEED_URL = "https://mail.google.com/mail/feed/atom";
const POLL_INTERVAL = 1; // minutes
const OFFSCREEN_PATH = 'offscreen.html';

// Ensure the offscreen document is open
async function ensureOffscreenDocument() {
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL(OFFSCREEN_PATH)]
    });

    if (existingContexts.length > 0) {
        return;
    }

    await chrome.offscreen.createDocument({
        url: OFFSCREEN_PATH,
        reasons: ['DOM_PARSER'],
        justification: 'To parse the Gmail Atom feed XML',
    });
}

async function getUnreadCount() {
    try {
        const response = await fetch(FEED_URL + "?zx=" + Date.now() + "-" + Math.random(), {
            credentials: 'include',
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        if (!response.ok) {
            if (response.status === 401) {
                updateIcon('auth_error');
                return;
            }
            throw new Error(`HTTP Error: ${response.status}`);
        }
        const text = await response.text();

        await ensureOffscreenDocument();

        // Send to offscreen for parsing
        const responseData = await chrome.runtime.sendMessage({
            type: 'PARSE_XML',
            xmlString: text
        });

        if (responseData && responseData.type === 'PARSE_RESULT') {
            const count = responseData.count;
            await chrome.storage.local.set({
                unreadCount: count,
                entries: responseData.entries,
                lastUpdated: Date.now(),
                loggedIn: true
            });
            updateIcon(count);
        } else {
            console.warn('Parse failed', responseData);
        }

    } catch (error) {
        console.error('Fetch error:', error);
        updateIcon('error');
        const isLoggedIn = await chrome.storage.local.get('loggedIn');
        if (isLoggedIn.loggedIn !== false) {
            await chrome.storage.local.set({ loggedIn: false });
        }
    }
}

function updateIcon(status) {
    if (status === 'auth_error' || status === 'error') {
        chrome.action.setIcon({ path: "gmail_not_logged_in.png" });
        chrome.action.setBadgeText({ text: "?" });
        chrome.action.setBadgeBackgroundColor({ color: [190, 190, 190, 230] });
    } else {
        chrome.action.setIcon({ path: "gmail_logged_in.png" });
        chrome.action.setBadgeBackgroundColor({ color: [208, 0, 24, 255] });
        chrome.action.setBadgeText({ text: status === "0" ? "" : status.toString() });
    }
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'poll') {
        getUnreadCount();
    }
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('poll', { periodInMinutes: POLL_INTERVAL });
    getUnreadCount();
});

chrome.runtime.onStartup.addListener(() => {
    getUnreadCount();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Return true to indicate we will send a response asynchronously
    if (message.type === 'REFRESH') {
        getUnreadCount().then(() => {
            sendResponse({ status: 'completed' });
        });
        return true;
    }
});

// Auto-refresh when navigating to Gmail
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith(GMAIL_URL)) {
        getUnreadCount();
    }
});
