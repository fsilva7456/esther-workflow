import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { projectManager } from './lib/projectManager';
import { configManager } from './lib/configManager';
import { specManager } from './lib/specManager';
import { testManager } from './lib/testManager';
import { llmService } from './lib/llmService';
import { testRunner } from './lib/testRunner';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// --- Project Endpoints ---

app.get('/projects', (req, res) => {
    const projects = projectManager.listProjects();
    res.json(projects);
});

app.post('/projects', (req, res) => {
    const { name, repoPath, testCommand } = req.body;
    if (!name || !repoPath || !testCommand) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const project = projectManager.addProject({ name, repoPath, testCommand });
    res.json(project);
});

app.get('/projects/:id/config', (req, res) => {
    const project = projectManager.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const config = configManager.loadProjectConfig(project.repoPath);
    if (!config) return res.status(404).json({ error: 'Config not found' });

    res.json(config);
});

// --- Use Case Endpoints ---

app.get('/projects/:id/use-cases/:useCaseId/spec', (req, res) => {
    const project = projectManager.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const config = configManager.loadProjectConfig(project.repoPath);
    const useCase = config?.useCases.find(u => u.id === req.params.useCaseId);

    if (!useCase) return res.status(404).json({ error: 'Use case not found' });

    const spec = specManager.readSpec(project.repoPath, useCase.specPath);
    res.json({ content: spec || '' });
});

app.post('/projects/:id/use-cases/:useCaseId/spec', (req, res) => {
    const project = projectManager.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const config = configManager.loadProjectConfig(project.repoPath);
    const useCase = config?.useCases.find(u => u.id === req.params.useCaseId);

    if (!useCase) return res.status(404).json({ error: 'Use case not found' });

    specManager.writeSpec(project.repoPath, useCase.specPath, req.body.content);
    res.json({ success: true });
});

app.post('/projects/:id/use-cases/:useCaseId/spec/structure', async (req, res) => {
    try {
        const spec = await llmService.structureUseCase(req.body.description);
        res.json({ spec });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/projects/:id/use-cases/:useCaseId/spec/revise', async (req, res) => {
    try {
        const spec = await llmService.reviseUseCase(req.body.currentSpec, req.body.instructions);
        res.json({ spec });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Test Endpoints ---

app.get('/projects/:id/use-cases/:useCaseId/tests', (req, res) => {
    // In a real app, we'd look up test paths from config or convention.
    // For now, we'll assume a standard path or pass it in query/body?
    // The user request says "Returns the current test file contents".
    // But we need to know WHICH file.
    // Let's assume the client sends the relative path in query param 'path'
    const project = projectManager.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: 'Missing path query param' });

    const content = testManager.readTestFile(project.repoPath, filePath);
    res.json({ content: content || '' });
});

app.post('/projects/:id/use-cases/:useCaseId/tests/generate', async (req, res) => {
    try {
        const tests = await llmService.generateTests(req.body.spec, req.body.type);
        res.json({ tests });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/projects/:id/use-cases/:useCaseId/tests/revise', async (req, res) => {
    try {
        const tests = await llmService.reviseTests(req.body.currentTests, req.body.instructions);
        res.json({ tests });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/projects/:id/use-cases/:useCaseId/tests/sync', (req, res) => {
    const project = projectManager.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { filePath, content } = req.body;
    testManager.writeTestFile(project.repoPath, filePath, content);
    res.json({ success: true });
});

// --- Agent Handoff ---

app.post('/projects/:id/use-cases/:useCaseId/agent-instructions', async (req, res) => {
    try {
        const instructions = await llmService.generateAgentInstructions(req.body.spec, req.body.testPaths);
        res.json({ instructions });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Test Runner ---

app.post('/projects/:id/test-runs', async (req, res) => {
    const project = projectManager.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { scope, useCaseId, filePath } = req.body;
    // Construct command based on scope. This is simplified.
    let args: string[] = [];
    // If using pnpm test, maybe we just append the file path?
    // Assuming 'testCommand' is something like 'npm test' or 'pnpm test'

    const runId = await testRunner.runTests(project.repoPath, project.testCommand, args);
    res.json({ runId });
});

app.get('/projects/:id/test-runs/:runId', (req, res) => {
    const result = testRunner.getTestRun(req.params.runId);
    if (!result) return res.status(404).json({ error: 'Run not found' });
    res.json(result);
});

// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });

export default app;
