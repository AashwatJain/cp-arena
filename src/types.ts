/**
 * CP Arena — Shared Type Definitions
 */

export type Verdict = 'AC' | 'WA' | 'TLE' | 'RTE' | 'CE' | 'RUNNING' | 'PENDING';

export interface TestCase {
    id: number;
    input: string;
    expectedOutput: string;
    receivedOutput?: string;
    verdict?: Verdict;
    executionTime?: number;  // ms
    signal?: string;         // SIGSEGV, SIGABRT, etc.
    stderr?: string;
}

export interface Problem {
    name: string;
    group: string;           // e.g., "Codeforces - Round 900"
    url: string;
    timeLimit: number;       // ms
    memoryLimit: number;     // MB
    testCases: TestCase[];
    srcPath: string;         // associated source file
    language: SupportedLanguage;
}

export type SupportedLanguage = 'cpp' | 'c' | 'python' | 'java' | 'javascript' | 'rust' | 'go';

export interface CompilationResult {
    success: boolean;
    executablePath?: string;
    errors?: string;
    duration?: number;  // ms
}

export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    signal: string | null;
    duration: number;  // ms
    timedOut: boolean;
}

/** Competitive Companion payload format */
export interface CompanionProblem {
    name: string;
    group: string;
    url: string;
    interactive: boolean;
    memoryLimit: number;
    timeLimit: number;
    tests: { input: string; output: string }[];
    languages?: { java?: { mainClass?: string; taskClass?: string } };
    batch?: { id: string; size: number };
}

/** Messages from extension → webview */
export type ExtToWebMessage =
    | { type: 'loadProblem'; problem: Problem }
    | { type: 'updateTestCase'; testCase: TestCase }
    | { type: 'compilationError'; errors: string }
    | { type: 'compilationStart' }
    | { type: 'compilationDone'; duration: number }
    | { type: 'runStart'; testCaseId: number }
    | { type: 'runComplete'; testCaseId: number; testCase: TestCase }
    | { type: 'allRunsComplete' }
    | { type: 'clear' }
    | { type: 'noProblem' };

/** Messages from webview → extension */
export type WebToExtMessage =
    | { type: 'runAll'; onlineJudge?: boolean }
    | { type: 'runSingle'; testCaseId: number }
    | { type: 'stop' }
    | { type: 'addTestCase'; input: string; expectedOutput: string }
    | { type: 'deleteTestCase'; testCaseId: number }
    | { type: 'editTestCase'; testCaseId: number; input: string; expectedOutput: string }
    | { type: 'clearAll' }
    | { type: 'ready' }
    | { type: 'openUrl'; url: string }
    | { type: 'submit' };
