const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const resultContainer = document.getElementById('result');
const wordContent = document.getElementById('wordContent');
const loadingState = document.getElementById('loading');
const emptyState = document.querySelector('.empty-state');
const errorState = document.getElementById('error');
const clearBtn = document.getElementById('clearBtn');

// Helper to toggle visibility
const setView = (view) => {
    // Hide all
    wordContent.classList.add('displayNone');
    loadingState.classList.add('displayNone');
    emptyState.classList.add('displayNone');
    errorState.classList.add('displayNone');

    // Show requested
    if (view === 'loading') loadingState.classList.remove('displayNone');
    else if (view === 'result') wordContent.classList.remove('displayNone');
    else if (view === 'empty') emptyState.classList.remove('displayNone');
    else if (view === 'error') errorState.classList.remove('displayNone');
};

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const term = searchInput.value.trim();
    if (!term) return;

    setView('loading');
    fetchDictionary(term);
});

async function fetchDictionary(term) {
    // Check if it's a sentence (more than one word)
    if (term.includes(' ')) {
        await fetchSentenceTranslation(term);
    } else {
        await fetchWordData(term);
    }
}

async function fetchSentenceTranslation(term) {
    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${term}&langpair=en|hi`);
        const data = await response.json();

        if (data.responseData && data.responseData.translatedText) {
            renderSentence(term, data.responseData.translatedText);
        } else {
            throw new Error('Translation not found');
        }
    } catch (err) {
        console.error(err);
        renderError(term);
    }
}

async function fetchWordData(term) {
    try {
        const [dictResponse, transResponse] = await Promise.allSettled([
            fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${term}`),
            fetch(`https://api.mymemory.translated.net/get?q=${term}&langpair=en|hi`)
        ]);

        let dictData = null;
        let translation = '';

        // Handle Dictionary API Response
        if (dictResponse.status === 'fulfilled' && dictResponse.value.ok) {
            const data = await dictResponse.value.json();
            dictData = data[0];
        } else {
            // If dictionary fails but we have translation, we can still show something?
            // For now, if dictionary fails, we treat it as an error for single words as per original requirement,
            // or we could fallback to just translation. Let's stick to strict dictionary focus for single words unless requested otherwise.
            throw new Error('Word not found');
        }

        // Handle Translation API Response
        if (transResponse.status === 'fulfilled' && transResponse.value.ok) {
            const data = await transResponse.value.json();
            if (data.responseData && data.responseData.translatedText) {
                const translatedText = data.responseData.translatedText;
                if (translatedText.toLowerCase() !== term.toLowerCase()) {
                    translation = translatedText;
                }
            }
        }

        renderResult(dictData, translation);

    } catch (err) {
        console.error(err);
        renderError(term);
    }
}

function renderSentence(term, translation) {
    const html = `
        <div class="word-header">
            <h2>${term}</h2>
            <span class="hindi-translation" style="margin-top: 12px; font-size: 1.4rem;">${translation}</span>
        </div>
        <div class="meanings">
             <div class="meaning-group">
                <span class="part-of-speech">Translation</span>
                <p style="color: var(--text-secondary); line-height: 1.5;">${translation}</p>
            </div>
        </div>
    `;
    wordContent.innerHTML = html;
    setView('result');
}


function renderResult(entry, translation) {
    const { word, phonetics, meanings } = entry;

    // Find first phonetic with text
    const phoneticText = phonetics.find(p => p.text)?.text || '';

    let meaningsHtml = '';

    meanings.forEach(meaning => {
        const definitionsHtml = meaning.definitions.map(def => `
            <li>
                ${def.definition}
                ${def.example ? `<span class="example">"${def.example}"</span>` : ''}
            </li>
        `).join('');

        meaningsHtml += `
            <div class="meaning-group">
                <span class="part-of-speech">${meaning.partOfSpeech}</span>
                <ul class="definition-list">
                    ${definitionsHtml}
                </ul>
            </div>
        `;
    });

    const html = `
        <div class="word-header">
            <h2>${word}</h2>
            ${phoneticText ? `<span class="phonetic">${phoneticText}</span>` : ''}
            ${translation ? `<span class="hindi-translation">${translation}</span>` : ''}
        </div>
        <div class="meanings">
            ${meaningsHtml}
        </div>
    `;

    wordContent.innerHTML = html;
    setView('result');
}

function renderError(term) {
    errorState.innerHTML = `
        <p><strong>Oh no!</strong></p>
        <p>We couldn't find definitions for "<em>${term}</em>".</p>
    `;
    setView('error');
}

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.focus();
    setView('empty');
    wordContent.innerHTML = '';
});

