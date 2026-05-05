import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('.', import.meta.url).pathname;

const files = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'background.js',
  'content.js',
  'popup.css',
  'options.html',
  'options.js',
  'options.css'
];

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const contents = {};
for (const f of files) {
  contents[f] = await readFile(join(root, f), 'utf8');
}

// CSP/MV3 sanity checks
if (/style="/i.test(contents['popup.html'])) fail('popup.html contains inline style attributes');
else ok('No inline style attributes in popup.html');

if (/style="/i.test(contents['options.html'])) fail('options.html contains inline style attributes');
else ok('No inline style attributes in options.html');

const jsAll = contents['popup.js'] + contents['background.js'] + contents['content.js'] + contents['options.js'];

if (/\beval\s*\(/.test(jsAll)) fail('eval() found in JS');
else ok('No eval() found');

if (/\bnew Function\s*\(/.test(jsAll)) fail('new Function() found in JS');
else ok('No new Function() found');

if (/\.\s*innerHTML\b/.test(jsAll)) fail('innerHTML property usage found');
else ok('No innerHTML property usage found');

const manifest = JSON.parse(contents['manifest.json']);
if (manifest.manifest_version !== 3) fail('manifest_version is not 3');
else ok('manifest_version is 3');

const permissions = new Set(manifest.permissions || []);
if (permissions.has('scripting')) fail('manifest still requests scripting permission');
else ok('No scripting permission requested');

if (!manifest.content_security_policy?.extension_pages) fail('No extension_pages CSP set');
else ok('extension_pages CSP is set');

if (process.exitCode) {
  console.error('\nSelfcheck failed. Fix issues above before publishing.');
} else {
  console.log('\nSelfcheck passed.');
}

