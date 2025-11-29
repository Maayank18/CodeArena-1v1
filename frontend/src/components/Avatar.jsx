// import React from 'react';

// const Avatar = ({ username, className }) => {
//     // Use DiceBear API for consistent, cool avatars
//     const seed = username || 'guest';
//     const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

//     return (
//         <img 
//             src={avatarUrl} 
//             alt={username} 
//             className={`rounded-xl border border-gray-600/30 bg-white ${className}`}
//         />
//     );
// };

// export default Avatar;




// RESPONSIVE 
import React from 'react';

const Avatar = ({ username, className }) => {
    // Use DiceBear API for consistent, cool avatars
    const seed = username || 'guest';
    const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    return (
        <img 
            src={avatarUrl} 
            alt={username} 
            // UPDATES:
            // 1. object-cover: Ensures the image doesn't stretch if width/height are different
            // 2. flex-shrink-0: Critical for mobile! Prevents the avatar from being squished into an oval.
            className={`rounded-xl border border-gray-600/30 bg-white object-cover flex-shrink-0 ${className}`}
        />
    );
};

export default Avatar;