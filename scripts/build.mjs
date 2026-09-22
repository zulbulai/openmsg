import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

async function buildAll() {
  console.log('[OpenMsg Build] Starting Chrome Extension build...');

  // 1. Clean dist directory
  const distDir = resolve(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // 2. Build Background Service Worker (ES module) & Options page
  console.log('[OpenMsg Build] 1/3: Building background and options...');
  await build({
    configFile: false,
    plugins: [react()],
    resolve: {
      alias: { '@': resolve(rootDir, 'src') },
    },
    esbuild: {
      charset: 'ascii',
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      target: 'es2022',
      rollupOptions: {
        input: {
          options: resolve(rootDir, 'options.html'),
          background: resolve(rootDir, 'src/background/index.ts'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'background') return 'background.js';
            return 'assets/[name]-[hash].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
  });

  // 3. Build Content Script as self-contained IIFE (NO ES imports, Chrome MV3 compliant)
  console.log('[OpenMsg Build] 2/3: Building content script (IIFE standalone)...');
  await build({
    configFile: false,
    plugins: [react()],
    resolve: {
      alias: { '@': resolve(rootDir, 'src') },
    },
    esbuild: {
      charset: 'ascii',
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      target: 'es2022',
      rollupOptions: {
        input: resolve(rootDir, 'src/content/index.tsx'),
        output: {
          format: 'iife',
          name: 'OpenMsgContentScript',
          entryFileNames: 'content.js',
          inlineDynamicImports: true,
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'content.css';
            }
            return 'assets/[name]-[hash].[ext]';
          },
        },
      },
    },
  });

  // 4. Build Injected Bridge Script as self-contained IIFE
  console.log('[OpenMsg Build] 3/3: Building injected bridge script (IIFE standalone)...');
  await build({
    configFile: false,
    resolve: {
      alias: { '@': resolve(rootDir, 'src') },
    },
    esbuild: {
      charset: 'ascii',
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      target: 'es2022',
      rollupOptions: {
        input: resolve(rootDir, 'src/injected/whatsapp-bridge.ts'),
        output: {
          format: 'iife',
          name: 'OpenMsgInjectedBridge',
          entryFileNames: 'injected.js',
          inlineDynamicImports: true,
        },
      },
    },
  });

  // Prepend WPPConnect WA-JS engine to injected.js so window.WPP is initialized in WhatsApp Web's page context
  const wppBundlePath = resolve(rootDir, 'node_modules/@wppconnect/wa-js/dist/wppconnect-wa.js');
  const injectedPath = resolve(distDir, 'injected.js');
  if (fs.existsSync(wppBundlePath) && fs.existsSync(injectedPath)) {
    const wppCode = fs.readFileSync(wppBundlePath, 'utf-8');
    const bridgeCode = fs.readFileSync(injectedPath, 'utf-8');
    fs.writeFileSync(
      injectedPath,
      `/* WPPConnect WA-JS Runtime */\n${wppCode}\n;\n/* OpenMsg Bridge Dispatcher */\n${bridgeCode}`,
      'utf-8'
    );
    console.log('[OpenMsg Build] Successfully combined WA-JS engine and bridge into dist/injected.js');
  }

  // 5. Copy manifest.json and icons
  console.log('[OpenMsg Build] Copying manifest.json and public assets...');
  fs.copyFileSync(resolve(rootDir, 'manifest.json'), resolve(distDir, 'manifest.json'));

  // Ensure dist/content.css exists for manifest.json content_scripts
  const assetsDir = resolve(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const cssFile = fs.readdirSync(assetsDir).find((f) => f.endsWith('.css'));
    if (cssFile) {
      fs.copyFileSync(resolve(assetsDir, cssFile), resolve(distDir, 'content.css'));
      console.log(`[OpenMsg Build] Copied ${cssFile} to dist/content.css`);
    }
  }

  // Copy all public assets recursively (vendor, src/bridge, icons, logo, etc.)
  function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    if (fs.statSync(src).isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      for (const item of fs.readdirSync(src)) {
        copyRecursive(resolve(src, item), resolve(dest, item));
      }
    } else {
      fs.mkdirSync(dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }

  const publicDir = resolve(rootDir, 'public');
  if (fs.existsSync(publicDir)) {
    copyRecursive(publicDir, distDir);
    console.log('[OpenMsg Build] Copied public assets recursively.');
  }

  console.log('[OpenMsg Build] ✓ Build successfully completed! All bundles are valid for Chrome MV3.');
}

buildAll().catch((err) => {
  console.error('[OpenMsg Build] Build failed:', err);
  process.exit(1);
});
