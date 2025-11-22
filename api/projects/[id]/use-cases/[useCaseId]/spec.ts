import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage for specs (in production, use a database)
const specs: Record<string, string> = {
    'user-authentication': `# User Authentication

## Description
This use case handles user login and authentication for the RAD application.

## Actors
- User
- Authentication Service

## Preconditions
- User has valid credentials
- System is operational

## Main Flow
1. User navigates to login page
2. User enters username and password
3. System validates credentials
4. System creates session token
5. User is redirected to dashboard

## Alternative Flows
- Invalid credentials: Show error message
- Account locked: Display lockout message

## Postconditions
- User is authenticated
- Session token is stored`,

    'data-validation': `# Data Validation

## Description
Validates user input data before processing.

## Main Flow
1. Receive user input
2. Check data types
3. Validate against business rules
4. Return validation result`,

    'api-integration': `# API Integration

## Description
Integrates with external APIs for data retrieval.

## Main Flow
1. Prepare API request
2. Send request to external service
3. Handle response
4. Transform data for internal use`
};

export default function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id, useCaseId } = req.query;

    if (req.method === 'GET') {
        const specContent = specs[useCaseId as string] || '';
        return res.status(200).json({ content: specContent });
    }

    if (req.method === 'POST') {
        const { content } = req.body;
        if (typeof useCaseId === 'string') {
            specs[useCaseId] = content;
        }
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
