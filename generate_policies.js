const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const policiesDir = path.join(rootDir, 'privacy-policies');
const indexFile = path.join(rootDir, 'index.html');

// Ensure policies directory exists
if (!fs.existsSync(policiesDir)) {
    fs.mkdirSync(policiesDir);
}

// Helper to get directories
const getDirectories = source =>
    fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

// Helper to read manifest
const readManifest = (dirPath) => {
    const manifestPath = path.join(dirPath, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        try {
            return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch (e) {
            console.error(`Error reading manifest in ${dirPath}:`, e);
        }
    }
    return null;
};

// HTML Template for Policy
const generatePolicyHTML = (extensionName, permissions) => {
    let permissionList = '<p>This extension requires no special permissions.</p>';

    if (permissions && permissions.length > 0) {
        permissionList = `<ul>${permissions.map(p => `<li><strong>${p}</strong>: Required for extension functionality.</li>`).join('')}</ul>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - ${extensionName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { margin-top: 30px; }
        ul { list-style-type: disc; padding-left: 20px; }
        li { margin-bottom: 10px; }
        code { background-color: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
        .footer { margin-top: 50px; font-size: 0.8em; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <h1>Privacy Policy for ${extensionName}</h1>
    
    <h2>Introduction</h2>
    <p>This Privacy Policy describes how the <strong>${extensionName}</strong> Chrome extension collects, uses, and discloses information, and what choices you have with respect to the information.</p>

    <h2>Data Collection and Usage</h2>
    <p><strong>We do not collect any personal data.</strong></p>
    <p>The <strong>${extensionName}</strong> operates entirely locally on your device.</p>
    <ul>
        <li>We do <strong>not</strong> transmit any data to external servers.</li>
        <li>We do <strong>not</strong> collect your browsing history.</li>
        <li>We do <strong>not</strong> collect any personally identifiable information (PII).</li>
    </ul>

    <h2>Permissions Usage</h2>
    <p>The extension requests the following permissions for functionality purposes only:</p>
    ${permissionList}

    <h2>Third-Party Services</h2>
    <p>This extension does not use any third-party analytics or tracking services.</p>

    <h2>Changes to This Policy</h2>
    <p>We may update our Privacy Policy from time to time. Thus, you are advised to review this page periodically for any changes.</p>

    <h2>Contact Us</h2>
    <p>If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us.</p>
    
    <div class="footer">
        &copy; 2026 Saurabh Tiwari and ANSLATION COMPANY. All rights reserved.
    </div>
</body>
</html>`;
};

// HTML Template for Index
const generateIndexHTML = (extensions) => {
    const cards = extensions.map(ext => `
        <div class="card">
            <div class="info">
                <h3>${ext.name}</h3>
                <p>Privacy Policy</p>
            </div>
            <div class="link-box">
                https://SAURABHTIWARI-ANSLATION.github.io/Extension-Hub/privacy-policies/${ext.filename}</div>
            <a href="privacy-policies/${ext.filename}" class="view-btn">View Policy</a>
        </div>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policies - Extension Hub</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; color: #333; }
        h1 { text-align: center; margin-bottom: 20px; }
        .description { text-align: center; color: #666; margin-bottom: 40px; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
        .card { border: 1px solid #eee; border-radius: 8px; padding: 20px; background: #fff; display: flex; justify-content: space-between; align-items: center; }
        .card:hover { border-color: #bbb; }
        .info { flex-grow: 1; }
        .info h3 { margin: 0 0 5px 0; color: #2196F3; }
        .info p { margin: 0; font-size: 0.9em; color: #666; }
        .link-box { background: #f5f5f5; padding: 8px 12px; border-radius: 4px; border: 1px solid #ddd; font-family: monospace; font-size: 0.85em; color: #333; margin-left: 20px; user-select: all; white-space: nowrap; overflow-x: auto; max-width: 400px; }
        .view-btn { display: inline-block; padding: 8px 16px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; font-size: 0.9em; margin-left: 10px; white-space: nowrap; }
        .view-btn:hover { background-color: #1976D2; }
    </style>
</head>
<body>
    <h1>Extension Hub Privacy Policies</h1>
    <p class="description">Below are the direct links to the privacy policies for all extensions (${extensions.length} total).</p>
    <div class="grid">
        ${cards}
    </div>
</body>
</html>`;
};

// Helper to resolve localized name
const resolveName = (dirPath, rawName) => {
    if (rawName && rawName.startsWith('__MSG_')) {
        const key = rawName.replace('__MSG_', '').replace('__', '');
        const messagesPath = path.join(dirPath, '_locales', 'en', 'messages.json');
        if (fs.existsSync(messagesPath)) {
            try {
                const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
                if (messages[key] && messages[key].message) {
                    return messages[key].message;
                }
            } catch (e) {
                console.error(`Error reading locales for ${dirPath}:`, e);
            }
        }
    }
    return rawName;
};

// Main Execution
const directories = getDirectories(rootDir);
const processedExtensions = [];

directories.forEach(dir => {
    if (dir === 'privacy-policies' || dir.startsWith('.')) return;

    const dirPath = path.join(rootDir, dir);
    const manifest = readManifest(dirPath);

    if (manifest) {
        let name = manifest.name || dir;
        name = resolveName(dirPath, name);

        const permissions = [
            ...(manifest.permissions || []),
            ...(manifest.host_permissions || [])
        ];

        // Sanitize filename
        let filename = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        if (!filename) filename = 'extension';
        filename += '.html';

        const content = generatePolicyHTML(name, permissions);
        fs.writeFileSync(path.join(policiesDir, filename), content);

        processedExtensions.push({ name, filename });
        console.log(`Generated policy for: ${name}`);
    }
});

const legacyIndexFile = path.join(rootDir, 'privacy_index.html');

// Before logging success:
const indexContent = generateIndexHTML(processedExtensions);
fs.writeFileSync(indexFile, indexContent);
fs.writeFileSync(legacyIndexFile, indexContent);
console.log(`\nSuccessfully generated ${processedExtensions.length} privacy policies and updated both index.html and privacy_index.html.`);
