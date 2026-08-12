import { cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();

const assets = [
    ['src/prompts', 'dist/prompts'],
    ['src/templates', 'dist/templates'],
];

for (const [source, destination] of assets) {
    const sourcePath = join(root, source);
    const destinationPath = join(root, destination);

    await mkdir(destinationPath, {
        recursive: true,
    });

    await cp(sourcePath, destinationPath, {
        recursive: true,
        force: true,
    });

    console.log(`Copied ${source} -> ${destination}`);
}