import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyAkPlWBn_eEPbcnN9FHHsXbpNL85sxQCxs';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        try {
            const { currentSpec, instructions } = req.body;

            if (!currentSpec || !instructions) {
                return res.status(400).json({ error: 'Current spec and instructions are required' });
            }

            const prompt = `
You are an expert software architect helping to refine use case specifications.
Please revise the following use case specification based on the instructions provided.
Return ONLY the updated Markdown specification, maintaining the same structure.

Current Spec:
${currentSpec}

Instructions:
${instructions}
`;

            const result = await model.generateContent(prompt);
            const spec = result.response.text();

            return res.status(200).json({ spec });
        } catch (error: any) {
            console.error('Error revising spec:', error);
            return res.status(500).json({ error: error.message || 'Failed to revise spec' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
