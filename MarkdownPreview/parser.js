/**
 * Lightweight Markdown Parser
 * Handles: Headers, Lists, Bold, Italic, Code, Blockquotes, Links
 */
const parseMarkdown = (markdown) => {
    if (!markdown) return '';

    let html = markdown
        // Escape HTML characters to prevent XSS
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

        // Headers (h1-h6)
        .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
        .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')

        // Blockquotes
        .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')

        // Bold
        .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
        .replace(/__(.*)__/gim, '<b>$1</b>')

        // Italic
        .replace(/\*(.*)\*/gim, '<i>$1</i>')
        .replace(/_(.*)_/gim, '<i>$1</i>')

        // Inline Code
        .replace(/`([^`]+)`/gim, '<code>$1</code>')

        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')

        // Horizontal Rule
        .replace(/^---$/gim, '<hr>')
        
        // Unordered Lists (simple implementation)
        .replace(/^\s*[\*|\-|\+] (.*)/gim, '<ul><li>$1</li></ul>')
        .replace(/<\/ul>\n<ul>/gim, '')

        // Ordered Lists (simple implementation)
        .replace(/^\s*\d+\. (.*)/gim, '<ol><li>$1</li></ol>')
        .replace(/<\/ol>\n<ol>/gim, '')

        // Paragraphs (double newline)
        .replace(/\n\n/gim, '</p><p>')
        .replace(/^/gim, '<p>')
        .replace(/$/gim, '</p>')
        
        // Clean up empty paragraphs
        .replace(/<p><\/p>/gim, '');

    return html;
};

// Export for usage if using modules, but for vanilla extension just global or IIFE
window.parseMarkdown = parseMarkdown;
