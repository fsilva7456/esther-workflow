import { execa } from 'execa';

export interface TestRunResult {
    runId: string;
    status: 'pending' | 'passed' | 'failed';
    output: string;
    timestamp: string;
}

// Simple in-memory store for test runs
const testRuns: Record<string, TestRunResult> = {};

export const testRunner = {
    runTests: async (repoPath: string, command: string, args: string[] = []): Promise<string> => {
        const runId = Date.now().toString();
        testRuns[runId] = {
            runId,
            status: 'pending',
            output: '',
            timestamp: new Date().toISOString()
        };

        // Run asynchronously
        (async () => {
            try {
                const { stdout, stderr } = await execa(command, args, { cwd: repoPath, shell: true });
                testRuns[runId].status = 'passed';
                testRuns[runId].output = stdout + '\n' + stderr;
            } catch (error: any) {
                testRuns[runId].status = 'failed';
                testRuns[runId].output = error.message + '\n' + (error.stdout || '') + '\n' + (error.stderr || '');
            }
        })();

        return runId;
    },

    getTestRun: (runId: string): TestRunResult | undefined => {
        return testRuns[runId];
    }
};
