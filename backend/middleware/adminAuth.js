export const adminAuth = (req, res, next) => {
    try {
        const { username } = req.body;
        
        // Check if user is admin (set in environment variable)
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        
        if (username !== adminUsername) {
            return res.status(403).json({ 
                message: 'Access Denied: Admin privileges required' 
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ message: 'Authentication error' });
    }
};