/**
 * CP Arena — Webview Provider
 * Creates and manages the sidebar webview panel.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Problem, TestCase, WebToExtMessage } from './types';
import { compile } from './compiler';
import { runTestCase, stopAll } from './judge';
import {
    loadProblem,
    saveProblem,
    createEmptyProblem,
    addTestCase,
    deleteTestCase,
    editTestCase,
} from './problemManager';

export class CPArenaViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'cp-arena.panel';

    private _view?: vscode.WebviewView;
    private _currentProblem: Problem | null = null;
    private _isRunning = false;
    private _webviewReady = false;
    private _onlineJudge = false;
    private _stopRequested = false;
    private _viewDisposables: vscode.Disposable[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _extensionContext: vscode.ExtensionContext
    ) {}

    /** Called by VS Code when the view is first shown */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;
        this._webviewReady = false;

        // Dispose previous listeners to prevent stacking on re-resolve
        this._viewDisposables.forEach(d => d.dispose());
        this._viewDisposables = [];

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtml(webviewView.webview);

        // Handle messages from webview
        this._viewDisposables.push(
            webviewView.webview.onDidReceiveMessage(
                (msg: WebToExtMessage) => this._handleMessage(msg)
            )
        );

        // Load problem for current active editor
        this._updateView();

        // Listen for active editor changes
        this._viewDisposables.push(
            vscode.window.onDidChangeActiveTextEditor(
                () => this._updateView()
            )
        );

        this._viewDisposables.push(
            vscode.workspace.onDidCloseTextDocument(() => this._updateView())
        );
    }

    /** Load a problem into the webview (called by companion listener) */
    public loadProblem(problem: Problem): void {
        this._currentProblem = problem;
        if (this._webviewReady) {
            this._postMessage({ type: 'loadProblem', problem });
        }
        // If webview isn't ready yet, _currentProblem is stored and
        // will be sent when the webview sends 'ready'
    }

    /** Get the current problem */
    public getCurrentProblem(): Problem | null {
        return this._currentProblem;
    }

    public async submit(): Promise<void> {
        if (!this._currentProblem) {
            vscode.window.showWarningMessage('CP Arena: No problem loaded to submit.');
            return;
        }
        try {
            // Find the document in workspace instead of relying on activeTextEditor (which is undefined when webview is active)
            const doc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === this._currentProblem!.srcPath);
            let code = '';
            
            if (doc) {
                await doc.save();
                code = doc.getText();
            } else {
                code = require('fs').readFileSync(this._currentProblem.srcPath, 'utf8');
            }

            // Validation logic
            if (!code || code.trim() === '') {
                vscode.window.showErrorMessage('CP Arena: Cannot submit empty code.');
                return;
            }

            let submitUrl = this._currentProblem.url;

            if (!submitUrl) {
                const inputUrl = await vscode.window.showInputBox({
                    prompt: 'Enter the Codeforces problem URL to submit to',
                    placeHolder: 'e.g., https://codeforces.com/contest/1234/problem/A',
                    validateInput: text => {
                        return text && text.includes('codeforces.com') ? null : 'Please enter a valid Codeforces URL';
                    }
                });
                
                if (!inputUrl) {
                    return; // User cancelled
                }
                submitUrl = inputUrl;
                
                // Save the URL back to the problem
                this._currentProblem.url = submitUrl;
                const { saveProblem } = require('./problemManager');
                saveProblem(this._currentProblem);
            }

            await vscode.env.clipboard.writeText(code);

            // Convert problem URL to submit page URL for Codeforces
            let openUrl = submitUrl;
            if (submitUrl.includes('codeforces.com')) {
                const groupMatch = submitUrl.match(/\/group\/[a-zA-Z0-9_-]+\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/);
                const contestMatch = submitUrl.match(/^https?:\/\/(www\.)?codeforces\.com\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/);
                const gymMatch = submitUrl.match(/^https?:\/\/(www\.)?codeforces\.com\/gym\/(\d+)\/problem\/([A-Za-z0-9]+)/);
                const problemsetMatch = submitUrl.match(/\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/);

                if (groupMatch) {
                    openUrl = submitUrl.replace(/\/problem\/[A-Za-z0-9]+$/, '/submit');
                } else if (contestMatch) {
                    openUrl = `https://codeforces.com/contest/${contestMatch[2]}/submit/${contestMatch[3]}`;
                } else if (gymMatch) {
                    openUrl = `https://codeforces.com/gym/${gymMatch[2]}/submit/${gymMatch[3]}`;
                } else if (problemsetMatch) {
                    openUrl = `https://codeforces.com/problemset/submit/${problemsetMatch[1]}/${problemsetMatch[2]}`;
                }
            }
            await vscode.env.openExternal(vscode.Uri.parse(openUrl));
            vscode.window.showInformationMessage('CP Arena: Code copied to clipboard. Paste it on the submit page.');
        } catch (err) {
            vscode.window.showErrorMessage('Failed to read source file for submission.');
        }
    }

    /** Run all test cases */
    public async runAll(): Promise<void> {
        if (!this._currentProblem || this._isRunning) {
            return;
        }
        await this._runTestCases(this._currentProblem.testCases);
    }

    /** Stop execution */
    public stop(): void {
        this._stopRequested = true;
        stopAll();
        this._isRunning = false;
        // Reset any RUNNING test cases back to PENDING
        if (this._currentProblem) {
            for (const tc of this._currentProblem.testCases) {
                if (tc.verdict === 'RUNNING') {
                    tc.verdict = 'PENDING';
                    tc.receivedOutput = undefined;
                    tc.executionTime = undefined;
                }
            }
            this._postMessage({ type: 'loadProblem', problem: this._currentProblem });
        }
        this._postMessage({ type: 'allRunsComplete' });
    }

    /** Add a new empty test case */
    public addTestCase(): void {
        if (!this._currentProblem) {
            return;
        }
        const tc = addTestCase(this._currentProblem, '', '');
        this._postMessage({ type: 'loadProblem', problem: this._currentProblem });
    }

    /** Clear all test cases */
    public clearAll(): void {
        if (!this._currentProblem) {
            return;
        }
        this._currentProblem.testCases = [];
        saveProblem(this._currentProblem);
        this._postMessage({ type: 'clear' });
    }

    // ──────────────────────────────────────────
    // Private methods
    // ──────────────────────────────────────────

    private _updateView(): void {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            // Check if there are any visible text editors left
            if (vscode.window.visibleTextEditors.length === 0) {
                this._currentProblem = null;
                this._postMessage({ type: 'noProblem' });
            }
            return;
        }

        if (editor.document.isClosed) {
            return;
        }

        const filePath = editor.document.uri.fsPath;
        const supportedExtensions = ['.cpp', '.c', '.py', '.java', '.rs', '.go'];
        const ext = path.extname(filePath).toLowerCase();

        if (!supportedExtensions.includes(ext)) {
            // It's a non-supported file.
            // Check if the previously loaded problem's file is STILL OPEN.
            // If it's closed, clear the view.
            if (this._currentProblem) {
                const isStillOpen = vscode.workspace.textDocuments.some(
                    d => d.uri.fsPath === this._currentProblem!.srcPath && !d.isClosed
                );
                if (!isStillOpen) {
                    this._currentProblem = null;
                    this._postMessage({ type: 'noProblem' });
                }
            }
            return;
        }

        let problem = loadProblem(filePath);
        if (problem) {
            this._currentProblem = problem;
            this._postMessage({ type: 'loadProblem', problem });
        } else {
            // No .prob found. Don't clobber an already-loaded problem for this
            // same file (e.g. one parsed by Competitive Companion and held in
            // memory) with an empty fallback — that's what caused test cases to
            // sometimes vanish on an editor switch.
            if (
                this._currentProblem &&
                this._currentProblem.srcPath === filePath &&
                this._currentProblem.testCases.length > 0
            ) {
                this._postMessage({ type: 'loadProblem', problem: this._currentProblem });
                return;
            }

            // Provide an in-memory problem for local files so user can add TCs/run
            const baseName = path.basename(filePath, ext);
            const langMap: Record<string, string> = {
                '.cpp': 'cpp', '.c': 'c', '.py': 'python', 
                '.java': 'java', '.rs': 'rust', '.go': 'go'
            };
            this._currentProblem = {
                name: baseName,
                group: 'Local',
                url: '',
                timeLimit: 3000,
                memoryLimit: 256,
                testCases: [],
                srcPath: filePath,
                language: (langMap[ext] || 'cpp') as any
            };
            this._postMessage({ type: 'loadProblem', problem: this._currentProblem });
        }
    }

    private async _handleMessage(msg: WebToExtMessage): Promise<void> {
        switch (msg.type) {
            case 'ready':
                this._webviewReady = true;

                // If companion already loaded a problem, send it now
                if (this._currentProblem) {
                    this._postMessage({ type: 'loadProblem', problem: this._currentProblem });
                } else {
                    this._updateView();
                }
                break;

            case 'runAll':
                this._onlineJudge = msg.onlineJudge || false;
                await this.runAll();
                break;

            case 'runSingle':
                if (this._currentProblem) {
                    const tc = this._currentProblem.testCases.find(
                        (t) => t.id === msg.testCaseId
                    );
                    if (tc) {
                        await this._runTestCases([tc]);
                    }
                }
                break;

            case 'stop':
                this.stop();
                break;

            case 'addTestCase':
                if (this._currentProblem) {
                    addTestCase(this._currentProblem, msg.input, msg.expectedOutput);
                    this._postMessage({
                        type: 'loadProblem',
                        problem: this._currentProblem,
                    });
                }
                break;

            case 'deleteTestCase':
                if (this._currentProblem) {
                    deleteTestCase(this._currentProblem, msg.testCaseId);
                    this._postMessage({
                        type: 'loadProblem',
                        problem: this._currentProblem,
                    });
                }
                break;

            case 'editTestCase':
                if (this._currentProblem) {
                    editTestCase(
                        this._currentProblem,
                        msg.testCaseId,
                        msg.input,
                        msg.expectedOutput
                    );
                }
                break;

            case 'openUrl':
                if (msg.url) {
                    vscode.env.openExternal(vscode.Uri.parse(msg.url));
                }
                break;

            case 'clearAll':
                this.clearAll();
                break;
            
            case 'submit':
                this.submit();
                break;
        }
    }

    private async _runTestCases(testCases: TestCase[]): Promise<void> {
        if (!this._currentProblem) {
            return;
        }

        this._isRunning = true;
        this._stopRequested = false;
        const problem = this._currentProblem;

        // First, save the active document if it's open
        const doc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === problem.srcPath);
        if (doc) {
            await doc.save();
        }

        // Mark all test cases as pending
        for (const tc of testCases) {
            tc.verdict = 'RUNNING';
            tc.receivedOutput = undefined;
            tc.executionTime = undefined;
            tc.signal = undefined;
            tc.stderr = undefined;
        }

        // Compile first (for compiled languages)
        this._postMessage({ type: 'compilationStart' });

        const compResult = await compile(problem.srcPath, problem.language, this._onlineJudge || false);

        if (!compResult.success) {
            this._postMessage({
                type: 'compilationError',
                errors: compResult.errors || 'Unknown compilation error',
            });
            // Mark all test cases as CE
            for (const tc of testCases) {
                tc.verdict = 'CE';
                this._postMessage({ type: 'updateTestCase', testCase: tc });
            }
            this._isRunning = false;
            return;
        }

        this._postMessage({ type: 'compilationDone', duration: compResult.duration || 0 });

        // Run each test case
        for (const tc of testCases) {
            if (this._stopRequested) {
                break;
            }

            this._postMessage({ type: 'runStart', testCaseId: tc.id });

            const result = await runTestCase(
                compResult.executablePath!,
                problem.language,
                tc,
                problem.timeLimit
            );

            // Stop was requested during execution — discard result
            if (this._stopRequested) {
                break;
            }

            // Update the test case in the problem
            const idx = problem.testCases.findIndex((t) => t.id === tc.id);
            if (idx !== -1) {
                problem.testCases[idx] = result;
            }

            this._postMessage({ type: 'runComplete', testCaseId: tc.id, testCase: result });
        }

        this._isRunning = false;

        // Only save and notify if run completed naturally (not stopped)
        if (!this._stopRequested) {
            saveProblem(problem);
            this._postMessage({ type: 'allRunsComplete' });
        }
    }

    private _postMessage(msg: any): void {
        this._view?.webview.postMessage(msg);
    }

    private _getHtml(webview: vscode.Webview): string {
        const htmlPath = path.join(this._extensionUri.fsPath, 'webview', 'index.html');
        const cssPath = path.join(this._extensionUri.fsPath, 'webview', 'style.css');
        const jsPath = path.join(this._extensionUri.fsPath, 'webview', 'main.js');

        let html = fs.readFileSync(htmlPath, 'utf-8');

        // Get webview URIs
        const t = Date.now();
        const cssUri = webview.asWebviewUri(
            vscode.Uri.file(cssPath)
        ).with({ query: `t=${t}` });
        const jsUri = webview.asWebviewUri(
            vscode.Uri.file(jsPath)
        ).with({ query: `t=${t}` });

        // Replace placeholders (cspSource appears multiple times, need replaceAll)
        html = html.replace('{{cssUri}}', cssUri.toString());
        html = html.replace('{{jsUri}}', jsUri.toString());
        html = html.split('{{cspSource}}').join(webview.cspSource);

        return html;
    }
}
