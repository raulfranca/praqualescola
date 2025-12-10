/**
 * BACKWARD COMPATIBILITY NOTE
 * 
 * The original useServiceWorker hook is still available and unchanged.
 * 
 * If you need the old behavior without version info, you can still import it:
 * import { useServiceWorker } from '@/hooks/useServiceWorker';
 * 
 * However, UpdatePrompt.tsx now uses useVersionedUpdatePrompt() which includes
 * version info fetching and dynamic messages.
 * 
 * If you want to keep using the old hook in other components:
 * - Import from useServiceWorker
 * - Messages will be hardcoded
 * - Version tracking won't work
 * 
 * For new code, use useVersionedUpdatePrompt() for the full version tracking.
 */

export {};
