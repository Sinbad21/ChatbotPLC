import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const inputDir = path.join(root, 'apps', 'web', 'public', 'landing-new', 'personas');

const files = [
  { in: 'salesman.png', out: 'salesman.png.svg' },
  { in: 'real-estate.png', out: 'real-estate.png.svg' },
  { in: 'customer-success.png', out: 'customer-success.png.svg' },
];

function svgWrapPngBase64(base64Png) {
  // 3:4 viewBox (matches 768x1024 portrait assets).
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 1024">' +
    `<image href="data:image/png;base64,${base64Png}" x="0" y="0" width="768" height="1024" preserveAspectRatio="xMidYMid slice"/>` +
    '</svg>'
  );
}

async function main() {
  await fs.mkdir(inputDir, { recursive: true });

  const missing = [];
  for (const f of files) {
    try {
      await fs.access(path.join(inputDir, f.in));
    } catch {
      missing.push(f.in);
    }
  }

  if (missing.length) {
    console.error('Missing input PNGs in: ' + inputDir);
    for (const m of missing) console.error('- ' + m);
    process.exit(2);
  }

  const results = [];
  for (const f of files) {
    const inPath = path.join(inputDir, f.in);
    const outPath = path.join(inputDir, f.out);

    const buf = await fs.readFile(inPath);
    const base64 = buf.toString('base64');

    const svg = svgWrapPngBase64(base64);
    await fs.writeFile(outPath, svg, 'utf8');

    results.push({ inPath, outPath, bytes: buf.length });
  }

  console.log('Generated embedded SVG wrappers:');
  for (const r of results) {
    console.log(`- ${path.relative(root, r.outPath)} (from ${path.basename(r.inPath)}, ${r.bytes} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
