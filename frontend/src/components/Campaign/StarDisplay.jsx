// src/components/Campaign/StarDisplay.jsx
import React from 'react';
import { Star } from 'lucide-react';

const StarDisplay = ({ stars = 0, total = 3, size = 'md' }) => {
    const iconSize = { sm: 11, md: 16, lg: 22, xl: 30 }[size] || 16;
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: total }, (_, i) => (
                <Star
                    key={i}
                    size={iconSize}
                    className={
                        i < stars
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]'
                            : 'fill-transparent text-gray-700'
                    }
                />
            ))}
        </div>
    );
};

export default StarDisplay;