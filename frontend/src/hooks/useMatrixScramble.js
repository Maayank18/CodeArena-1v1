import { useState, useEffect } from 'react';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロゴゾドボポヴッン';

export const useMatrixScramble = (text, options = {}) => {
    const {
        duration = 1000,
        speed = 50,
        enabled = true,
        scrambleChars = CHARACTERS,
    } = options;

    const [displayText, setDisplayText] = useState(text);

    useEffect(() => {
        if (!enabled || !text) {
            setDisplayText(text);
            return;
        }

        const targetText = String(text);
        let currentFrame = 0;
        const totalFrames = Math.floor(duration / speed);
        
        let interval;

        interval = setInterval(() => {
            currentFrame++;
            
            if (currentFrame >= totalFrames) {
                clearInterval(interval);
                setDisplayText(targetText);
                return;
            }

            // Calculate how many characters from the start are resolved
            const resolveProgress = currentFrame / totalFrames;
            const resolveLength = Math.floor(targetText.length * resolveProgress);

            let scrambled = '';
            for (let i = 0; i < targetText.length; i++) {
                if (i < resolveLength || targetText[i] === ' ') {
                    scrambled += targetText[i];
                } else {
                    scrambled += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                }
            }

            setDisplayText(scrambled);
        }, speed);

        return () => clearInterval(interval);
    }, [text, duration, speed, enabled, scrambleChars]);

    return displayText;
};

// Version-2.0