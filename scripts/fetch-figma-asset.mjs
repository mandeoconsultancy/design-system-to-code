import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const fileKey = getArgValue(args, ['--file-key', '--fileKey', '-f']) ?? process.env.FIGMA_FILE_KEY;
const nodeId = normalizeNodeId(getArgValue(args, ['--node-id', '--nodeId', '-n']) ?? process.env.FIGMA_NODE_ID);
const output = getArgValue(args, ['--output', '-o']) ?? process.env.FIGMA_OUTPUT_PATH ?? 'design-assets/icons/upload-cloud.svg';
const token = getArgValue(args, ['--token', '-t']) ?? process.env.FIGMA_TOKEN ?? process.env.FIGMA_PERSONAL_ACCESS_TOKEN;

if (!fileKey || !nodeId) {
  console.error('Missing Figma inputs. Use --file-key and --node-id or set FIGMA_FILE_KEY and FIGMA_NODE_ID.');
  process.exit(1);
}

if (!token) {
  console.error('Missing Figma token. Set FIGMA_TOKEN or pass --token <token>.');
  process.exit(1);
}

const response = await fetch(`https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=svg&scale=1`, {
  headers: {
    'X-Figma-Token': token,
    Accept: 'application/json',
  },
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`Figma image request failed (${response.status}): ${body}`);
}

const data = await response.json();
const imageUrl = data.images?.[nodeId];

if (!imageUrl) {
  throw new Error(`No Figma image URL returned for node ${nodeId}. Check the file key and node ID.`);
}

const svgResponse = await fetch(imageUrl);
if (!svgResponse.ok) {
  throw new Error(`Failed to download exported SVG (${svgResponse.status})`);
}

const svgContent = await svgResponse.text();
const outputFile = path.resolve(process.cwd(), output);
await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, svgContent, 'utf8');

console.log(`Downloaded Figma asset to ${outputFile}`);

function getArgValue(args, keys, fallback) {
  for (const key of keys) {
    const index = args.indexOf(key);
    if (index >= 0 && args[index + 1]) {
      return args[index + 1];
    }
    const eq = args.find((item) => item.startsWith(`${key}=`));
    if (eq) {
      return eq.split('=').slice(1).join('=');
    }
  }
  return fallback;
}

function normalizeNodeId(nodeId) {
  if (!nodeId) return nodeId;
  return nodeId.replace(/-/g, ':');
}
