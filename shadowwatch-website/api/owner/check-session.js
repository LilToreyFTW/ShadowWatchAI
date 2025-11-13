export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // In Vercel serverless, we don't have persistent sessions
        // For demo purposes, we'll return a mock response
        const authenticated = false;
        const username = null;

        res.status(200).json({
            authenticated,
            username,
            message: 'Session check completed',
            note: 'Persistent sessions not available in serverless environment'
        });
    } catch (error) {
        console.error('Session check error:', error);
        res.status(500).json({ error: 'Failed to check session' });
    }
}
