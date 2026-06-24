/**
 * CP Arena — Extension Entry Point
 * Registers commands, starts the companion listener, and sets up the webview.
 */

import * as vscode from 'vscode';
import { CPArenaViewProvider } from './webviewProvider';
import { startCompanionListener, stopCompanionListener } from './companion';

let viewProvider: CPArenaViewProvider;

export function activate(context: vscode.ExtensionContext): void {
    console.log('[CP Arena] Extension activated');

    // Create and register the webview provider
    viewProvider = new CPArenaViewProvider(context.extensionUri, context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            CPArenaViewProvider.viewType,
            viewProvider,
            {
                webviewOptions: { retainContextWhenHidden: true },
            }
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('cp-arena.runAll', () => {
            viewProvider.runAll();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cp-arena.addTestCase', () => {
            viewProvider.addTestCase();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cp-arena.stop', () => {
            viewProvider.stop();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cp-arena.clearAll', () => {
            viewProvider.clearAll();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cp-arena.submit', () => {
            viewProvider.submit();
        })
    );

    // Start Competitive Companion listener
    startCompanionListener(async (problem, _srcPath) => {
        // Focus the CP Arena sidebar first (creates webview if needed)
        await vscode.commands.executeCommand('cp-arena.panel.focus');
        // Small delay to let webview initialize
        await new Promise(resolve => setTimeout(resolve, 200));
        // Now load the problem
        viewProvider.loadProblem(problem);
    });

    // Status bar
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    statusBarItem.text = '$(play) Run Tests';
    statusBarItem.tooltip = 'CP Arena: Run All Test Cases';
    statusBarItem.command = 'cp-arena.runAll';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Auto-focus sidebar when switching to a .cpp file
    const supportedExtensions = ['.cpp'];
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                const ext = editor.document.uri.fsPath.split('.').pop()?.toLowerCase();
                if (ext && supportedExtensions.includes('.' + ext)) {
                    vscode.commands.executeCommand('cp-arena.panel.focus');
                }
            }
        })
    );
}

export function deactivate(): void {
    stopCompanionListener();
    console.log('[CP Arena] Extension deactivated');
}
