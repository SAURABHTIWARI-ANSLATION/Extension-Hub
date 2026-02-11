/**
 * CSP-Safe DOM Helper Utilities
 * Replaces innerHTML with safe createElement patterns
 */

/**
 * Safely creates a DOM structure from a template description
 * @param tagName - HTML tag to create
 * @param options - className, textContent, children, attributes
 */
export function createElement(
    tagName: string,
    options: {
        className?: string;
        textContent?: string;
        id?: string;
        type?: string;
        accept?: string;
        placeholder?: string;
        value?: string;
        children?: HTMLElement[];
        attributes?: Record<string, string>;
    } = {}
): HTMLElement {
    const element = document.createElement(tagName);

    if (options.className) element.className = options.className;
    if (options.textContent) element.textContent = options.textContent;
    if (options.id) element.id = options.id;

    // Input-specific attributes
    if (tagName === 'input') {
        if (options.type) (element as HTMLInputElement).type = options.type;
        if (options.accept) (element as HTMLInputElement).accept = options.accept;
        if (options.placeholder) (element as HTMLInputElement).placeholder = options.placeholder;
        if (options.value) (element as HTMLInputElement).value = options.value;
    }

    // Custom attributes
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }

    // Append children
    if (options.children) {
        options.children.forEach(child => element.appendChild(child));
    }

    return element;
}

/**
 * Creates a standard tool UI structure with file input and controls
 */
export function createToolUI(config: {
    inputId: string;
    inputAccept: string;
    hasPreview?: boolean;
    hasLoader?: boolean;
    children?: HTMLElement[];
}): HTMLElement {
    const toolDiv = createElement('div', { className: 'tool-io' });

    // File input
    const fileInput = createElement('input', {
        type: 'file',
        id: config.inputId,
        accept: config.inputAccept,
        className: 'file-input'
    });
    toolDiv.appendChild(fileInput);

    // Loader (if needed)
    if (config.hasLoader) {
        const loader = createElement('div', {
            id: 'loader',
            className: 'hidden',
            textContent: 'Processing...'
        });
        toolDiv.appendChild(loader);
    }

    // Additional children
    if (config.children) {
        config.children.forEach(child => toolDiv.appendChild(child));
    }

    return toolDiv;
}
