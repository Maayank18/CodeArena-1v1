import React from 'react';
import { useMatrixScramble } from '../../../hooks/useMatrixScramble';
import { useTheme } from '../../../context/ThemeContext';

export const MatrixStatNumber = ({ value, className = '' }) => {
    const { advancedTheme } = useTheme();
    const isMatrix = advancedTheme === 'matrix';
    
    // Only scramble if Matrix theme is active
    const scrambledValue = useMatrixScramble(value, {
        duration: 800,
        speed: 40,
        enabled: isMatrix
    });

    return (
        <span className={isMatrix ? `text-glow-matrix ${className}` : className}>
            {isMatrix ? scrambledValue : value}
        </span>
    );
};
