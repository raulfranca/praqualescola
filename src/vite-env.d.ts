/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Extend the Vite environment types to include the maintenance flag
interface ImportMetaEnv {
	/**
	 * Toggle maintenance mode for the app. The value is a string so we compare with 'true'.
	 * Example: VITE_MAINTENANCE_MODE=true
	 */
	readonly VITE_MAINTENANCE_MODE?: string;
}


