import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Project {
    id: string;
    name: string;
    repoPath: string;
    testCommand: string;
}

// Default projects that are always available
const DEFAULT_PROJECTS: Project[] = [
    {
        id: 'rad-project-default',
        name: 'RAD Project',
        repoPath: 'c:\\Users\\FrancisSilva\\Desktop\\RAD',
        testCommand: 'npm test'
    }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json(DEFAULT_PROJECTS);
    }

    if (req.method === 'POST') {
        const { name, repoPath, testCommand } = req.body;
        if (!name || !repoPath || !testCommand) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newProject: Project = {
            id: Date.now().toString(),
            name,
            repoPath,
            testCommand
        };

        // In a real app, you'd save this to a database
        // For now, just return it
        return res.status(200).json(newProject);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
