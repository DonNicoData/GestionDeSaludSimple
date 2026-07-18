// Genera los PNGs del PWA a partir del SVG maestro.
// Una sola vez por cambio de icono (no se ejecuta en build).
// Output:
//   public/icons/pwa-192x192.png         — icono estándar 192
//   public/icons/pwa-512x512.png         — icono estándar 512
//   public/icons/pwa-maskable-512x512.png — maskable (mismo diseño, contenido en safe zone)
//   public/icons/apple-touch-icon.png    — iOS "Add to Home Screen" 180
//
// Uso: node scripts/generate-pwa-icons.mjs
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const SOURCE = path.join(PROJECT_ROOT, 'public', 'icons', 'leaf-source.svg')
const OUT_DIR = path.join(PROJECT_ROOT, 'public', 'icons')

const TARGETS = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'pwa-maskable-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

const svgBuffer = await fs.readFile(SOURCE)

for (const target of TARGETS) {
  const outPath = path.join(OUT_DIR, target.file)
  const pipeline = sharp(svgBuffer).resize({
    width: target.size,
    height: target.size,
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  const pngBuffer = await pipeline.png({ compressionLevel: 9 }).toBuffer()
  await fs.writeFile(outPath, pngBuffer)
  console.log(`✓ ${path.relative(PROJECT_ROOT, outPath)} (${target.size}×${target.size})`)
}
