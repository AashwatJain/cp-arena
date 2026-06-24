/**
 * CP Arena — Configuration Reader
 * Reads settings from VS Code workspace configuration.
 */

import * as vscode from 'vscode';
import { SupportedLanguage } from './types';

function cfg() {
    return vscode.workspace.getConfiguration('cp-arena');
}

export function getDefaultLanguage(): SupportedLanguage {
    return cfg().get<SupportedLanguage>('general.defaultLanguage', 'cpp');
}

export function getTimeLimit(): number {
    return cfg().get<number>('general.timeLimit', 3000);
}

export function getCompanionPort(): number {
    return cfg().get<number>('general.companionPort', 10043);
}

export function getSavePath(): string {
    return cfg().get<string>('general.savePath', '');
}

export function getCompileCommand(lang: SupportedLanguage): string {
    switch (lang) {
        case 'cpp':
            return cfg().get<string>('cpp.compileCommand', 'g++ -std=c++17 -O2 -Wall');
        case 'c':
            return cfg().get<string>('c.compileCommand', 'gcc -std=c17 -O2 -Wall');
        case 'java':
            return cfg().get<string>('java.compileCommand', 'javac');
        case 'rust':
            return cfg().get<string>('rust.compileCommand', 'rustc -O');
        default:
            return '';
    }
}

export function getRunCommand(lang: SupportedLanguage): string {
    switch (lang) {
        case 'python':
            return cfg().get<string>('python.runCommand', 'python3');
        case 'java':
            return cfg().get<string>('java.runCommand', 'java');
        case 'javascript':
            return 'node';
        case 'go':
            return 'go run';
        default:
            return '';
    }
}

export function getFileExtension(lang: SupportedLanguage): string {
    const map: Record<SupportedLanguage, string> = {
        cpp: '.cpp',
        c: '.c',
        python: '.py',
        java: '.java',
        javascript: '.js',
        rust: '.rs',
        go: '.go',
    };
    return map[lang] || '.cpp';
}

export function detectLanguage(filePath: string): SupportedLanguage {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, SupportedLanguage> = {
        cpp: 'cpp', cc: 'cpp', cxx: 'cpp',
        c: 'c',
        py: 'python',
        java: 'java',
        js: 'javascript',
        rs: 'rust',
        go: 'go',
    };
    return map[ext] || 'cpp';
}

/** Whether this language needs a separate compile step */
export function needsCompilation(lang: SupportedLanguage): boolean {
    return ['cpp', 'c', 'java', 'rust'].includes(lang);
}
