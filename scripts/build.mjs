import { execFile } from 'node:child_process';
import { watch } from 'node:fs';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = new URL('../', import.meta.url);
const src = new URL('src/', root);
const dist = new URL('dist/', root);
const styles = fileURLToPath(new URL('styles', src));
const icons = new URL('../assets/icons/', root);
const fonts = new URL('node_modules/geist/dist/fonts/', root);
const tailwind = fileURLToPath(new URL('node_modules/.bin/tailwindcss', root));
const args = new Set(process.argv.slice(2));

async function css(input, output, { shadow = false } = {}) {
  const out = new URL(output, dist);
  await run(tailwind, ['-i', fileURLToPath(new URL(input, src)), '-o', fileURLToPath(out), '--minify']);
  if (!shadow) return;
  const code = await readFile(out, 'utf8');
  const defaults = [...code.matchAll(/@property (--tw-[\w-]+)\{[^}]*?initial-value:([^;}]+)/g)].map(
    ([, name, value]) => `${name}:${value}`,
  );
  if (defaults.length) await writeFile(out, `${code}:host,*,::before,::after{${defaults.join(';')}}`);
}

async function build() {
  const started = performance.now();
  await rm(dist, { recursive: true, force: true });
  await cp(src, dist, { recursive: true, filter: (file) => !file.startsWith(styles) });
  await cp(icons, new URL('icons/', dist), { recursive: true });
  await mkdir(new URL('fonts/', dist), { recursive: true });
  await cp(new URL('geist-sans/Geist-Variable.woff2', fonts), new URL('fonts/Geist-Variable.woff2', dist));
  await cp(new URL('geist-mono/GeistMono-Variable.woff2', fonts), new URL('fonts/GeistMono-Variable.woff2', dist));
  await css('styles/pages.css', 'shared/pages.css');
  await css('styles/content.css', 'content/ui.css', { shadow: true });
  console.log(`Built dist/ in ${Math.round(performance.now() - started)} ms`);
}

async function zip() {
  const file = new URL('manifest.json', dist);
  const original = await readFile(file, 'utf8');
  const { key, ...manifest } = JSON.parse(original);
  const name = `safepaste-${manifest.version}.zip`;
  try {
    await writeFile(file, JSON.stringify(manifest, null, 2));
    await rm(new URL(name, root), { force: true });
    await run('zip', ['-r', '-X', '-q', `../${name}`, '.'], { cwd: fileURLToPath(dist) });
    console.log(`Wrote ${name}`);
  } finally {
    await writeFile(file, original);
  }
}

async function release() {
  const { version } = JSON.parse(await readFile(new URL('manifest.json', dist), 'utf8'));
  const folder = `safepaste-${version}`;
  const name = `${folder}-unpacked.zip`;
  const stage = new URL('release/', root);
  try {
    await rm(stage, { recursive: true, force: true });
    await cp(dist, new URL(`${folder}/`, stage), { recursive: true });
    await rm(new URL(name, root), { force: true });
    await run('zip', ['-r', '-X', '-q', `../${name}`, folder], { cwd: fileURLToPath(stage) });
    console.log(`Wrote ${name}`);
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}

await build();
if (args.has('--zip')) await zip();
if (args.has('--release')) await release();

if (args.has('--watch')) {
  let timer = null;
  watch(src, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => build().catch((err) => console.error(err.message)), 100);
  });
  console.log('Watching src/ for changes…');
}
