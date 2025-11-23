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

const router = express.Router();

// --- Project Endpoints ---

router.get('/projects', (req, res) => {
    const projects = projectManager.listProjects();
    res.json(projects);
});

router.post('/projects', (req, res) => {
    const { name, repoPath, testCommand } = req.body;
    if (!name || !repoPath || !testCommand) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const project = projectManager.addProject({ name, repoPath, testCommand });
    res.json(project);
});

router.get('/projects/:id/config', (req, res) => {
    const project = projectManager.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const config = configManager.loadProjectConfig(project.repoPath);
    if (!config) return res.status(404).json({ error: 'Config not found' });

    res.json(config);
});

// --- Use Case Endpoints ---

router.get('/projects/:id/use-cases/:useCaseId/spec', (req, res) => {
    const project = projectManager.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const config = configManager.loadProjectConfig(project.repoPath);
    const useCase = config?.useCases.find(u => u.id === req.params.useCaseId);

    if (!useCase) return res.status(404).json({ error: 'Use case not found' });

    const spec = specManager.readSpec(project.repoPath, useCase.specPath);
    // Return both content and metadata (metadata comes from config for now, 
    // but we could also parse frontmatter here if needed)
    res.json({
        content: spec || '',
        metadata: {
            status: useCase.status,
            version: useCase.version,
            createdAt: useCase.createdAt,
            updatedAt: useCase.updatedAt,
            lastImplemented: useCase.lastImplemented
        }
    });
});

router.post('/projects/:id/use-cases/:useCaseId/spec', (req, res) => {
    const project = projectManager.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const config = configManager.loadProjectConfig(project.repoPath);
    const useCase = config?.useCases.find(u => u.id === req.params.useCaseId);

    if (!useCase) return res.status(404).json({ error: 'Use case not found' });

    // Update spec file
    specManager.writeSpec(project.repoPath, useCase.specPath, req.body.content);

    // Update metadata in config
    useCase.updatedAt = new Date().toISOString();
    // Logic for version bumping could go here or be passed from frontend
    if (req.body.metadata) {
        if (req.body.metadata.status) useCase.status = req.body.metadata.status;
        if (req.body.metadata.version) useCase.version = req.body.metadata.version;
    }

    configManager.saveProjectConfig(project.repoPath, config!);

    res.json({ success: true });
});

import { promptManager, PromptType } from './lib/promptManager';

// ... (existing imports)

// Prompt Management Endpoints
router.get('/prompts/:type', async (req, res) => {
    try {
        const template = await promptManager.getPromptTemplate(req.params.type as PromptType);
        res.json({ template });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/prompts/:type', async (req, res) => {
    try {
        await promptManager.savePromptTemplate(req.params.type as PromptType, req.body.template);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Use Case Endpoints
router.post('/projects/:id/use-cases/:useCaseId/spec/structure', async (req, res) => {
    try {
        const spec = await llmService.structureUseCase(
            req.body.description,
            req.body.title,
            req.body.currentSpec,
            req.body.customPromptTemplate // Accept custom prompt
        );
        res.json({ spec });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/projects/:id/use-cases/:useCaseId/spec/revise', async (req, res) => {
    try {
        const spec = await llmService.reviseUseCase(
            req.body.currentSpec,
            req.body.instructions,
            req.body.customPromptTemplate // Accept custom prompt
        );
        res.json({ spec });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Test Endpoints ---

router.get('/projects/:id/tests', async (req, res) => {
    const project = projectManager.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const files = await testManager.listTestFiles(project.repoPath);
    res.json({ files });
});

router.get('/projects/:id/use-cases/:useCaseId/tests', (req, res) => {
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

router.post('/projects/:id/use-cases/:useCaseId/tests/generate', async (req, res) => {
    try {
        const tests = await llmService.generateTests(req.body.spec, req.body.type);
        res.json({ tests });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/projects/:id/use-cases/:useCaseId/tests/revise', async (req, res) => {
    try {
        const tests = await llmService.reviseTests(req.body.currentTests, req.body.instructions);
        res.json({ tests });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/projects/:id/use-cases/:useCaseId/tests/update-from-spec', async (req, res) => {
    try {
        const tests = await llmService.updateTestsFromSpec(req.body.currentTests, req.body.newSpec);
        res.json({ tests });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/projects/:id/use-cases/:useCaseId/tests/sync', (req, res) => {
    const project = projectManager.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { filePath, content, type, version } = req.body; // type: 'unit' | 'integration'
    testManager.writeTestFile(project.repoPath, filePath, content);

    // Update config metadata
    const config = configManager.loadProjectConfig(project.repoPath);
    if (config) {
        const useCase = config.useCases.find(u => u.id === req.params.useCaseId);
        if (useCase) {
            if (!useCase.testFiles) useCase.testFiles = {};
            if (type === 'unit') useCase.testFiles.unit = filePath;
            if (type === 'integration') useCase.testFiles.integration = filePath;
            if (version) useCase.testFiles.lastAlignedVersion = version;

            configManager.saveProjectConfig(project.repoPath, config);
        }
    }

    res.json({ success: true });
});

// --- Agent Handoff ---

router.post('/projects/:id/use-cases/:useCaseId/agent-instructions', async (req, res) => {
    try {
        const instructions = await llmService.generateAgentInstructions(req.body.spec, req.body.testPaths);
        res.json({ instructions });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Test Runner ---

router.post('/projects/:id/test-runs', async (req, res) => {
    const project = projectManager.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { scope, useCaseId, filePath } = req.body;

    // Construct command based on scope.
    let args: string[] = [];
    if (filePath) {
        args.push(filePath);
    }

    const runId = await testRunner.runTests(project.repoPath, project.testCommand, args);
    res.json({ runId });
});

router.get('/projects/:id/test-runs/:runId', (req, res) => {
    const result = testRunner.getTestRun(req.params.runId);
    if (!result) return res.status(404).json({ error: 'Run not found' });
    res.json(result);
});

app.use('/api', router);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

export default app;
