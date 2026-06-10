/* ============================================
   LANGUAGE MANAGEMENT
   ============================================ */

let currentLanguage = 'de';

function setLanguage(lang) {
    currentLanguage = lang;
    
    // Update button states
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update visible text
    document.querySelectorAll('[data-lang]').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('data-lang') === lang) {
            el.classList.add('active');
        }
    });
    
    // Update textarea placeholder
    const textarea = document.getElementById('projectInput');
    if (lang === 'de') {
        textarea.placeholder = 'Schreibe hier alles über dein Projekt auf. Je mehr Details, desto besser wird der Brief...';
    } else {
        textarea.placeholder = 'Write everything about your project here. The more details, the better the brief...';
    }
}

// Initialize language
document.addEventListener('DOMContentLoaded', () => {
    setLanguage('de');
    loadRecentBriefs();
    
    // Set up single textarea
    const textareas = document.querySelectorAll('#projectInput');
    if (textareas.length > 1) {
        // Keep only first textarea, remove duplicates
        textareas.forEach((ta, index) => {
            if (index > 0) ta.remove();
        });
    }
});

/* ============================================
   BRIEF GENERATION
   ============================================ */

async function generateBrief() {
    const projectInput = document.getElementById('projectInput').value.trim();

    if (!projectInput) {
        showError(currentLanguage === 'de' 
            ? 'Bitte schreib erst etwas über dein Projekt!' 
            : 'Please write something about your project first!');
        return;
    }

    // Show loading state
    document.getElementById('inputSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('resultsSection').classList.remove('active');
    document.getElementById('errorSection').style.display = 'none';

    try {
        // Call Netlify Function
        const response = await fetch('/.netlify/functions/generate-brief', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projectText: projectInput,
                language: currentLanguage
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Unknown error');
        }

        // Display brief
        displayBrief(data.brief, data.timestamp);

        // Save to local storage
        saveBrief(projectInput, data.brief);

        // Hide loading
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('resultsSection').classList.add('active');

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loadingSection').style.display = 'none';
        showError(error.message || (currentLanguage === 'de' 
            ? 'Es gab einen Fehler beim Erstellen deines Briefs. Versuche es später nochmal.'
            : 'There was an error creating your brief. Please try again later.'));
    }
}

/* ============================================
   DISPLAY BRIEF
   ============================================ */

function displayBrief(briefContent, timestamp) {
    const briefContentDiv = document.getElementById('briefContent');
    
    // Parse markdown-like content
    const formattedContent = briefContent
        .replace(/### /g, '<h3>')
        .replace(/\n/g, '</h3>\n<p>')
        .replace(/<\/h3>\n<p><h3>/g, '</p>\n<h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/- /g, '• ')
        + '</p>';

    briefContentDiv.innerHTML = formattedContent;

    // Update timestamp
    const timestampEl = document.getElementById('briefTimestamp');
    const date = new Date(timestamp);
    const timeString = date.toLocaleString(currentLanguage === 'de' ? 'de-DE' : 'en-US');
    timestampEl.textContent = currentLanguage === 'de' 
        ? `Erstellt: ${timeString}`
        : `Created: ${timeString}`;

    // Store for export
    window.currentBrief = {
        content: briefContent,
        timestamp: timestamp,
        originalInput: document.getElementById('projectInput').value
    };
}

/* ============================================
   STORAGE & HISTORY
   ============================================ */

function saveBrief(input, brief) {
    const briefs = JSON.parse(localStorage.getItem('savedBriefs') || '[]');
    
    briefs.unshift({
        id: Date.now(),
        input: input.substring(0, 100),
        brief: brief,
        timestamp: new Date().toISOString(),
        language: currentLanguage
    });

    // Keep only last 10 briefs
    briefs.splice(10);

    localStorage.setItem('savedBriefs', JSON.stringify(briefs));
    loadRecentBriefs();
}

function loadRecentBriefs() {
    const briefs = JSON.parse(localStorage.getItem('savedBriefs') || '[]');
    
    if (briefs.length === 0) {
        document.getElementById('recentSection').style.display = 'none';
        return;
    }

    document.getElementById('recentSection').style.display = 'block';
    document.getElementById('recentSection').classList.add('active');
    const history = document.getElementById('briefHistory');
    history.innerHTML = '';

    briefs.forEach((brief, index) => {
        const date = new Date(brief.timestamp);
        const timeString = date.toLocaleString(currentLanguage === 'de' ? 'de-DE' : 'en-US');
        
        const item = document.createElement('div');
        item.className = 'brief-history-item';
        item.innerHTML = `
            <div class="brief-history-info">
                <p class="brief-history-input">${escapeHtml(brief.input)}...</p>
                <p class="brief-history-time">${timeString}</p>
            </div>
            <button onclick="loadSavedBrief(${index})" class="btn-secondary btn-small">
                ${currentLanguage === 'de' ? 'Öffnen' : 'Open'}
            </button>
        `;
        history.appendChild(item);
    });
}

function loadSavedBrief(index) {
    const briefs = JSON.parse(localStorage.getItem('savedBriefs') || '[]');
    const brief = briefs[index];

    if (!brief) return;

    window.currentBrief = {
        content: brief.brief,
        timestamp: brief.timestamp,
        originalInput: brief.input
    };

    displayBrief(brief.brief, brief.timestamp);
    document.getElementById('inputSection').style.display = 'none';
    document.getElementById('resultsSection').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================
   EXPORT & SHARE
   ============================================ */

function exportBrief() {
    if (!window.currentBrief) return;

    const element = document.createElement('a');
    const file = new Blob([window.currentBrief.content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `creative-brief-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function copyBrief() {
    if (!window.currentBrief) return;

    navigator.clipboard.writeText(window.currentBrief.content).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = currentLanguage === 'de' ? '✓ Kopiert!' : '✓ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(() => {
        alert(currentLanguage === 'de' ? 'Kopieren fehlgeschlagen' : 'Copy failed');
    });
}

function emailBrief() {
    if (!window.currentBrief) return;

    const subject = currentLanguage === 'de'
        ? 'Mein Creative Brief - Marcel Haupt Method'
        : 'My Creative Brief - Marcel Haupt Method';
    
    const body = encodeURIComponent(`
CREATIVE BRIEF
Created: ${window.currentBrief.timestamp}

${window.currentBrief.content}

---
Created with Creative Brief To Go by Marcel Haupt
www.marcelhaupt.com
    `);

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
}

/* ============================================
   NAVIGATION
   ============================================ */

function startOver() {
    document.getElementById('projectInput').value = '';
    document.getElementById('inputSection').style.display = 'block';
    document.getElementById('resultsSection').classList.remove('active');
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('inputSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('resultsSection').classList.remove('active');
    document.getElementById('errorSection').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/* ============================================
   KEYBOARD SHORTCUTS
   ============================================ */

document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + Enter to generate brief
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const inputElement = document.getElementById('projectInput');
        if (inputElement && document.activeElement === inputElement) {
            generateBrief();
        }
    }
});
