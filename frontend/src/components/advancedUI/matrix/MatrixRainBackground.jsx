import React, { useEffect, useRef } from 'react';

const MatrixRainBackground = ({ className = '', forceActive = false }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Set canvas to full window size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Matrix characters (Katakana + Latin + Numerals)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロゴゾドボポヴッン'.split('');

        const fontSize = 16;
        const columns = Math.floor(canvas.width / fontSize) + 1;

        // Array of drops - one per column
        // Value represents the y coordinate of the drop
        const drops = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = Math.random() * -100; // Start off-screen
        }

        const draw = () => {
            // Translucent black background creates the fading tail effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                // Random character
                const text = chars[Math.floor(Math.random() * chars.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                // Occasional white character at the leading edge
                if (Math.random() > 0.95) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillText(text, x, y);
                }

                // Standard neon green character
                ctx.fillStyle = '#00FF41';
                ctx.fillText(text, x, y);

                // Reset drop to top randomly
                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                drops[i]++;
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        // Start animation loop
        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 z-[0] pointer-events-none opacity-40 ${className}`}
            style={{ display: forceActive ? 'block' : undefined }}
        />
    );
};

export default MatrixRainBackground;

// Version-2.0