// Download analytics tracking
const downloadStats = {
    totalDownloads: 0,
    recentDownloads: [],
    fileStats: {}
};

// Track download analytics
const trackDownload = (fileName, userAgent, ip) => {
    downloadStats.totalDownloads++;
    downloadStats.recentDownloads.unshift({
        fileName,
        timestamp: new Date().toISOString(),
        userAgent: userAgent.substring(0, 100),
        ip: ip.replace(/\.\d+$/, '.xxx') // Mask last octet for privacy
    });

    // Keep only last 100 downloads
    if (downloadStats.recentDownloads.length > 100) {
        downloadStats.recentDownloads = downloadStats.recentDownloads.slice(0, 100);
    }

    // Track file-specific stats
    if (!downloadStats.fileStats[fileName]) {
        downloadStats.fileStats[fileName] = { count: 0, lastDownloaded: null };
    }
    downloadStats.fileStats[fileName].count++;
    downloadStats.fileStats[fileName].lastDownloaded = new Date().toISOString();

    console.log(`📥 Download tracked: ${fileName} (${downloadStats.fileStats[fileName].count} total)`);
};

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileName, timestamp, userAgent, referrer } = req.body;

        if (fileName) {
            trackDownload(fileName, userAgent || req.headers['user-agent'] || 'Unknown', req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        }

        res.status(200).json({ tracked: true, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Download tracking error:', error);
        res.status(500).json({ error: 'Failed to track download' });
    }
}
