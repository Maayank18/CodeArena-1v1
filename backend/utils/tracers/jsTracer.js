// FILE: backend/utils/tracers/jsTracer.js
// COMPLETELY REWRITTEN — Senior-level optimizations:
//   1. Scope-aware variable capture  (no more TDZ ghosts / undefined noise)
//   2. State deduplication           (skip snapshot if nothing changed)
//   3. MAX_STEPS hard cap            (prevents browser crash on O(n²) algos)
//   4. Depth-limited safeSerialize   (no stack overflow on deep trees)
//   5. Smart injection strategy      (fewer, more meaningful snapshots)
//   6. Dangerous pattern guard       (security)
//   7. Better error classification   (user-friendly messages)

import { runInContext, createContext } from 'vm';
import * as acorn from 'acorn';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_STEPS      = 2000;   // Hard cap on snapshots (bubble sort 20 items ≈ 800)
const MAX_CODE_LEN   = 20_000; // 20KB limit
const MAX_DEPTH      = 12;     // Max serialization depth for nested objects
const EXEC_TIMEOUT   = 6000;   // 6s sandbox timeout

// Variables that are always noise — never show these
const ALWAYS_BANNED = new Set([
    'this','window','global','globalThis','self','module','exports',
    'arguments','require','process','__dirname','__filename','console',
    '__snapshot','__step','undefined','NaN','Infinity',
]);

// Dangerous patterns that should never execute
const DANGEROUS_PATTERNS = [
    /\brequire\s*\(/,
    /\bimport\s*\(/,
    /\bprocess\s*\./,
    /\bfs\s*\./,
    /\bchild_process/,
    /\beval\s*\(/,
    /\bFunction\s*\(/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest/,
    /\bsetTimeout\s*\(/,
    /\bsetInterval\s*\(/,
    /\bWorker\s*\(/,
    /\bWebSocket\s*\(/,
    /\.__proto__/,
    /\.constructor\s*\[/,
];

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
export const traceJavaScript = async (userCode) => {
    // 1. Validate
    if (userCode.length > MAX_CODE_LEN) {
        throw Object.assign(new Error(`Code too large (max ${MAX_CODE_LEN / 1000}KB)`), { isUserError: true });
    }
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(userCode)) {
            throw Object.assign(new Error(`Disallowed pattern: ${pattern.source.slice(0, 40)}`), { isUserError: true });
        }
    }

    const trace = [];

    try {
        // 2. Instrument
        const { code: instrumentedCode } = instrumentJs(userCode);

        // 3. Build sandbox
        let lastSnapshotJSON = null;
        let stepCount = 0;

        const sandbox = {
            // Safe console — capture logs as trace events
            console: {
                log: (...args) => {
                    if (stepCount >= MAX_STEPS) return;
                    trace.push({
                        line: 0,
                        type: 'log',
                        output: args.map(a => safeSerialize(a, new WeakMap(), 0)).join(' '),
                    });
                },
                error: (...args) => {},
                warn:  (...args) => {},
            },

            // Math, Array, Object, etc. — pass through safely
            Math, Array, Object, String, Number, Boolean,
            JSON, Date, Map, Set, WeakMap, WeakSet,
            parseInt, parseFloat, isNaN, isFinite,
            Symbol, Promise, Error, TypeError, ReferenceError, SyntaxError,

            // The snapshot injector — called after every meaningful statement
            __snapshot: (line, capturer) => {
                if (stepCount >= MAX_STEPS) return;

                try {
                    const raw = capturer();
                    const safeVars = {};

                    for (const [key, val] of raw) {
                        if (ALWAYS_BANNED.has(key)) continue;
                        if (val === undefined) continue;
                        // Skip internal instrumentation variables
                        if (key.startsWith('__')) continue;

                        safeVars[key] = safeSerialize(val, new WeakMap(), 0);
                    }

                    if (Object.keys(safeVars).length === 0) return;

                    // ── Deduplication: skip if nothing changed ──────────────
                    const json = JSON.stringify(safeVars);
                    if (json === lastSnapshotJSON) return;
                    lastSnapshotJSON = json;

                    trace.push({ line, variables: safeVars });
                    stepCount++;

                    // Soft cap warning in trace
                    if (stepCount === MAX_STEPS) {
                        trace.push({
                            line: 0,
                            type: 'warning',
                            output: `Trace capped at ${MAX_STEPS} steps. Your algorithm has many iterations — showing a representative sample.`,
                        });
                    }
                } catch (_) {
                    // TDZ, scope errors — silently skip
                }
            },
        };

        createContext(sandbox);
        runInContext(instrumentedCode, sandbox, { timeout: EXEC_TIMEOUT });

    } catch (e) {
        const isUserError =
            e.isUserError ||
            e.name === 'SyntaxError' ||
            e.message?.includes('is not defined') ||
            e.message?.includes('is not a function') ||
            e.message?.includes('Cannot read') ||
            e.message?.includes('Maximum call stack') ||
            e.message?.includes('Script execution timed out');

        trace.push({
            line: 0,
            type: 'error',
            error: e.message,
            isUserError,
        });
    }

    return trace;
};

// ─────────────────────────────────────────────────────────────────────────────
// SAFE SERIALIZER — depth-limited, cycle-safe, handles all JS types
// ─────────────────────────────────────────────────────────────────────────────
function safeSerialize(value, seen = new WeakMap(), depth = 0) {
    // Primitives
    if (value === null)      return null;
    if (value === undefined) return undefined;

    if (typeof value === 'number') {
        if (Number.isNaN(value))      return 'NaN';
        if (value === Infinity)        return 'Infinity';
        if (value === -Infinity)       return '-Infinity';
        return value;
    }
    if (typeof value === 'string')  return value;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'bigint')  return value.toString() + 'n';
    if (typeof value === 'symbol')  return value.toString();
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;

    // Reference types
    if (typeof value !== 'object') return String(value);

    // Depth guard — prevents stack overflow on deep trees/graphs
    if (depth >= MAX_DEPTH) return '[MaxDepth]';

    // Cycle guard
    if (seen.has(value)) return '[Circular]';
    seen.set(value, true);

    const next = (v) => safeSerialize(v, seen, depth + 1);

    // Map
    if (value instanceof Map) {
        return {
            type: 'Map',
            entries: Array.from(value.entries()).map(([k, v]) => [next(k), next(v)]),
        };
    }

    // Set
    if (value instanceof Set) {
        return {
            type: 'Set',
            values: Array.from(value.values()).map(next),
        };
    }

    // Array
    if (Array.isArray(value)) {
        // Truncate massive arrays
        const arr = value.length > 500
            ? [...value.slice(0, 500).map(next), `[...${value.length - 500} more]`]
            : value.map(next);
        return arr;
    }

    // Date
    if (value instanceof Date) return value.toISOString();

    // Generic Object
    const copy = {};
    let count = 0;
    for (const key of Object.keys(value)) {
        if (count++ > 100) { copy['[...truncated]'] = true; break; } // Cap object keys
        try {
            copy[key] = next(value[key]);
        } catch (_) {
            copy[key] = '[AccessError]';
        }
    }
    return copy;
}

// ─────────────────────────────────────────────────────────────────────────────
// AST INSTRUMENTATION — scope-aware, smart injection
// ─────────────────────────────────────────────────────────────────────────────
function instrumentJs(code) {
    let ast;
    try {
        ast = acorn.parse(code, {
            ecmaVersion: 'latest',
            locations: true,
            sourceType: 'script',
        });
    } catch (e) {
        throw Object.assign(
            new Error(`Syntax Error on line ${e.loc?.line || '?'}: ${e.message}`),
            { isUserError: true }
        );
    }

    // ── PHASE 1: Scope-aware variable collection ──────────────────────────
    // Build a map: injection_position → Set<variable_names_in_scope_at_that_point>
    
    const inserts = []; // { pos, line, scopeVars: string[] }

    // Scope stack: each frame tracks vars declared in that lexical scope
    const scopeStack = [new Set()]; // index 0 = module/global scope

    const pushScope = () => scopeStack.push(new Set());
    const popScope  = () => scopeStack.pop();

    // Returns all vars visible from current scope chain
    const visibleVars = () => {
        const all = new Set();
        for (const frame of scopeStack) frame.forEach(v => all.add(v));
        return all;
    };

    // Declare a variable in the nearest scope
    const declare = (name) => {
        if (!ALWAYS_BANNED.has(name)) {
            scopeStack[scopeStack.length - 1].add(name);
        }
    };

    // Statement types after which we want a snapshot
    const SNAPSHOT_TYPES = new Set([
        'VariableDeclaration',
        'ExpressionStatement',
        'ReturnStatement',
        'BreakStatement',
        'ContinueStatement',
        'ThrowStatement',
    ]);

    // We track last injection position to avoid duplicates at same char offset
    const injectedPositions = new Set();

    const addInsert = (node) => {
        if (!node.loc || !node.end) return;
        if (injectedPositions.has(node.end)) return;
        injectedPositions.add(node.end);
        inserts.push({
            pos: node.end,
            line: node.loc.end.line,
            scopeVars: Array.from(visibleVars()),
        });
    };

    // ── Recursive walker with scope tracking ──────────────────────────────
    const walk = (node, parent = null, isLoopHeader = false) => {
        if (!node || typeof node !== 'object' || !node.type) return;

        switch (node.type) {

            // ── Variable declarations ────────────────────────────────────
            case 'VariableDeclarator':
                if (node.id.type === 'Identifier') declare(node.id.name);
                // Destructuring: let { a, b } = obj  or  let [x, y] = arr
                if (node.id.type === 'ObjectPattern') {
                    node.id.properties.forEach(p => {
                        if (p.value?.type === 'Identifier') declare(p.value.name);
                        else if (p.key?.type === 'Identifier') declare(p.key.name);
                    });
                }
                if (node.id.type === 'ArrayPattern') {
                    node.id.elements.forEach(e => {
                        if (e?.type === 'Identifier') declare(e.name);
                    });
                }
                break;

            // ── Function declarations ────────────────────────────────────
            case 'FunctionDeclaration':
                if (node.id) declare(node.id.name);
                pushScope();
                node.params.forEach(p => {
                    if (p.type === 'Identifier')     declare(p.name);
                    if (p.type === 'AssignmentPattern' && p.left.type === 'Identifier') declare(p.left.name);
                    if (p.type === 'RestElement' && p.argument.type === 'Identifier')   declare(p.argument.name);
                });
                walkChildren(node.body, node);
                popScope();
                return; // Don't fall through to generic walk

            case 'FunctionExpression':
            case 'ArrowFunctionExpression':
                pushScope();
                node.params.forEach(p => {
                    if (p.type === 'Identifier') declare(p.name);
                    if (p.type === 'AssignmentPattern' && p.left.type === 'Identifier') declare(p.left.name);
                });
                walkChildren(node.body, node);
                popScope();
                return;

            // ── Block scopes (for/while bodies, if branches) ─────────────
            case 'BlockStatement':
                node.body.forEach(stmt => walk(stmt, node));
                return;

            // ── For loops: separate header vars from body vars ────────────
            case 'ForStatement':
                pushScope();
                // Header: init, test, update — declare vars but DON'T inject here
                if (node.init) walk(node.init, node, true);
                // Body: inject normally
                if (node.body) walk(node.body, node);
                popScope();
                return;

            case 'ForInStatement':
            case 'ForOfStatement':
                pushScope();
                if (node.left) walk(node.left, node, true);
                if (node.body) walk(node.body, node);
                popScope();
                return;

            case 'WhileStatement':
            case 'DoWhileStatement':
                if (node.body) walk(node.body, node);
                // Inject after the whole do-while (captures final state)
                if (node.type === 'DoWhileStatement') addInsert(node);
                return;

            // ── Class declarations ────────────────────────────────────────
            case 'ClassDeclaration':
                if (node.id) declare(node.id.name);
                break;
        }

        // ── Snapshot injection for statement-level nodes ──────────────────
        if (SNAPSHOT_TYPES.has(node.type) && !isLoopHeader) {
            // Extra guard: don't inject if inside for-loop init/update
            if (!(parent?.type === 'ForStatement' && (node === parent.init || node === parent.update))) {
                addInsert(node);
            }
        }

        // ── Generic child walk ────────────────────────────────────────────
        walkChildren(node, parent);
    };

    const walkChildren = (node, parent) => {
        for (const key of Object.keys(node)) {
            if (key === 'loc' || key === 'start' || key === 'end' || key === 'type') continue;
            const child = node[key];
            if (Array.isArray(child)) {
                child.forEach(c => { if (c && typeof c === 'object' && c.type) walk(c, node); });
            } else if (child && typeof child === 'object' && child.type) {
                walk(child, node);
            }
        }
    };

    walk(ast, null);

    // ── PHASE 2: Code generation ──────────────────────────────────────────
    // Sort in reverse so string insertions don't shift earlier positions
    inserts.sort((a, b) => b.pos - a.pos);

    let output = code;

    for (const { pos, line, scopeVars } of inserts) {
        // Build capture list only from vars visible at this scope
        // Use typeof guard for safety (TDZ, conditional declarations)
        const captureList = scopeVars
            .map(v => `["${v}", typeof ${v} !== 'undefined' ? ${v} : undefined]`)
            .join(',');

        const snippet = `;__snapshot(${line}, () => [${captureList}]);`;
        output = output.slice(0, pos) + snippet + output.slice(pos);
    }

    return { code: output, scopeMap: inserts };
}
