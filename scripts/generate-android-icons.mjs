// Reemplaza los iconos default de Capacitor con la hoja de la PWA.
// Genera todos los assets PNG para los mipmaps Android desde
// public/icons/leaf-source.svg.
//
// - ic_launcher_foreground.png  → solo la hoja blanca (adaptive icon foreground)
// - ic_launcher.png             → ícono legacy cuadrado (verde + hoja)
// - ic_launcher_round.png       → ícono legacy circular (verde + hoja en círculo)
//
// Tamaños por densidad:
//   mdpi 48 / hdpi 72 / xhdpi 96 / xxhdpi 144 / xxxhdpi 192
//   (foreground es 3x más grande: 108/162/216/324/432)
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const SOURCE = path.join(PROJECT_ROOT, 'public', 'icons', 'leaf-source.svg')
const FG_SOURCE = path.join(__dirname, 'leaf-foreground.svg')
const RES = path.join(PROJECT_ROOT, 'android', 'app', 'src', 'main', 'res')

const DENSITIES = [
  { name: 'mdpi', size: 48, fgSize: 108 },
  { name: 'hdpi', size: 72, fgSize: 162 },
  { name: 'xhdpi', size: 96, fgSize: 216 },
  { name: 'xxhdpi', size: 144, fgSize: 324 },
  { name: 'xxxhdpi', size: 192, fgSize: 432 },
]

const squareSvg = await fs.readFile(SOURCE)
const fgSvg = await fs.readFile(FG_SOURCE)

// Construye una máscara circular RGBA como PNG (blanco dentro del círculo, transparente afuera)
async function circleMask(size) {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`,
      ),
    }])
    .png()
    .toBuffer()
}

for (const d of DENSITIES) {
  const dir = path.join(RES, `mipmap-${d.name}`)

  // Legacy square: SVG completo (verde + hoja), renderizado al tamaño del mipmap
  const square = await sharp(squareSvg).resize({ width: d.size, height: d.size }).png().toBuffer()
  await fs.writeFile(path.join(dir, 'ic_launcher.png'), square)

  // Legacy round: square enmascarado con un círculo
  const mask = await circleMask(d.size)
  const rounded = await sharp(square)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
  await fs.writeFile(path.join(dir, 'ic_launcher_round.png'), rounded)

  // Adaptive foreground: solo hoja blanca, fondo transparente, 3x tamaño
  const fg = await sharp(fgSvg).resize({ width: d.fgSize, height: d.fgSize }).png().toBuffer()
  await fs.writeFile(path.join(dir, 'ic_launcher_foreground.png'), fg)

  console.log(`✓ mipmap-${d.name}/  ic_launcher(${d.size}) + round(${d.size}) + foreground(${d.fgSize})`)
}
