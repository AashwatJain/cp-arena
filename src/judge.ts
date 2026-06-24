/**
 * CP Arena — Judge Service
 * Runs executables against test cases, enforces time limits,
 * detects runtime errors, and compares outputs.
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { ExecutionResult, SupportedLanguage, TestCase, Verdict } from './types';
import { getRunCommand } from './config';

/** Active child processes — used for killing on stop */
const activeProcesses: Set<ChildProcess> = new Set();

/**
 * Maximum amount of stdout/stderr we buffer per run (in bytes).
 * A solution stuck in an infinite loop that keeps printing would otherwise
 * grow this buffer without bound, blowing up the extension host's memory and
 * freezing/crashing it. Once exceeded we kill the process immediately.
 */
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024; // 16 MB

/**
 * Forcefully kill a child process (and its process group, when possible).
 * Killing the group handles wrapper commands like `go run` / `java` that
 * spawn their own children which would otherwise survive a plain kill.
 */
function killProcess(proc: ChildProcess): void {
    try {
        if (typeof proc.pid === 'number') {
            try {
                // Negative pid => kill the entire process group (detached child)
                process.kill(-proc.pid, 'SIGKILL');
                return;
            } catch {
                // Fall back to killing just the child
            }
        }
        proc.kill('SIGKILL');
    } catch {
        // Process may have already exited
    }
}

/**
 * Execute a solution against a single test case.
 */
export async function runTestCase(
    executablePath: string,
    language: SupportedLanguage,
    testCase: TestCase,
    timeLimit: number
): Promise<TestCase> {
    const result = await execute(executablePath, language, testCase.input, timeLimit);

    const updatedTC: TestCase = {
        ...testCase,
        receivedOutput: result.stdout.trimEnd(),
        stderr: result.stderr,
        executionTime: result.duration,
    };

    if (result.timedOut) {
        updatedTC.verdict = 'TLE';
    } else if (result.signal) {
        updatedTC.verdict = 'RTE';
        updatedTC.signal = result.signal;
    } else if (result.exitCode !== 0) {
        updatedTC.verdict = 'RTE';
        updatedTC.signal = `Exit code: ${result.exitCode}`;
    } else {
        updatedTC.verdict = compareOutput(
            updatedTC.receivedOutput || '',
            testCase.expectedOutput.trimEnd()
        );
    }

    return updatedTC;
}

/**
 * Kill all currently running test case processes.
 */
export function stopAll(): void {
    for (const proc of activeProcesses) {
        killProcess(proc);
    }
    activeProcesses.clear();
}

/**
 * Execute a binary/script with given input and time limit.
 */
function execute(
    executablePath: string,
    language: SupportedLanguage,
    input: string,
    timeLimit: number
): Promise<ExecutionResult> {
    return new Promise((resolve) => {
        let cmd: string;
        let args: string[];
        const cwd = path.dirname(executablePath);

        switch (language) {
            case 'python': {
                const runCmd = getRunCommand(language);
                cmd = runCmd;
                args = [executablePath];
                break;
            }
            case 'java': {
                const className = path.basename(executablePath, path.extname(executablePath));
                cmd = getRunCommand(language);
                args = ['-cp', cwd, className];
                break;
            }
            case 'javascript': {
                cmd = 'node';
                args = [executablePath];
                break;
            }
            case 'go': {
                cmd = 'go';
                args = ['run', executablePath];
                break;
            }
            default: {
                // Compiled languages (cpp, c, rust) — run the binary directly
                cmd = executablePath;
                args = [];
                break;
            }
        }

        const startTime = Date.now();
        const proc = spawn(cmd, args, {
            cwd,
            stdio: ['pipe', 'pipe', 'pipe'],
            // Run in its own process group so we can reliably kill any
            // children spawned by wrappers like `go run` / `java`.
            detached: true,
        });
        activeProcesses.add(proc);

        let stdout = '';
        let stderr = '';
        let outputBytes = 0;
        let outputLimitExceeded = false;
        let timedOut = false;
        let finished = false;

        const timer = setTimeout(() => {
            timedOut = true;
            killProcess(proc);
        }, timeLimit);

        proc.stdout.on('data', (data: Buffer) => {
            if (outputLimitExceeded) { return; }
            outputBytes += data.length;
            if (outputBytes > MAX_OUTPUT_BYTES) {
                // Likely an infinite loop spamming output — stop buffering and
                // kill the process before it exhausts memory.
                outputLimitExceeded = true;
                stdout += data.toString().slice(0, Math.max(0, MAX_OUTPUT_BYTES - (outputBytes - data.length)));
                killProcess(proc);
                return;
            }
            stdout += data.toString();
        });

        proc.stderr.on('data', (data: Buffer) => {
            if (outputLimitExceeded) { return; }
            outputBytes += data.length;
            if (outputBytes > MAX_OUTPUT_BYTES) {
                outputLimitExceeded = true;
                killProcess(proc);
                return;
            }
            stderr += data.toString();
        });

        // Swallow stream errors (e.g., EPIPE) so they don't bubble up as
        // unhandled 'error' events and crash the extension host.
        proc.stdout.on('error', () => { /* ignore */ });
        proc.stderr.on('error', () => { /* ignore */ });
        proc.stdin.on('error', () => { /* ignore */ });

        const finish = (exitCode: number | null, signal: string | null) => {
            if (finished) { return; }
            finished = true;
            clearTimeout(timer);
            activeProcesses.delete(proc);

            // An output-limit kill is treated like a time-limit exceeded:
            // the program ran away producing unbounded output.
            const treatAsTimeout = timedOut || outputLimitExceeded;

            resolve({
                stdout,
                stderr,
                exitCode,
                signal: treatAsTimeout ? null : (signal === 'SIGKILL' ? null : signal),
                duration: Date.now() - startTime,
                timedOut: treatAsTimeout,
            });
        };

        proc.on('close', (code, signal) => {
            finish(code, signal);
        });

        proc.on('error', (err) => {
            finish(1, err.message);
        });

        // Write input to stdin. Wrap in try/catch for the synchronous throw,
        // and rely on the 'error' handler above for asynchronous EPIPE errors
        // that occur when the process exits before input is fully consumed.
        try {
            proc.stdin.write(input);
            proc.stdin.end();
        } catch {
            // Process may have already exited
        }
    });
}

/**
 * Compare expected and received output.
 * Uses token-based comparison (ignores whitespace differences) and
 * applies case-insensitive matching specifically for YES/NO.
 */
function compareOutput(received: string, expected: string): Verdict {
    const getTokens = (s: string) => s.trim().split(/\s+/).filter(t => t.length > 0);
    const recTokens = getTokens(received);
    const expTokens = getTokens(expected);

    if (recTokens.length !== expTokens.length) {
        return 'WA';
    }

    const isYesNo = (t: string) => {
        const lower = t.toLowerCase();
        return lower === 'yes' || lower === 'no';
    };

    for (let i = 0; i < expTokens.length; i++) {
        const exp = expTokens[i];
        const rec = recTokens[i];

        if (exp === rec) {
            continue;
        }

        // Case-insensitive match for YES / NO
        if (isYesNo(exp) && isYesNo(rec) && exp.toLowerCase() === rec.toLowerCase()) {
            continue;
        }

        return 'WA';
    }

    return 'AC';
}
