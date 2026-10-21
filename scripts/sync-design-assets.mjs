import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const frameworkArg = getArgValue(args, ['--framework', '-f'], 'all');
const assetsDir = getArgValue(args, ['--dir', '--directory'], 'design-assets/icons');
const explicitAsset = getPositionalAsset(args);

const targetPaths = explicitAsset
  ? [explicitAsset]
  : await discoverSvgAssets(assetsDir);

if (targetPaths.length === 0) {
  console.warn(`No SVG assets found in ${assetsDir}. Nothing to generate.`);
  process.exit(0);
}

for (const assetPath of targetPaths) {
  const commandArgs = ['scripts/generate-icon.mjs', assetPath, '--framework', frameworkArg];
  console.log(`Generating output for ${assetPath} (${frameworkArg})`);
  const result = spawnSync(process.execPath, commandArgs, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Generated output for ${targetPaths.length} design asset(s).`);

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

function getPositionalAsset(args) {
  const consumed = new Set();
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--framework' || arg === '-f' || arg === '--dir' || arg === '--directory') {
      consumed.add(i);
      if (i + 1 < args.length) consumed.add(i + 1);
      continue;
    }
    if (arg.startsWith('--framework=') || arg.startsWith('-f=')) {
      consumed.add(i);
      continue;
    }
    if (arg.startsWith('--dir=') || arg.startsWith('--directory=')) {
      consumed.add(i);
      continue;
    }
    if (!arg.startsWith('-') && !consumed.has(i)) {
      return arg;
    }
  }
  return null;
}

async function discoverSvgAssets(directory) {
  const directoryPath = path.resolve(process.cwd(), directory);
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.svg'))
      .map((entry) => path.relative(process.cwd(), path.join(directoryPath, entry.name)))
      .sort();
  } catch {
    return [];
  }
}
