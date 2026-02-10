// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PARSE_XML') {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(message.xmlString, 'text/xml');

        const fullCountNode = xmlDoc.getElementsByTagName('fullcount')[0];
        const fullCount = fullCountNode ? fullCountNode.textContent : null;

        if (fullCount !== null) {
            // Also parse recent entries for the popup
            const entries = Array.from(xmlDoc.getElementsByTagName('entry')).map(entry => {
                const title = entry.getElementsByTagName('title')[0]?.textContent || 'No Subject';
                const summary = entry.getElementsByTagName('summary')[0]?.textContent || '';
                const authorName = entry.getElementsByTagName('author')[0]?.getElementsByTagName('name')[0]?.textContent || 'Unknown';
                const link = entry.getElementsByTagName('link')[0]?.getAttribute('href') || '';
                const issued = entry.getElementsByTagName('issued')[0]?.textContent || entry.getElementsByTagName('modified')[0]?.textContent || '';

                return {
                    title,
                    summary,
                    authorName,
                    link,
                    issued
                };
            });

            sendResponse({ type: 'PARSE_RESULT', count: fullCount, entries: entries });
        } else {
            sendResponse({ type: 'PARSE_ERROR', error: 'Could not find fullcount node' });
        }
    }
    return true; // Keep the message channel open for async response
});
