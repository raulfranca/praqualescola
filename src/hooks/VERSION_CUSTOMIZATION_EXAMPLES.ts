/**
 * EXAMPLE: Customizing Version Messages for Different Releases
 * 
 * This file demonstrates how to customize the title and subtitle
 * in /public/version.json for various release scenarios.
 * 
 * Simply edit /public/version.json with the appropriate title and subtitle,
 * then deploy your application.
 */

// ============================================================================
// EXAMPLE 1: Feature Release
// ============================================================================
// File: /public/version.json
// Scenario: New features available
/*
{
  "title": "Novos recursos disponíveis! 🎉",
  "subtitle": "Veja a nova funcionalidade de mapa interativo e filtros avançados"
}
*/

// ============================================================================
// EXAMPLE 2: Bug Fix Release
// ============================================================================
// Scenario: Important bug fixes
/*
{
  "title": "Correção de bugs importante",
  "subtitle": "Alguns problemas foram resolvidos. Atualize agora para melhor experiência"
}
*/

// ============================================================================
// EXAMPLE 3: Performance Improvement
// ============================================================================
// Scenario: Speed improvements
/*
{
  "title": "App 30% mais rápido!",
  "subtitle": "Melhorias de performance. Atualize para sentir a diferença"
}
*/

// ============================================================================
// EXAMPLE 4: Security Update
// ============================================================================
// Scenario: Security patches
/*
{
  "title": "Atualização de segurança importante",
  "subtitle": "Protegemos sua privacidade. Por favor atualize imediatamente"
}
*/

// ============================================================================
// EXAMPLE 5: Maintenance Release
// ============================================================================
// Scenario: General updates and improvements
/*
{
  "title": "Nova versão disponível",
  "subtitle": "Novos ícones e melhorias de performance"
}
*/

// ============================================================================
// EXAMPLE 6: Critical Patch
// ============================================================================
// Scenario: Something critical needs updating
/*
{
  "title": "Atualização crítica disponível",
  "subtitle": "É importante atualizar para manter tudo funcionando corretamente"
}
*/

// ============================================================================
// EXAMPLE 7: UI/UX Improvements
// ============================================================================
// Scenario: Interface updates
/*
{
  "title": "Interface renovada",
  "subtitle": "Experiência mais intuitiva e agradável. Atualize agora!"
}
*/

// ============================================================================
// EXAMPLE 8: Content Update
// ============================================================================
// Scenario: New data or content
/*
{
  "title": "Dados atualizados",
  "subtitle": "Escolas e informações foram atualizadas. Veja o que há de novo"
}
*/

// ============================================================================
// TYPESCRIPT USAGE IN YOUR COMPONENTS
// ============================================================================

/**
 * If you need to use version info directly in other components:
 * 
 * import { useVersionInfo } from '@/hooks/useVersionInfo';
 * 
 * function MyComponent() {
 *   const { versionInfo, isLoading, error } = useVersionInfo();
 * 
 *   if (isLoading) return <p>Carregando versão...</p>;
 *   if (error) return <p>Erro ao carregar versão</p>;
 * 
 *   return (
 *     <div>
 *       <h2>{versionInfo.title}</h2>
 *       <p>{versionInfo.subtitle}</p>
 *     </div>
 *   );
 * }
 */

// ============================================================================
// IMPORTANT: VERSION TRACKING
// ============================================================================

/**
 * After user updates, the version is saved to localStorage:
 * 
 * Key: 'app-version'
 * Value: JSON string of the version info
 * 
 * Example:
 * localStorage.getItem('app-version')
 * => '{"title":"Nova versão disponível","subtitle":"Novos ícones..."}'
 * 
 * If you change the title OR subtitle in version.json, the toast will
 * appear again for all users (because it's different from localStorage).
 * 
 * To reset for testing:
 * 1. Open DevTools -> Application -> LocalStorage
 * 2. Find the app domain
 * 3. Delete the 'app-version' key
 * 4. Hard refresh the page (Ctrl+Shift+R)
 */

// ============================================================================
// DEPLOYMENT WORKFLOW
// ============================================================================

/**
 * 1. Make your code changes and create a new build
 * 
 * 2. Update /public/version.json with your custom message:
 *    {
 *      "title": "Your title here",
 *      "subtitle": "Your subtitle here"
 *    }
 * 
 * 3. Deploy to production
 * 
 * 4. Service Worker will detect the new version
 * 
 * 5. Users will see your custom message when they refresh
 * 
 * 6. After they click "Atualizar", the new version info is saved
 * 
 * 7. If you want to show the message again, change version.json
 */

// ============================================================================
// BEST PRACTICES
// ============================================================================

/**
 * ✓ DO:
 * - Keep messages clear and concise (under 50 characters for title)
 * - Use action-oriented language ("Novos recursos", "Correção de bugs")
 * - Make subtitle descriptive but brief
 * - Update version.json with every meaningful release
 * - Test in development before deploying
 * 
 * ✗ DON'T:
 * - Use complex formatting or HTML tags
 * - Make titles/subtitles too long
 * - Use emojis excessively (one per field max)
 * - Forget to update version.json for critical updates
 * - Leave old messages indefinitely (users will ignore them)
 */

export {};
