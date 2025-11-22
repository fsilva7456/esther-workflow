import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock workflow config for RAD project
const RAD_CONFIG = {
    projectName: 'RAD Project',
    useCases: [
        {
            id: 'user-authentication',
            title: 'User Authentication',
            specPath: 'specs/user-authentication.md'
        },
        {
            id: 'data-validation',
            title: 'Data Validation',
            specPath: 'specs/data-validation.md'
        },
        {
            id: 'api-integration',
            title: 'API Integration',
            specPath: 'specs/api-integration.md'
        }
    ]
};

export default function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        const { id } = req.query;

        // For now, only support RAD project
        if (id === 'rad-project-default') {
            return res.status(200).json(RAD_CONFIG);
        }

        return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
