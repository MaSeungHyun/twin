import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const input = process.argv[2]
const output =
  process.argv[3] ??
  input?.replace(/\.glb$/i, '') + '-opt.glb'

if (!input) {
  console.error('Usage: npm run optimize:glb -- <input.glb> [output.glb]')
  process.exit(1)
}

const inputPath = resolve(input)
if (!existsSync(inputPath)) {
  console.error(`File not found: ${inputPath}`)
  process.exit(1)
}

const outputPath = resolve(output)

const args = [
  'gltf-transform',
  'optimize',
  inputPath,
  outputPath,
  '--compress',
  'meshopt',
  '--texture-compress',
  'etc1s',
  '--texture-size',
  '2048',
  '--flatten',
  'true',
  '--join',
  'true',
  '--prune',
  'true',
]

console.log('Optimizing:', inputPath)
console.log('Output:  ', outputPath)
console.log('  - meshopt geometry')
console.log('  - KTX2 (ETC1S) textures, max 2048px')
console.log('  - flatten / join / prune')

const result = spawnSync('npx', args, { stdio: 'inherit', shell: true })
process.exit(result.status ?? 1)
