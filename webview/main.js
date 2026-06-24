/**
 * CP Arena — Webview (Clean layout + CPH font/button ref)
 */
// @ts-check
/** @type {any} */
const vscode = acquireVsCodeApi();

let currentProblem = null;
let onlineJudgeFlag = true;

const $ = (id) => document.getElementById(id);
const $testCases = $('test-cases');
const $emptyState = $('empty-state');
const $problemInfo = $('problem-info');
const $problemName = $('problem-name');
const $problemTL = $('problem-tl');
const $problemML = $('problem-ml');
const $compilationBar = $('compilation-bar');
const $compilationIcon = $('compilation-icon');
const $compilationText = $('compilation-text');
const $ceErrorBox = $('ce-error-box');
const $ceErrorContent = $('ce-error-content');
const $btnSubmit = $('btn-submit');
const $btnRunAll = $('btn-run-all');
const $btnStop = $('btn-stop');
const $btnAdd = $('btn-add');


const $tcControls = $('tc-controls');
const $bottomBar = $('bottom-bar');
const $ojToggle = $('online-judge-toggle');

// ═══════════════════════════════════════════════
// Messages
// ═══════════════════════════════════════════════
window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
        case 'loadProblem':
            const oldLength = currentProblem && currentProblem.testCases ? currentProblem.testCases.length : 0;
            currentProblem = msg.problem;
            renderProblem();
            if (currentProblem && currentProblem.testCases && currentProblem.testCases.length > oldLength) {
                setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }, 50);
            }
            break;
        case 'updateTestCase':
            if (currentProblem) {
                const idx = currentProblem.testCases.findIndex(tc => tc.id === msg.testCase.id);
                if (idx !== -1) { currentProblem.testCases[idx] = msg.testCase; updateCard(msg.testCase); }
            }
            break;
        case 'compilationStart':
            hideComp();
            if ($ceErrorBox) $ceErrorBox.classList.add('hidden');
            break;
        case 'compilationDone':
            break;
        case 'compilationError':
            hideComp();
            setRunning(false);
            if ($ceErrorBox && $ceErrorContent) {
                $ceErrorContent.innerHTML = ansiToHtml(msg.errors || 'Unknown compilation error');
                $ceErrorBox.classList.remove('hidden');
            }
            break;
        case 'runStart':
            if (currentProblem) {
                const tc = currentProblem.testCases.find(t => t.id === msg.testCaseId);
                if (tc) { tc.verdict = 'RUNNING'; updateCard(tc); }
            }
            setRunning(true);
            break;
        case 'runComplete':
            if (currentProblem) {
                const idx = currentProblem.testCases.findIndex(t => t.id === msg.testCaseId);
                if (idx !== -1) { currentProblem.testCases[idx] = msg.testCase; updateCard(msg.testCase); }
            }
            break;
        case 'allRunsComplete':
            setRunning(false);
            break;
        case 'clear':
            if (currentProblem) currentProblem.testCases = [];
            renderProblem();
            break;
        case 'noProblem':
            currentProblem = null;
            renderEmpty();
            break;
    }
});

// ═══════════════════════════════════════════════
// Rendering
// ═══════════════════════════════════════════════
function renderProblem() {
    if (!currentProblem) { renderEmpty(); return; }
    $emptyState.classList.add('hidden');
    $problemInfo.classList.remove('hidden');
    $tcControls.classList.remove('hidden');
    if ($bottomBar) $bottomBar.classList.remove('hidden');
    $problemName.textContent = currentProblem.name;
    $problemTL.textContent = `${currentProblem.timeLimit}ms`;
    $problemML.textContent = `${currentProblem.memoryLimit || 256}MB`;
    $testCases.innerHTML = '';
    currentProblem.testCases.forEach(tc => $testCases.appendChild(buildCard(tc)));
}

function renderEmpty() {
    $emptyState.classList.remove('hidden');
    $problemInfo.classList.add('hidden');
    $tcControls.classList.add('hidden');
    if ($bottomBar) $bottomBar.classList.add('hidden');
    $testCases.innerHTML = '';
    hideComp();
    if ($ceErrorBox) $ceErrorBox.classList.add('hidden');
}

function updateCard(tc) {
    const el = document.querySelector(`[data-tc="${tc.id}"]`);
    if (!el) return;

    // Update verdict text
    const vt = el.querySelector('.verdict-text');
    if (vt) {
        vt.className = `verdict-text ${tc.verdict || ''}`;
        vt.textContent = verdictLabel(tc.verdict);
    }

    // Update border color
    const isCollapsed = el.classList.contains('collapsed');
    el.className = `tc-card${tc.verdict ? ' verdict-' + tc.verdict : ''}${isCollapsed ? ' collapsed' : ''}`;

    // Update time
    const tm = el.querySelector('.exec-time');
    if (tm) {
        tm.textContent = tc.executionTime != null ? tc.executionTime + 'ms' : '';
        tm.classList.toggle('hidden', tc.executionTime == null);
    }

    // Update received output
    updateReceived(el, tc);

    // Smart fold: collapse on run/AC, expand on failure
    if (tc.verdict === 'RUNNING' || tc.verdict === 'AC') {
        el.classList.add('collapsed');
    } else if (['WA', 'TLE', 'RTE', 'CE'].includes(tc.verdict)) {
        el.classList.remove('collapsed');
    }
}

function buildCard(tc) {
    const card = document.createElement('div');
    card.className = `tc-card${tc.verdict ? ' verdict-' + tc.verdict : ''}${tc.verdict === 'AC' ? ' collapsed' : ''}`;
    card.setAttribute('data-tc', tc.id);

    card.innerHTML = `
        <div class="tc-header" data-toggle="${tc.id}">
            <div class="tc-left">
                <div class="tc-row"><span class="tc-chevron">∨</span> <span class="tc-label">TC ${tc.id}</span></div>
                <div class="tc-row"><span class="verdict-text ${tc.verdict || ''}">${verdictLabel(tc.verdict)}</span> <span class="exec-time${tc.executionTime == null ? ' hidden' : ''}">${tc.executionTime != null ? tc.executionTime + 'ms' : ''}</span></div>
            </div>
            <div class="tc-right">
                <button class="tc-btn play" data-run="${tc.id}" title="Run">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="#fff"><path d="M4 2l10 6-10 6V2z"/></svg>
                </button>
                <button class="tc-btn del" data-del="${tc.id}" title="Delete">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="#fff"><path d="M5.5 1h5l.5.5V3h3.5v1H13l-.73 10.22-.27.78H4l-.27-.78L3 4H1.5V3H5V1.5l.5-.5zM6 3h4V2H6v1zM4.014 4l.7 10h6.572l.7-10H4.014z"/></svg>
                </button>
            </div>
        </div>
        <div class="tc-body">
            <div class="tc-section">
                <span class="tc-section-label">Input:</span>
                <span class="copy-btn" data-copy="inp-${tc.id}">Copy</span>
                <textarea class="code-block" id="inp-${tc.id}" rows="3" data-edit="${tc.id}" data-field="input"></textarea>
            </div>
            <div class="tc-section">
                <span class="tc-section-label">Expected Output:</span>
                <span class="copy-btn" data-copy="exp-${tc.id}">Copy</span>
                <textarea class="code-block" id="exp-${tc.id}" rows="3" data-edit="${tc.id}" data-field="expectedOutput"></textarea>
            </div>
            ${tc.receivedOutput != null ? `
            <div class="tc-section">
                <span class="tc-section-label">Received Output:</span>
                <span class="copy-btn" data-copy="rec-${tc.id}">Copy</span>
                <div class="code-block" id="rec-${tc.id}">${esc(tc.receivedOutput || '')}</div>
            </div>` : ''}
            ${tc.stderr ? `
            <div class="tc-section stderr-section">
                <span class="tc-section-label">Standard Error:</span>
                <div class="code-block">${esc(tc.stderr)}</div>
            </div>` : ''}
        </div>
    `;
    // Set textarea values via DOM API to avoid HTML escaping issues in content
    const inpEl = card.querySelector(`#inp-${tc.id}`);
    const expEl = card.querySelector(`#exp-${tc.id}`);
    if (inpEl) inpEl.value = tc.input || '';
    if (expEl) expEl.value = tc.expectedOutput || '';
    return card;
}

function updateReceived(el, tc) {
    const body = el.querySelector('.tc-body');
    if (!body) return;
    if (tc.receivedOutput != null) {
        let sec = el.querySelector(`#rec-${tc.id}`)?.closest('.tc-section');
        if (!sec) {
            sec = document.createElement('div');
            sec.className = 'tc-section';
            sec.innerHTML = `<span class="tc-section-label">Received Output:</span><span class="copy-btn" data-copy="rec-${tc.id}">Copy</span><div class="code-block" id="rec-${tc.id}"></div>`;
            const stderr = body.querySelector('.stderr-section');
            if (stderr) body.insertBefore(sec, stderr);
            else body.appendChild(sec);
        }
        const block = el.querySelector(`#rec-${tc.id}`);
        if (block) {
            block.innerHTML = esc(tc.receivedOutput || '');
        }
    }

    // Stderr
    let stderrEl = el.querySelector('.stderr-section');
    if (tc.stderr) {
        if (!stderrEl) {
            stderrEl = document.createElement('div');
            stderrEl.className = 'tc-section stderr-section';
            stderrEl.innerHTML = `<span class="tc-section-label">Standard Error:</span><div class="code-block"></div>`;
            body.appendChild(stderrEl);
        }
        stderrEl.querySelector('.code-block').innerHTML = ansiToHtml(tc.stderr);
    } else if (stderrEl) {
        stderrEl.remove();
    }
}

function ansiToHtml(text) {
    if (!text) return '';
    const colors = {
        30: '#000000', 31: '#cd3131', 32: '#0dbc79', 33: '#e5e510', 34: '#2472c8', 35: '#bc3fbc', 36: '#11a8cd', 37: '#e5e5e5',
        90: '#666666', 91: '#f14c4c', 92: '#23d18b', 93: '#f5f543', 94: '#3b8eea', 95: '#d670d6', 96: '#29b8db', 97: '#e5e5e5'
    };
    let html = '';
    let currentSpan = false;
    let lastIndex = 0;
    const regex = /\x1b\[([0-9;]*)[a-zA-Z]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        html += esc(text.substring(lastIndex, match.index));
        lastIndex = regex.lastIndex;
        const codes = match[1].split(';');
        for (const code of codes) {
            const num = parseInt(code, 10);
            if (num === 0 || isNaN(num) || num === 39) {
                if (currentSpan) { html += '</span>'; currentSpan = false; }
            } else if (colors[num]) {
                if (currentSpan) html += '</span>';
                html += `<span style="color: ${colors[num]}">`;
                currentSpan = true;
            }
        }
    }
    html += esc(text.substring(lastIndex));
    if (currentSpan) html += '</span>';

    // Also remove any remaining bare escape chars just in case
    return html.replace(/\x1b/g, '');
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════
function verdictLabel(v) {
    if (!v || v === 'PENDING') return '';
    const map = { RUNNING: 'Running', AC: 'Passed', WA: 'Failed', TLE: 'TLE', RTE: 'RTE', CE: 'CE' };
    return map[v] || v;
}

function hideComp() { $compilationBar.classList.add('hidden'); }

function setRunning(r) {
    $btnRunAll.classList.toggle('hidden', r);
    $btnStop.classList.toggle('hidden', !r);
}



function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════
// Events
// ═══════════════════════════════════════════════
document.addEventListener('click', (e) => {
    // Run
    const runBtn = e.target.closest('[data-run]');
    if (runBtn) {
        e.stopPropagation();
        const tcId = parseInt(runBtn.dataset.run);
        // Show Running immediately
        if (currentProblem) {
            const tc = currentProblem.testCases.find(t => t.id === tcId);
            if (tc) { tc.verdict = 'RUNNING'; tc.receivedOutput = undefined; tc.executionTime = undefined; updateCard(tc); }
        }
        setRunning(true);
        vscode.postMessage({ type: 'runSingle', testCaseId: tcId });
        return;
    }
    // Dismiss Compilation Error (Old Bar)
    const compBar = e.target.closest('#compilation-bar');
    if (compBar) {
        hideComp();
        return;
    }
    // Dismiss Compilation Error (Red Box)
    if (e.target.closest('#ce-close-btn')) {
        if ($ceErrorBox) $ceErrorBox.classList.add('hidden');
        return;
    }
    // Delete
    const delBtn = e.target.closest('[data-del]');
    if (delBtn) { e.stopPropagation(); vscode.postMessage({ type: 'deleteTestCase', testCaseId: parseInt(delBtn.dataset.del) }); return; }
    // Copy
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
        e.stopPropagation();
        const el = document.getElementById(copyBtn.dataset.copy);
        if (el) {
            navigator.clipboard.writeText(el.value || el.textContent || '').then(() => {
                copyBtn.textContent = 'Copied!';
                copyBtn.classList.add('copied');
                setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('copied'); }, 1200);
            });
        }
        return;
    }
    // Toggle
    const tog = e.target.closest('[data-toggle]');
    if (tog) {
        const card = document.querySelector(`[data-tc="${tog.dataset.toggle}"]`);
        if (card) card.classList.toggle('collapsed');
        return;
    }
});

$btnRunAll.addEventListener('click', () => {
    if (currentProblem) {
        currentProblem.testCases.forEach(tc => { tc.verdict = 'RUNNING'; tc.receivedOutput = undefined; tc.executionTime = undefined; updateCard(tc); });
    }
    setRunning(true);
    vscode.postMessage({ type: 'runAll', onlineJudge: onlineJudgeFlag });
});
$btnStop.addEventListener('click', () => vscode.postMessage({ type: 'stop' }));

$btnAdd.addEventListener('click', () => {
    vscode.postMessage({ type: 'addTestCase', input: '', expectedOutput: '' });
});

// ONLINE_JUDGE toggle
$ojToggle.addEventListener('change', () => {
    onlineJudgeFlag = $ojToggle.checked;
    $ojToggle.closest('.oj-toggle').classList.toggle('oj-enabled', onlineJudgeFlag);
});

if ($btnSubmit) {
    $btnSubmit.addEventListener('click', () => {
        vscode.postMessage({ type: 'submit' });
    });
}

// Problem name → open in browser
$problemName.addEventListener('click', () => {
    if (currentProblem && currentProblem.url) {
        vscode.postMessage({ type: 'openUrl', url: currentProblem.url });
    }
});

// Edit test case on blur
document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.edit) {
        const tcId = parseInt(t.dataset.edit);
        if (currentProblem) {
            const inp = document.querySelector(`[data-edit="${tcId}"][data-field="input"]`);
            const out = document.querySelector(`[data-edit="${tcId}"][data-field="expectedOutput"]`);
            vscode.postMessage({
                type: 'editTestCase',
                testCaseId: tcId,
                input: inp ? inp.value : '',
                expectedOutput: out ? out.value : '',
            });
        }
    }
});

vscode.postMessage({ type: 'ready' });
