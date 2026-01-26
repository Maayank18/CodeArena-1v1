import { traceJavaScript } from '../utils/tracers/jsTracer.js';
// import { traceCpp } from '../utils/tracers/cppTracer.js';

export const executeVisualization = async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, message: "Code cannot be empty" });
    }

    try {
        let traceData = [];

        if (language === 'javascript') {
            traceData = await traceJavaScript(code);
        } else if (language === 'cpp') {
            traceData = await traceCpp(code);
        } else {
            return res.status(400).json({ success: false, message: "Unsupported language" });
        }

        res.json({ success: true, trace: traceData });

    } catch (error) {
        console.error(`[VISUALIZER ERROR] ${language}:`, error);
        // Distinguish between User Code Errors (Compilation) and System Errors
        const isUserError = error.message.includes("Compilation") || error.message.includes("Syntax");
        
        res.status(isUserError ? 400 : 500).json({ 
            success: false, 
            message: isUserError ? "Code Error" : "Execution Error", 
            error: error.message 
        });
    }
};