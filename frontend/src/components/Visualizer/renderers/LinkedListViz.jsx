import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';

const LinkedListViz = ({ data, name }) => {
    // 1. FLATTEN THE LIST
    // Turn the nested object { val: 1, next: { val: 2... } } 
    // into a flat array [ {val:1}, {val:2} ]
    const nodes = [];
    let current = data;
    // Safety limit to prevent infinite loops if circular
    let limit = 100; 
    
    while (current && limit > 0) {
        nodes.push({
            id: Math.random(), // In a real app, use a stable ID if possible
            val: current.val ?? current.value ?? current.data,
            // Track if this specific node is being pointed to by a variable
            rawNode: current 
        });
        current = current.next;
        limit--;
    }

    return (
        <div className="p-8 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
                
                {/* HEAD LABEL */}
                <div className="flex flex-col items-center mr-4">
                    <span className="text-purple-400 font-bold font-mono text-sm mb-2">{name}</span>
                    <ArrowRight className="text-purple-400 rotate-90" size={20} />
                </div>

                <AnimatePresence>
                    {nodes.map((node, index) => (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center"
                        >
                            {/* THE NODE (Split Design: Data | Next) */}
                            <div className="flex flex-col items-center">
                                <div className="flex shadow-xl">
                                    {/* DATA PART (Blue) */}
                                    <div className="w-16 h-12 bg-blue-600 flex items-center justify-center border-r border-blue-800 rounded-l-md relative">
                                        <span className="text-white font-bold font-mono text-lg z-10">
                                            {node.val}
                                        </span>
                                        <span className="absolute -top-5 text-[10px] text-blue-400 font-mono">Data</span>
                                    </div>

                                    {/* NEXT POINTER PART (Green) */}
                                    <div className="w-10 h-12 bg-green-600 flex items-center justify-center rounded-r-md relative">
                                        <div className="w-2 h-2 bg-green-900 rounded-full" />
                                        <span className="absolute -top-5 text-[10px] text-green-400 font-mono">Next</span>
                                    </div>
                                </div>
                                
                                {/* Memory Address Simulation (Optional) */}
                                <span className="mt-2 text-[10px] text-gray-600 font-mono">
                                    0x{((index + 1) * 1024).toString(16)}
                                </span>
                            </div>

                            {/* ARROW CONNECTION */}
                            <div className="mx-2 text-gray-500">
                                <ArrowRight size={24} />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* NULL TERMINATOR */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: nodes.length * 0.1 }}
                    className="flex flex-col items-center justify-center opacity-50"
                >
                    <div className="w-10 h-12 border-2 border-dashed border-gray-600 rounded-md flex items-center justify-center bg-gray-900/50">
                        <X size={20} className="text-red-500" />
                    </div>
                    <span className="mt-2 text-[10px] text-gray-500 font-mono">NULL</span>
                </motion.div>

            </div>
        </div>
    );
};

export default LinkedListViz;