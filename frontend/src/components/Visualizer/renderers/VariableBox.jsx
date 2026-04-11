// import React from 'react';
// import { motion } from 'framer-motion';

// const VariableBox = ({ name, value }) => {
//     // Determine color based on type
//     const isString = typeof value === 'string';
//     const isBoolean = typeof value === 'boolean';
//     const isNumber = typeof value === 'number';

//     return (
//         <motion.div 
//             layout
//             initial={{ scale: 0.8, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             className="flex flex-col items-center bg-[#0d1117] border border-gray-700 rounded-lg p-3 min-w-[80px] shadow-sm"
//         >
//             <span className="text-gray-500 text-xs font-mono mb-1">{name}</span>
//             <div className={`font-mono font-bold text-lg ${
//                 isString ? 'text-yellow-400' : 
//                 isBoolean ? 'text-purple-400' : 
//                 'text-blue-400'
//             }`}>
//                 {isString ? `"${value}"` : String(value)}
//             </div>
//         </motion.div>
//     );
// };

// export default VariableBox;










// src/components/Visualizer/renderers/VariableBox.jsx
import React from 'react';
import { motion } from 'framer-motion';

const VariableBox = ({ name, value }) => {
    // Determine type and styling
    const isString = typeof value === 'string';
    const isBoolean = typeof value === 'boolean';
    const isNumber = typeof value === 'number';
    const isNull = value === null;
    const isUndefined = value === undefined;

    // Color scheme based on type
    let colorClass = 'text-blue-400 border-blue-400/30 bg-blue-400/5';
    let iconBg = 'bg-blue-500';
    let displayValue = String(value);

    if (isString) {
        colorClass = 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5';
        iconBg = 'bg-yellow-500';
        displayValue = `"${value}"`;
    } else if (isBoolean) {
        colorClass = 'text-purple-400 border-purple-400/30 bg-purple-400/5';
        iconBg = 'bg-purple-500';
    } else if (isNull || isUndefined) {
        colorClass = 'text-gray-500 border-gray-600/30 bg-gray-600/5';
        iconBg = 'bg-gray-600';
        displayValue = value === null ? 'null' : 'undefined';
    }

    return (
        <motion.div 
            layout
            initial={{ scale: 0.8, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`flex flex-col items-center ${colorClass} border-2 rounded-xl p-4 min-w-[100px] shadow-lg hover:shadow-xl transition-all group cursor-default`}
        >
            {/* Type Indicator Dot */}
            <div className="flex items-center gap-2 mb-2 w-full">
                <div className={`w-2 h-2 rounded-full ${iconBg}`} />
                <span className="text-gray-500 text-xs font-mono font-bold uppercase tracking-wider">
                    {name}
                </span>
            </div>

            {/* Value Display */}
            <div className="font-mono font-bold text-2xl tabular-nums break-all text-center">
                {displayValue}
            </div>

            {/* Type Label */}
            <span className="text-gray-600 text-[10px] font-mono mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
                {isString ? 'string' : isBoolean ? 'boolean' : isNumber ? 'number' : 'null'}
            </span>
        </motion.div>
    );
};

export default VariableBox;
// V 1.5
