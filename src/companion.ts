/**
 * CP Arena — Competitive Companion Listener
 * HTTP server that receives parsed problems from the Competitive Companion browser extension.
 */

import * as http from 'http';
import * as vscode from 'vscode';
import { CompanionProblem, Problem, TestCase } from './types';
import { getCompanionPort, getDefaultLanguage, getFileExtension, getSavePath } from './config';
import { saveProblem } from './problemManager';
import * as path from 'path';
import * as fs from 'fs';

let server: http.Server | null = null;

/** Callback when a new problem is received */
type OnProblemReceived = (problem: Problem, srcPath: string) => void;

/**
 * Start the Competitive Companion listener on the configured port.
 */
export function startCompanionListener(onProblem: OnProblemReceived): void {
    if (server) {
        return; // Already running
    }

    const port = getCompanionPort();

    server = http.createServer((req, res) => {
        // Handle CORS for the browser extension
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: Buffer) => {
                body += chunk.toString();
            });
            req.on('end', () => {
                let data: CompanionProblem;
                try {
                    data = JSON.parse(body) as CompanionProblem;
                } catch (err) {
                    console.error('[CP Arena] Failed to parse companion data:', err);
                    res.writeHead(400);
                    res.end('Invalid JSON');
                    return;
                }
                // handleProblem is async; catch rejections so a malformed
                // payload can never bubble up as an unhandled rejection and
                // crash the extension host.
                handleProblem(data, onProblem).catch((err) => {
                    console.error('[CP Arena] Failed to handle problem:', err);
                    vscode.window.showErrorMessage(
                        `CP Arena: Failed to import problem: ${err?.message || err}`
                    );
                });
                res.writeHead(200);
                res.end('OK');
            });
        } else {
            res.writeHead(200);
            res.end('CP Arena Companion Listener');
        }
    });

    server.listen(port, '127.0.0.1', () => {
        console.log(`[CP Arena] Companion listener started on port ${port}`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
            vscode.window.showWarningMessage(
                `CP Arena: Port ${port} is already in use. Change it in settings or close the conflicting process.`
            );
        } else {
            vscode.window.showErrorMessage(`CP Arena: Companion listener error: ${err.message}`);
        }
    });
}

/**
 * Stop the Competitive Companion listener.
 */
export function stopCompanionListener(): void {
    if (server) {
        server.close();
        server = null;
        console.log('[CP Arena] Companion listener stopped');
    }
}

/**
 * Process a received problem from Competitive Companion.
 */
async function handleProblem(
    data: CompanionProblem,
    onProblem: OnProblemReceived
): Promise<void> {
    const language = getDefaultLanguage();
    const ext = getFileExtension(language);

    // Sanitize problem name for filename
    let safeName = data.name
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .replace(/\s+/g, '_');
        
    // Match CPH filename format: insert underscore between problem letter and number (e.g. E1_ -> E_1_)
    safeName = safeName.replace(/^([A-Z])(\d)_/, '$1_$2_');
    safeName = safeName.substring(0, 100);

    // Determine save directory
    let saveDir = getSavePath();
    if (!saveDir) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            saveDir = workspaceFolder.uri.fsPath;
        } else {
            // Fallback: ask user to pick a folder
            const picked = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                openLabel: 'Select Save Directory',
            });
            if (picked && picked[0]) {
                saveDir = picked[0].fsPath;
            } else {
                vscode.window.showWarningMessage('CP Arena: No save directory selected.');
                return;
            }
        }
    }

    // Create source file
    const srcPath = path.join(saveDir, `${safeName}${ext}`);
    if (!fs.existsSync(srcPath)) {
        const template = getTemplate(language);
        fs.writeFileSync(srcPath, template, 'utf-8');
    }

    // Build test cases
    const testCases: TestCase[] = (data.tests || []).map((t, i) => ({
        id: i + 1,
        input: t.input,
        expectedOutput: t.output,
        verdict: 'PENDING' as const,
    }));

    // Build problem object
    const problem: Problem = {
        name: data.name,
        group: data.group,
        url: data.url,
        timeLimit: data.timeLimit,
        memoryLimit: data.memoryLimit,
        testCases,
        srcPath,
        language,
    };

    // Save problem data
    saveProblem(problem);

    // Open the file in editor
    const doc = await vscode.workspace.openTextDocument(srcPath);
    await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.One });

    // Notify the webview
    onProblem(problem, srcPath);


}

/**
 * Get a basic template for the given language.
 */
function getTemplate(language: string): string {
    switch (language) {
        case 'cpp':
            return ``;
        case 'c':
            return ``;
        case 'python':
            return ``;
        case 'java':
            return ``;
        default:
            return '';
    }
}
