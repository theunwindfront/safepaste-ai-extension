import { cp, mkdir, rm } from 'node:fs/promises';
import { watch } from 'node:fs';

const root = new URL('../', import.meta.url);
const src = new URL('src/', root);
const dist = new URL('dist/', root);
const icons = new URL('../assets/icons/', root);
const fonts = new URL('node_modules/geist/dist/fonts/', root);
const args = new Set(process.argv.slice(2));

async function build() {
  const started = performance.now();
  await rm(dist, { recursive: true, force: true });
  await cp(src, dist, { recursive: true });
  await cp(icons, new URL('icons/', dist), { recursive: true });
  await mkdir(new URL('fonts/', dist), { recursive: true });
  await cp(new URL('geist-sans/Geist-Variable.woff2', fonts), new URL('fonts/Geist-Variable.woff2', dist));
  await cp(new URL('geist-mono/GeistMono-Variable.woff2', fonts), new URL('fonts/GeistMono-Variable.woff2', dist));
  console.log(`Built dist/ in ${Math.round(performance.now() - started)} ms`);
}

await build();

if (args.has('--watch')) {
  let timer = null;
  watch(src, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => build().catch((err) => console.error(err.message)), 100);
  });
  console.log('Watching src/ for changes…');
}
