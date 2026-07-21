// Reemplaza los íconos y splash default de Capacitor iOS con la hoja de la PWA.
// Genera los assets PNG desde public/icons/leaf-source.svg.
//
// Slots iOS usados (definidos en ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json):
//   - AppIcon-512@2x.png  → 1024x1024 (ícono universal moderno, único slot)
//
// Splash (ios/App/App/Assets.xcassets/Splash.imageset/Contents.json):
//   - splash-2732x2732.png     (3x, dispositivos modernos)
//   - splash-2732x2732-1.png   (2x, dispositivos viejos)
//   - splash-2732x2732-2.png   (1x, fallback)
//
// Diseño:
//   - Ícono: fondo verde #4CAF7C + hoja blanca centrada (igual que PWA)
//   - Splash: fondo verde sólido + hoja blanca centrada (sin padding iOS porque el sistema lo agrega)
//
// Idempotente y rerunnable.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const SOURCE = path.join(PROJECT_ROOT, 'public', 'icons', 'leaf-source.svg')
const ASSETS = path.join(
  PROJECT_ROOT,
  'ios',
  'App',
  'App',
  'Assets.xcassets',
)

const ICON_DIR = path.join(ASSETS, 'AppIcon.appiconset')
const SPLASH_DIR = path.join(ASSETS, 'Splash.imageset')

const ICON_SIZE = 1024
const SPLASH_SIZE = 2732

const leafSvg = await fs.readFile(SOURCE)

// ────────────────────────── Ícono ──────────────────────────
const icon = await sharp(leafSvg)
  .resize({ width: ICON_SIZE, height: ICON_SIZE })
  .png()
  .toBuffer()
await fs.writeFile(path.join(ICON_DIR, 'AppIcon-512@2x.png'), icon)
console.log(`✓ AppIcon.appiconset/AppIcon-512@2x.png (${ICON_SIZE}x${ICON_SIZE})`)

// ────────────────────────── Splash ──────────────────────────
// Construimos el splash via SVG inline para tener fondo verde sólido + hoja
const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SPLASH_SIZE} ${SPLASH_SIZE}" width="${SPLASH_SIZE}" height="${SPLASH_SIZE}">
  <rect width="${SPLASH_SIZE}" height="${SPLASH_SIZE}" fill="#4CAF7C"/>
  <g transform="translate(${SPLASH_SIZE / 2}, ${SPLASH_SIZE / 2}) scale(${SPLASH_SIZE / 512})">
    <g transform="rotate(-45)">
      <ellipse cx="0" cy="0" rx="156" ry="68" fill="#FAF8F5"/>
      <line x1="-156" y1="0" x2="156" y2="0" stroke="#4CAF7C" stroke-width="6" stroke-linecap="round"/>
    </g>
  </g>
</svg>
`

const splash = await sharp(Buffer.from(splashSvg))
  .resize({ width: SPLASH_SIZE, height: SPLASH_SIZE })
  .png()
  .toBuffer()

// iOS espera los 3 archivos idénticos (convención de Capacitor); sobreescribimos los 3.
await fs.writeFile(path.join(SPLASH_DIR, 'splash-2732x2732.png'), splash)
await fs.writeFile(path.join(SPLASH_DIR, 'splash-2732x2732-1.png'), splash)
await fs.writeFile(path.join(SPLASH_DIR, 'splash-2732x2732-2.png'), splash)
console.log(`✓ Splash.imageset/splash-2732x2732{,-1,-2}.png (${SPLASH_SIZE}x${SPLASH_SIZE})`)

console.log('\nListo. Rebuild del IPA para ver los cambios:')
console.log('  git commit -am "feat(fase12): íconos iOS hoja verde"')
console.log('  git push origin main  # dispara workflow ios-build.yml')
