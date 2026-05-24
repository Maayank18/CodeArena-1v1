/**
 * Advanced UI Themes - Central Barrel Export
 * 
 * This file serves as the single point of entry for all premium advanced UI themes.
 * It re-exports all theme-specific components, making them accessible with clean imports.
 * 
 * ✅ CORRECT USAGE:
 *   import { FrostbyteMountain, FrostbyteParticles } from '../components/advancedUI';
 * 
 * ❌ AVOID:
 *   import { FrostbyteMountain } from '../components/advancedUI/frostbyte/FrostbyteMountain';
 * 
 * Architecture Benefits:
 * 1. Clean API: Consumers see only what they need to use
 * 2. Decoupled Structure: Moving/renaming internal files doesn't break imports
 * 3. Scalability: Easy to add new themes (Inferno, Cyberpunk, etc.)
 * 4. Maintenance: Central location for version/deprecation notices
 * 
 * ---
 * THEME ROADMAP:
 * ✅ Frostbyte - IMPLEMENTED (Icy glacial aesthetic with particles & mountains)
 * ⏳ Inferno - Coming soon (Fiery volcanic theme)
 * ⏳ Cyberpunk - Coming soon (Neon digital theme)
 * ⏳ Matrix Protocol - Coming soon (Green rain aesthetic)
 * ⏳ Samurai Shadow - Coming soon (Dark feudal aesthetic)
 * ⏳ D&D - Coming soon (Fantasy dungeon aesthetic)
 */

// ===================
// FROSTBYTE EXPORTS
// ===================
export { FrostbyteMountain, FrostbyteParticles } from './frostbyte';

// ===================
// INFERNO EXPORTS
// ===================
export { InfernoEmbersBackground } from './inferno';

// ===================
// CYBERPUNK EXPORTS
// ===================
// export { ... } from './cyberpunk';

// ===================
// MATRIX PROTOCOL EXPORTS
// ===================
export { MatrixRainBackground, MatrixStatNumber } from './matrix';
export { CyberpunkBackground } from './cyberpunk';

// ===================
// SAMURAI SHADOW EXPORTS
// ===================
export { SamuraiLeavesBackground } from './samurai';

