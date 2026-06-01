// RESPONSIVE 
import { resolveBackendOrigin } from '../api.js';

const FRAME_STYLES = {
    'none': '',
    'neon-cyan': 'ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]',
    'gold-hexagon': 'ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]',
    'pulse-ring': 'ring-2 ring-purple-400 animate-pulse shadow-[0_0_12px_rgba(192,132,252,0.4)]',
    'emerald-glow': 'ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]',
    'crimson-edge': 'ring-2 ring-red-400 shadow-[0_0_12px_rgba(248,113,113,0.4)]',
};

const Avatar = ({ username, src, className, avatarFrame }) => {
    // Use DiceBear API for consistent, cool avatars
    const seed = username || 'guest';
    
    // Resolve relative paths (like 'uploads/...') to absolute backend URLs
    let resolvedSrc = src;
    if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        const backendOrigin = resolveBackendOrigin();
        resolvedSrc = `${backendOrigin}/${src.replace(/^\//, '')}`;
    }

    const avatarUrl = resolvedSrc || `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    const frameClass = FRAME_STYLES[avatarFrame] || '';

    return (
        <img 
            src={avatarUrl} 
            alt={username} 
            // UPDATES:
            // 1. object-cover: Ensures the image doesn't stretch if width/height are different
            // 2. flex-shrink-0: Critical for mobile! Prevents the avatar from being squished into an oval.
            className={`rounded-xl border border-gray-600/30 bg-white object-cover flex-shrink-0 ${frameClass} ${className}`}
        />
    );
};

export default Avatar;
// V 1.5

// Version-2.0