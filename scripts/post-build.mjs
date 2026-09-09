#!/usr/bin/env node

/**
 * Finishes the `dist` build produced by `tsc -p tsconfig.build.json`.
 *
 * tsc only emits JavaScript, but the CLI also reads non-TypeScript files at
 * runtime (the base YAML config, the index.html template, the configuration
 * schema, and everything under src/assets that gets copied into an instance).
 * Those are copied here so that dist/src mirrors src. The compiled entry point
 * also gets a `node` shebang and the executable bit, since the source file's
 * shebang runs it through tsx.
 */

import { chmodSync, cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const srcDir = join(projectRoot, 'src');
const distSrcDir = join(projectRoot, 'dist', 'src');
const entryPoint = join(projectRoot, 'dist', 'scripts', 'mct.js');

function copyNonTypeScriptFiles(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const fullPath = join(directory, entry.name);

        if (entry.isDirectory()) {
            // Assets are copied verbatim into built instances, so keep the directory intact.
            if (fullPath === join(srcDir, 'assets')) {
                cpSync(fullPath, join(distSrcDir, 'assets'), { recursive: true });
            } else if (fullPath !== join(srcDir, 'test')) {
                copyNonTypeScriptFiles(fullPath);
            }
        } else if (!entry.name.endsWith('.ts')) {
            const destination = join(distSrcDir, relative(srcDir, fullPath));

            mkdirSync(dirname(destination), { recursive: true });
            cpSync(fullPath, destination);
        }
    }
}

copyNonTypeScriptFiles(srcDir);

const compiledEntryPoint = readFileSync(entryPoint, 'utf-8');
writeFileSync(entryPoint, compiledEntryPoint.replace(/^#!.*\n/, '#!/usr/bin/env node\n'));
chmodSync(entryPoint, 0o755);

console.log('✅ Build assets copied to dist');
