import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const fileKey = getArgValue(args, ['--file-key', '--fileKey', '-f']) ?? process.env.FIGMA_FILE_KEY ?? '';
const pageNodeId = normalizeNodeId(getArgValue(args, ['--page-node-id', '--pageNodeId', '-p']) ?? process.env.FIGMA_PAGE_NODE_ID ?? '');
const outputDir = getArgValue(args, ['--output-dir', '--dir', '--directory'], 'design-assets/icons');
const frameworkArg = getArgValue(args, ['--framework', '-fw'], 'all');
const token = getArgValue(args, ['--token', '-t']) ?? process.env.FIGMA_TOKEN ?? process.env.FIGMA_PERSONAL_ACCESS_TOKEN ?? '';
const pollForChanges = hasFlag(args, '--poll');
const pollIntervalMs = Number(getArgValue(args, ['--poll-interval'], '5000'));
const maxPolls = Number(getArgValue(args, ['--max-polls'], '10'));
const manifestPath = path.resolve(process.cwd(), '.figma-sync-manifest.json');

await main();

async function main() {
  const manifest = await loadManifest(manifestPath);

  if (!fileKey || !pageNodeId || !token) {
    console.warn('Figma file key, page node id, or token missing. Falling back to local asset sync only.');
    const result = spawnSync(process.execPath, ['scripts/sync-design-assets.mjs', '--framework', frameworkArg], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });
    if (result.error) {
      throw result.error;
    }
    process.exit(result.status ?? 0);
  }

  let fileData;
  if (pollForChanges) {
    fileData = await pollFileForChanges(fileKey, token, pageNodeId, { pollIntervalMs, maxPolls, previousVersion: manifest.version });
  } else {
    fileData = await fetchJson(`https://api.figma.com/v1/files/${fileKey}`, token);
  }

  const targetPage = findNodeById(fileData.document, pageNodeId);
  if (!targetPage) {
    throw new Error(`Page node ${pageNodeId} was not found in Figma file ${fileKey}.`);
  }

  const assetNodeIds = collectAssetNodes(targetPage);
  if (assetNodeIds.length === 0) {
    console.warn(`No exportable child nodes were found under page ${pageNodeId}. Nothing to sync.`);
    return;
  }

  const assetChanges = await fetchChangedAssets(fileKey, token, assetNodeIds, manifest.assets ?? {});

  if (assetChanges.length === 0) {
    console.log(`No Figma changes detected for ${pageNodeId}. Manifest is up-to-date.`);
    manifest.fileKey = fileKey;
    manifest.pageNodeId = pageNodeId;
    manifest.version = fileData.version ?? manifest.version ?? null;
    manifest.lastCheckedAt = new Date().toISOString();
    await writeManifest(manifestPath, manifest);
    return;
  }

  for (const change of assetChanges) {
    const relativePath = path.relative(process.cwd(), path.join(process.cwd(), outputDir, `${toSlug(change.name)}.svg`));
    const targetFile = path.resolve(process.cwd(), outputDir, `${toSlug(change.name)}.svg`);
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, change.svgContent, 'utf8');
    console.log(`Updated ${relativePath}`);
  }

  manifest.fileKey = fileKey;
  manifest.pageNodeId = pageNodeId;
  manifest.version = fileData.version ?? manifest.version ?? null;
  manifest.lastCheckedAt = new Date().toISOString();
  manifest.assets = {
    ...(manifest.assets ?? {}),
    ...Object.fromEntries(assetChanges.map((change) => [change.nodeId, {
      name: change.name,
      nodeId: change.nodeId,
      checksum: change.checksum,
      fileVersion: fileData.version ?? null,
      lastUpdated: new Date().toISOString(),
    }]))
  };

  await writeManifest(manifestPath, manifest);

  const result = spawnSync(process.execPath, ['scripts/sync-design-assets.mjs', '--framework', frameworkArg], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log(`Synced ${assetChanges.length} updated design asset(s) from Figma page ${pageNodeId}.`);
}

async function pollFileForChanges(fileKey, token, pageNodeId, options) {
  const { pollIntervalMs, maxPolls, previousVersion } = options;
  let lastKnownVersion = previousVersion ?? null;

  for (let attempt = 0; attempt < maxPolls; attempt += 1) {
    const fileData = await fetchJson(`https://api.figma.com/v1/files/${fileKey}`, token);
    const version = fileData.version ?? null;
    if (version && (!lastKnownVersion || version !== lastKnownVersion)) {
      return fileData;
    }
    await wait(pollIntervalMs);
  }

  return await fetchJson(`https://api.figma.com/v1/files/${fileKey}`, token);
}

async function fetchChangedAssets(fileKey, token, assetNodeIds, previousAssets) {
  const changed = [];

  for (let i = 0; i < assetNodeIds.length; i += 50) {
    const batch = assetNodeIds.slice(i, i + 50);
    const images = await fetchJson(`https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(batch.join(','))}&format=svg`, token);
    for (const nodeId of batch) {
      const imageUrl = images.images?.[nodeId];
      if (!imageUrl) continue;
      const svgResponse = await fetch(imageUrl);
      if (!svgResponse.ok) {
        throw new Error(`Failed to fetch SVG for node ${nodeId}: ${svgResponse.status}`);
      }
      const svg = await svgResponse.text();
      const normalized = normalizeSvg(svg);
      const checksum = crypto.createHash('sha256').update(normalized).digest('hex');
      const previous = previousAssets?.[nodeId];
      if (!previous || previous.checksum !== checksum) {
        const nodeName = await resolveNodeName(fileKey, token, nodeId) ?? toTitleCaseFromNodeId(nodeId);
        changed.push({ nodeId, name: nodeName, checksum, svgContent: normalized });
      }
    }
  }

  return changed;
}

async function resolveNodeName(fileKey, token, nodeId) {
  try {
    const file = await fetchJson(`https://api.figma.com/v1/files/${fileKey}`, token);
    const node = findNodeById(file.document, nodeId);
    return node?.name ?? toTitleCaseFromNodeId(nodeId);
  } catch {
    return toTitleCaseFromNodeId(nodeId);
  }
}

function normalizeSvg(svg) {
  return svg.replace(/\r\n/g, '\n').trim();
}

function collectAssetNodes(node) {
  const out = [];
  const visit = (current) => {
    if (!current || current.type === 'DOCUMENT') return;
    if (shouldExportNode(current)) {
      out.push(current.id);
    }
    if (Array.isArray(current.children)) {
      for (const child of current.children) visit(child);
    }
  };
  visit(node);
  return [...new Set(out)];
}

function shouldExportNode(node) {
  const exportableTypes = new Set(['COMPONENT', 'INSTANCE', 'FRAME', 'GROUP', 'VECTOR', 'BOOLEAN_OPERATION', 'ELLIPSE', 'LINE', 'REGULAR_POLYGON', 'STAR', 'RECTANGLE', 'TEXT']);
  return exportableTypes.has(node.type) && Boolean(node.name);
}

function findNodeById(root, id) {
  if (!root) return null;
  if (root.id === id) return root;
  if (Array.isArray(root.children)) {
    for (const child of root.children) {
      const match = findNodeById(child, id);
      if (match) return match;
    }
  }
  return null;
}

async function loadManifest(pathName) {
  try {
    const content = await fs.readFile(pathName, 'utf8');
    return JSON.parse(content);
  } catch {
    return { fileKey: '', pageNodeId: '', version: null, lastCheckedAt: null, assets: {} };
  }
}

async function writeManifest(pathName, manifest) {
  await fs.writeFile(pathName, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

function getArgValue(args, keys, fallback) {
  for (const key of keys) {
    const index = args.indexOf(key);
    if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('-')) {
      return args[index + 1];
    }
    const eq = args.find((item) => item.startsWith(`${key}=`));
    if (eq) {
      return eq.split('=').slice(1).join('=');
    }
  }
  return fallback;
}

function hasFlag(args, flag) {
  return args.includes(flag) || args.some((item) => item.startsWith(`${flag}=`));
}

function normalizeNodeId(value) {
  if (!value) return value;
  return value.replace(/-/g, ':');
}

function toSlug(value) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'icon';
}

function toTitleCaseFromNodeId(nodeId) {
  return nodeId
    .split(/[:/]/)
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9]+/g, ' '))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim() || 'icon';
}

async function wait(durationMs) {
  await new Promise((resolve) => setTimeout(resolve, durationMs));
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': token,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Figma request failed for ${url}: ${response.status} ${errorText}`);
  }

  return response.json();
}
