import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// A página do Assistente de Remoção é estática (public/remocao/). A Vercel entrega /remocao/ como
// /remocao/index.html; o servidor do Vite não, e cairia no app. Este middleware faz o mesmo no
// desenvolvimento, no preview e no e2e.
function paginaRemocao(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const [caminho, consulta] = (req.url ?? "").split("?");
    const resto = consulta ? `?${consulta}` : "";
    if (caminho === "/remocao") {
      res.statusCode = 301;
      res.setHeader("Location", `/remocao/${resto}`);
      res.end();
      return;
    }
    if (caminho === "/remocao/") req.url = `/remocao/index.html${resto}`;
    next();
  };
  return {
    name: "pagina-remocao",
    configureServer: (servidor) => {
      servidor.middlewares.use(middleware);
    },
    configurePreviewServer: (servidor) => {
      servidor.middlewares.use(middleware);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // No app publicado, os console.log/debug de depuração são retirados; warn e error ficam.
  esbuild: mode === "production" ? { pure: ["console.log", "console.debug"] } : {},
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    paginaRemocao(),
    react(),
    VitePWA({
      registerType: "prompt",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}", "**/*latin*.woff2"],
        // /remocao/ é a página do Assistente de Remoção (public/remocao/), fora do app: o service
        // worker não a guarda nem responde por ela com o index.html do app.
        globIgnores: ["remocao/**"],
        navigateFallbackDenylist: [/^\/remocao(\/|$)/],
        runtimeCaching: [
          {
            urlPattern: /^\/version\.json$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "version-info-cache",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60,
              },
            },
          },
          {
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-maps-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "escolas-supabase",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
        ],
      },
      manifest: {
        name: "Pra Qual Escola",
        short_name: "Pra Qual Escola",
        description: "Encontre e compare escolas públicas de Pindamonhangaba",
        theme_color: "#164292",
        background_color: "#f6f9fd",
        display: "standalone",
        start_url: "/",
        orientation: "portrait",
        icons: [
          {
            src: "/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
