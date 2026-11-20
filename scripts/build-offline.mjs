import {createHash} from 'node:crypto';
import {readdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
async function walk(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = await Promise.all(entries.map(entry => entry.isDirectory()
    ? walk(path.join(directory, entry.name)) : path.join(directory, entry.name)));
  return files.flat();
}
const source = await readFile(path.join(root, 'src/offline-worker.js'), 'utf8');
const files = [];
let bytes = 0;
for (const file of (await walk(dist)).sort()) {
  const relative = path.relative(dist, file).split(path.sep).join('/');
  if (relative === 'sw.js' || relative.endsWith('.map')) continue;
  const content = await readFile(file);
  bytes += content.byteLength;
  files.push({path: relative, integrity: `sha256-${createHash('sha256').update(content).digest('base64')}`});
}
if (!files.some(file => file.path === 'index.html')) throw new Error('Build the website before packaging it for offline use.');
const version = createHash('sha256').update(source).update(JSON.stringify(files)).digest('hex').slice(0, 20);
const build = {version, files, bytes};
await writeFile(path.join(dist, 'sw.js'), source.replace('/* OFFLINE_BUILD */', `const BUILD = ${JSON.stringify(build)};`));
console.log(`Offline app: ${files.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB, version ${version}`);
