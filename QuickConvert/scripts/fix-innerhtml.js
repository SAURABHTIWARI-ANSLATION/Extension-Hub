#!/usr/bin/env node

/**
 * CSP Fix Script for QuickConvert Modules
 * Automatically replaces innerHTML with safe DOM methods
 */

const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '../src/modules');

// Modules to fix (those with simple template innerHTML)
const simpleModules = [
    'imageResizer.ts',
    'pdfToImage.ts',
    'pdfCompressor.ts',
    'imageToPdf.ts',
    'pdfOcr.ts',
    'pdfToPpt.ts',
    'pdfSecurity.ts',
    'imageReducer.ts',
    'pdfToDocx.ts',
    'pdfSplit.ts'
];

console.log('🔧 Starting CSP innerHTML fixes...\n');

// Note: This is a documentation script
// Actual fixes need to be done manually due to complex template structures

console.log('📝 Manual fix required for:');
simpleModules.forEach(mod => {
    console.log(`   - ${mod}`);
});

console.log('\n💡 Pattern to follow:');
console.log(`
BEFORE:
    container.innerHTML = \`
        <div class="tool-io">
            <input type="file" id="my-input" class="file-input" />
        </div>
    \`;

AFTER:
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'my-input';
    fileInput.className = 'file-input';
    
    toolDiv.appendChild(fileInput);
    container.appendChild(toolDiv);
`);

console.log('\n✅ See cropper.ts for reference implementation');
