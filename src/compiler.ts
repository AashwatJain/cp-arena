/**
 * CP Arena — Compiler Service
 * Handles compilation of source files into executables.
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { CompilationResult, SupportedLanguage } from './types';
import { getCompileCommand, needsCompilation } from './config';

/**
 * Compile a source file and return the result.
 * For interpreted languages, returns success immediately.
 */
export async function compile(
    srcPath: string,
    language: SupportedLanguage,
    onlineJudge: boolean = false
): Promise<CompilationResult> {
    if (!needsCompilation(language)) {
        return { success: true, executablePath: srcPath };
    }

    const dir = path.dirname(srcPath);
    const baseName = path.basename(srcPath, path.extname(srcPath));
    const compileCmd = getCompileCommand(language);

    let args: string[];
    let executablePath: string;

    switch (language) {
        case 'cpp':
        case 'c': {
            executablePath = path.join(dir, baseName);
            const parts = compileCmd.split(' ');
            const compiler = parts[0];
            const flags = parts.slice(1);
            args = [...flags, srcPath, '-o', executablePath];
            if (onlineJudge) args.splice(flags.length, 0, '-DONLINE_JUDGE');
            return runCompiler(compiler, args, dir, executablePath);
        }
        case 'java': {
            executablePath = path.join(dir, baseName);
            const parts = compileCmd.split(' ');
            const compiler = parts[0];
            args = [srcPath];
            return runCompiler(compiler, args, dir, executablePath);
        }
        case 'rust': {
            executablePath = path.join(dir, baseName);
            const parts = compileCmd.split(' ');
            const compiler = parts[0];
            const flags = parts.slice(1);
            args = [...flags, srcPath, '-o', executablePath];
            return runCompiler(compiler, args, dir, executablePath);
        }
        default:
            return { success: true, executablePath: srcPath };
    }
}

function runCompiler(
    compiler: string,
    args: string[],
    cwd: string,
    executablePath: string
): Promise<CompilationResult> {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const proc = spawn(compiler, args, { cwd });

        let stderr = '';
        proc.stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
        });

        let stdout = '';
        proc.stdout.on('data', (data: Buffer) => {
            stdout += data.toString();
        });

        proc.on('close', (code) => {
            const duration = Date.now() - startTime;
            if (code === 0) {
                resolve({
                    success: true,
                    executablePath,
                    duration,
                });
            } else {
                resolve({
                    success: false,
                    errors: stderr || stdout || `Compilation failed with exit code ${code}`,
                    duration,
                });
            }
        });

        proc.on('error', (err) => {
            resolve({
                success: false,
                errors: `Failed to start compiler: ${err.message}.\nMake sure "${compiler}" is installed and in your PATH.`,
            });
        });
    });
}
