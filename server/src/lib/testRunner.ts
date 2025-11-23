import execa = require('execa');

export interface TestRunResult {
    success: boolean;
    output: string;
    error?: string;
    duration: number;
}

export const testRunner = {
    runTests: async (repoPath: string, testCommand: string, args: string[] = []): Promise<string> => {
        const runId = Date.now().toString();
        testRunner.execute(runId, repoPath, testCommand, args);
        return runId;
    },

    // In-memory storage for test runs
    results: new Map<string, TestRunResult>(),

    execute: async (runId: string, repoPath: string, testCommand: string, args: string[]) => {
        const startTime = Date.now();
        try {
            const [cmd, ...cmdArgs] = testCommand.split(' ');
            const finalArgs = [...cmdArgs, ...args];

            console.log(`Running test: ${cmd} ${finalArgs.join(' ')} in ${repoPath}`);

            const { stdout, stderr } = await execa(cmd, finalArgs, {
                cwd: repoPath,
                all: true,
                reject: false
            });

            const duration = Date.now() - startTime;
            const success = !stderr && !stdout.includes('FAIL');

            testRunner.results.set(runId, {
                success,
                output: stdout + (stderr ? '\nERRORS:\n' + stderr : ''),
                duration
            });

        } catch (error: any) {
            const duration = Date.now() - startTime;
            testRunner.results.set(runId, {
                success: false,
                output: error.message,
                error: error.message,
                duration
            });
        }
    },

    getTestRun: (runId: string): TestRunResult | undefined => {
        return testRunner.results.get(runId);
    }
};
