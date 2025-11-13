export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Mock response for Vercel deployment
        // In production, this would integrate with actual Cursor API
        const mockAgents = [
            {
                id: 'bc_mock123',
                name: 'Mock Agent - Vehicle Creation',
                status: 'FINISHED',
                source: {
                    repository: 'https://github.com/example/game-project'
                },
                summary: 'Created custom vehicle models and blueprints'
            },
            {
                id: 'bc_mock456',
                name: 'Mock Agent - Weapon System',
                status: 'RUNNING',
                source: {
                    repository: 'https://github.com/example/game-project'
                },
                summary: 'Implementing advanced weapon mechanics'
            }
        ];

        res.status(200).json({
            agents: mockAgents,
            note: 'This is a mock response for Vercel deployment. Full Cursor API integration requires server-side implementation.'
        });
    } catch (error) {
        console.error('Cursor agents error:', error);
        res.status(500).json({ error: 'Failed to retrieve agents' });
    }
}
