import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const assetArg = args.find((item) => !item.startsWith('-'));
const frameworkArg = getArgValue(args, '--framework', 'react');

if (!assetArg) {
  console.error('Usage: node scripts/generate-icon.mjs <design-asset.svg> [--framework react|angular|all]');
  process.exit(1);
}

const supportedFrameworks = frameworkArg === 'all' ? ['react', 'angular'] : [frameworkArg];

for (const framework of supportedFrameworks) {
  if (framework === 'react') {
    await generateReactIcon(assetArg);
    continue;
  }

  if (framework === 'angular') {
    await generateAngularIcon(assetArg);
    continue;
  }

  throw new Error(`Unsupported framework: ${framework}. Use react, angular, or all.`);
}

console.log(`Generated design asset output for framework(s): ${supportedFrameworks.join(', ')}`);

async function generateReactIcon(inputPath) {
  const resolvedAssetPath = path.resolve(process.cwd(), inputPath);
  const assetContents = await fs.readFile(resolvedAssetPath, 'utf8');
  const { viewBox, rawSvgContent } = parseSvg(assetContents);
  const name = path.basename(inputPath, '.svg');
  const componentName = `${toPascalCase(name)}Icon`;
  const fileName = `${componentName}.jsx`;
  const storyFileName = `${componentName}.stories.jsx`;
  const iconDir = path.join(process.cwd(), 'src/icons');
  const iconComponentPath = path.join(iconDir, fileName);
  const storyFilePath = path.join(iconDir, storyFileName);
  const indexFilePath = path.join(iconDir, 'index.js');

  const componentSource = `export function ${componentName}({
  size = 24,
  color = 'currentColor',
  title,
  ...props
}) {
  const accessibilityProps = title ? { 'aria-label': title } : { 'aria-hidden': true };

  return (
    <svg
      viewBox="${viewBox}"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...accessibilityProps}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      ${rawSvgContent}
    </svg>
  );
}
`;

  const storySource = `import { ${componentName} } from './${fileName}';

export default {
  title: 'Icons/${componentName}',
  component: ${componentName},
  tags: ['autodocs'],
  args: {
    size: 32,
    color: '#111827',
  },
};

export const Default = {
  args: {},
};
`;

  await fs.mkdir(iconDir, { recursive: true });
  await fs.writeFile(iconComponentPath, componentSource.trim() + '\n', 'utf8');
  await fs.writeFile(storyFilePath, storySource.trim() + '\n', 'utf8');

  const exportLines = await readIndexIfPresent(indexFilePath);
  const existingExports = new Set(exportLines.filter(Boolean));
  existingExports.add(`export { ${componentName} } from './${fileName}';`);
  await fs.writeFile(indexFilePath, `${Array.from(existingExports).sort().join('\n')}\n`, 'utf8');

  console.log(`Generated React icon for ${inputPath}`);
}

async function generateAngularIcon(inputPath) {
  const resolvedAssetPath = path.resolve(process.cwd(), inputPath);
  const assetContents = await fs.readFile(resolvedAssetPath, 'utf8');
  const { viewBox, rawSvgContent } = parseSvg(assetContents);
  const name = path.basename(inputPath, '.svg');
  const componentName = `${toPascalCase(name)}Icon`;
  const directory = path.join(process.cwd(), 'frameworks/angular', `${componentName}`);
  const componentPath = path.join(directory, `${toKebabCase(name)}-icon.component.ts`);
  const storyPath = path.join(directory, `${toKebabCase(name)}-icon.component.stories.ts`);
  const htmlPath = path.join(directory, `${toKebabCase(name)}-icon.component.html`);

  const componentTemplate = `import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-${toKebabCase(name)}-icon',
  standalone: true,
  template: \`
    <svg
      viewBox="${viewBox}"
      [attr.width]="size"
      [attr.height]="size"
      fill="none"
      [attr.stroke]="color"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-label]="title || null"
      [attr.role]="title ? 'img' : 'presentation'"
    >
      <title *ngIf="title">{{ title }}</title>
      ${rawSvgContent}
    </svg>
  \`,
})
export class ${componentName}Component {
  @Input() size = 24;
  @Input() color = 'currentColor';
  @Input() title?: string;
}
`;

  const storyTemplate = `import type { Meta, StoryObj } from '@storybook/angular';
import { ${componentName}Component } from './${toKebabCase(name)}-icon.component';

const meta: Meta<${componentName}Component> = {
  title: 'Angular Icons/${componentName}',
  component: ${componentName}Component,
  args: {
    size: 32,
    color: '#111827',
  },
};

export default meta;
type Story = StoryObj<${componentName}Component>;

export const Default: Story = {};
`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(componentPath, componentTemplate.trim() + '\n', 'utf8');
  await fs.writeFile(htmlPath, `<svg viewBox="${viewBox}" aria-hidden="true"></svg>\n`, 'utf8');
  await fs.writeFile(storyPath, storyTemplate.trim() + '\n', 'utf8');

  console.log(`Generated Angular icon for ${inputPath}`);
}

function parseSvg(svgContents) {
  const svgMatch = svgContents.match(/<svg\s+([^>]*)>/i);

  if (!svgMatch) {
    throw new Error('No <svg> tag found in the asset.');
  }

  const viewBoxMatch = svgMatch[1].match(/viewBox=["']([^"']+)["']/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

  const rawSvgContent = svgContents
    .replace(/^\s*<\?xml.*?\?>\s*/i, '')
    .replace(/^\s*<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim();

  return { viewBox, rawSvgContent };
}

function getArgValue(args, key, fallback) {
  const directIndex = args.indexOf(key);
  if (directIndex >= 0 && args[directIndex + 1]) {
    return args[directIndex + 1];
  }

  const equalsMatch = args.find((item) => item.startsWith(`${key}=`));
  if (equalsMatch) {
    return equalsMatch.split('=')[1];
  }

  return fallback;
}

function toPascalCase(value) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toKebabCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function readIndexIfPresent(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}
