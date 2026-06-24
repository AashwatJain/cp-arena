/**
 * CP Arena — Problem Manager
 * Handles loading and saving problem data as JSON files alongside source files.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Problem, TestCase } from './types';
import { detectLanguage, getTimeLimit } from './config';

const CP_ARENA_DIR = '.cp-arena';
const CPH_DIR = '.cph';

/**
 * Get the problem file path for a given source file (read-only, no directory creation).
 * e.g., /path/to/A.cpp → /path/to/.cp-arena/A.prob
 */
function getProblemPath(srcPath: string): string {
    const dir = path.dirname(srcPath);
    const baseName = path.basename(srcPath, path.extname(srcPath));
    const arenaDir = path.join(dir, CP_ARENA_DIR);
    return path.join(arenaDir, `${baseName}.prob`);
}

/**
 * Ensure the .cp-arena directory exists for writing.
 */
function ensureArenaDir(srcPath: string): void {
    const dir = path.dirname(srcPath);
    const arenaDir = path.join(dir, CP_ARENA_DIR);
    if (!fs.existsSync(arenaDir)) {
        fs.mkdirSync(arenaDir, { recursive: true });
    }
}

/**
 * Save a problem to disk.
 */
export function saveProblem(problem: Problem): void {
    ensureArenaDir(problem.srcPath);
    const probPath = getProblemPath(problem.srcPath);
    fs.writeFileSync(probPath, JSON.stringify(problem, null, 2), 'utf-8');
}

/**
 * Normalize a name for loose comparison (case- and separator-insensitive).
 * "D. Vasiliy's Multiset" and "D_Vasiliy_s_Multiset" both collapse to the
 * same key, so a renamed/sanitized file still finds its problem data.
 */
function normalizeName(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Look for a `.prob` in the `.cp-arena` folder whose name loosely matches the
 * source file's base name (ignoring case and separators like _ - . spaces).
 */
function findArenaProbFlexible(srcPath: string): string | null {
    const arenaDir = path.join(path.dirname(srcPath), CP_ARENA_DIR);
    if (!fs.existsSync(arenaDir)) {
        return null;
    }
    const target = normalizeName(path.basename(srcPath, path.extname(srcPath)));
    try {
        for (const f of fs.readdirSync(arenaDir)) {
            if (!f.endsWith('.prob')) {
                continue;
            }
            const namePart = f.slice(0, -'.prob'.length);
            if (normalizeName(namePart) === target) {
                return path.join(arenaDir, f);
            }
        }
    } catch {
        // ignore
    }
    return null;
}

/**
 * Convert a legacy CPH problem object into a CP Arena Problem.
 * CPH stores expected output under `output` (not `expectedOutput`).
 */
function convertCphProblem(raw: any, srcPath: string): Problem {
    const tests = Array.isArray(raw.tests) ? raw.tests : [];
    return {
        name: raw.name || path.basename(srcPath, path.extname(srcPath)),
        group: raw.group || '',
        url: raw.url || '',
        timeLimit: typeof raw.timeLimit === 'number' ? raw.timeLimit : getTimeLimit(),
        memoryLimit: typeof raw.memoryLimit === 'number' ? raw.memoryLimit : 256,
        testCases: tests.map((t: any, i: number): TestCase => ({
            id: i + 1,
            input: t.input ?? '',
            expectedOutput: t.output ?? t.expectedOutput ?? '',
            verdict: 'PENDING',
        })),
        srcPath,
        language: detectLanguage(srcPath),
    };
}

/**
 * Try to load a problem saved by the legacy CPH extension, stored in a `.cph`
 * folder as `.<filename>_<md5(srcPath)>.prob`.
 */
function loadCphProblem(srcPath: string): Problem | null {
    const cphDir = path.join(path.dirname(srcPath), CPH_DIR);
    if (!fs.existsSync(cphDir)) {
        return null;
    }

    const fileName = path.basename(srcPath);
    const hash = crypto.createHash('md5').update(srcPath).digest('hex');
    const exactPath = path.join(cphDir, `.${fileName}_${hash}.prob`);

    let probFile: string | null = null;
    if (fs.existsSync(exactPath)) {
        probFile = exactPath;
    } else {
        // Hash is based on the absolute path; if the file was moved the hash
        // won't match, so fall back to matching by the filename prefix.
        try {
            const prefix = `.${fileName}_`;
            for (const f of fs.readdirSync(cphDir)) {
                if (f.startsWith(prefix) && f.endsWith('.prob')) {
                    probFile = path.join(cphDir, f);
                    break;
                }
            }
        } catch {
            // ignore
        }
    }

    if (!probFile) {
        return null;
    }

    try {
        const raw = JSON.parse(fs.readFileSync(probFile, 'utf-8'));
        return convertCphProblem(raw, srcPath);
    } catch {
        return null;
    }
}

/**
 * Load a problem from disk for the given source file.
 * Returns null if no problem file exists.
 *
 * Resolution order:
 *   1. Exact CP Arena `.prob` (fast path)
 *   2. Loose CP Arena match (handles renamed/sanitized filenames)
 *   3. Legacy CPH `.cph` problem (migrated to CP Arena format on first read)
 */
export function loadProblem(srcPath: string): Problem | null {
    // 1. Exact native match
    const probPath = getProblemPath(srcPath);
    if (fs.existsSync(probPath)) {
        try {
            const problem = JSON.parse(fs.readFileSync(probPath, 'utf-8')) as Problem;
            problem.srcPath = srcPath; // keep up to date in case file was moved
            return problem;
        } catch {
            // fall through to other strategies
        }
    }

    // 2. Loose native match
    const flexPath = findArenaProbFlexible(srcPath);
    if (flexPath) {
        try {
            const problem = JSON.parse(fs.readFileSync(flexPath, 'utf-8')) as Problem;
            problem.srcPath = srcPath;
            return problem;
        } catch {
            // fall through
        }
    }

    // 3. Legacy CPH problem — migrate so it persists in CP Arena format
    const cphProblem = loadCphProblem(srcPath);
    if (cphProblem) {
        try {
            saveProblem(cphProblem);
        } catch {
            // migration is best-effort
        }
        return cphProblem;
    }

    return null;
}

/**
 * Create a new empty problem for a source file.
 */
export function createEmptyProblem(srcPath: string): Problem {
    const baseName = path.basename(srcPath, path.extname(srcPath));
    const language = detectLanguage(srcPath);

    const problem: Problem = {
        name: baseName,
        group: '',
        url: '',
        timeLimit: getTimeLimit(),
        memoryLimit: 256,
        testCases: [
            {
                id: 1,
                input: '',
                expectedOutput: '',
                verdict: 'PENDING',
            },
        ],
        srcPath,
        language,
    };

    saveProblem(problem);
    return problem;
}

/**
 * Add a test case to an existing problem.
 */
export function addTestCase(
    problem: Problem,
    input: string,
    expectedOutput: string
): TestCase {
    const maxId = problem.testCases.reduce((max, tc) => Math.max(max, tc.id), 0);
    const newTC: TestCase = {
        id: maxId + 1,
        input,
        expectedOutput,
        verdict: 'PENDING',
    };
    problem.testCases.push(newTC);
    saveProblem(problem);
    return newTC;
}

/**
 * Delete a test case from a problem.
 */
export function deleteTestCase(problem: Problem, testCaseId: number): void {
    problem.testCases = problem.testCases.filter((tc) => tc.id !== testCaseId);
    saveProblem(problem);
}

/**
 * Update a test case's input/output.
 */
export function editTestCase(
    problem: Problem,
    testCaseId: number,
    input: string,
    expectedOutput: string
): void {
    const tc = problem.testCases.find((t) => t.id === testCaseId);
    if (tc) {
        tc.input = input;
        tc.expectedOutput = expectedOutput;
        tc.verdict = 'PENDING';
        tc.receivedOutput = undefined;
        tc.executionTime = undefined;
        tc.signal = undefined;
        tc.stderr = undefined;
        saveProblem(problem);
    }
}

/**
 * Check if a problem file exists for the given source file.
 */
export function hasProblem(srcPath: string): boolean {
    const probPath = getProblemPath(srcPath);
    return fs.existsSync(probPath);
}
