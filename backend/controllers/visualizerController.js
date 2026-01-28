import { traceJavaScript } from '../utils/tracers/jsTracer.js';

export const executeVisualization = async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, message: "Code cannot be empty" });
    }

    try {
        let traceData = [];

        if (language === 'javascript') {
            traceData = await traceJavaScript(code);
        } else {
            return res.status(400).json({ success: false, message: "Unsupported language" });
        }

        res.json({ success: true, trace: traceData });

    } catch (error) {
        console.error(`[VISUALIZER ERROR] ${language}:`, error);
        
        // Categorize errors for the frontend
        const isUserError = 
            error.name === 'SyntaxError' || 
            error.message.includes("Compilation") || 
            error.message.includes("is not defined");

        res.status(isUserError ? 400 : 500).json({ 
            success: false, 
            message: isUserError ? "Execution Error" : "Internal System Error", 
            error: error.message 
        });
    }
};