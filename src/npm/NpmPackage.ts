import fs from 'fs';
import path from 'path';
import OpenMctPlugin from '../openmct/OpenMctPlugin';
import { Manifest } from 'pacote';

export default class NpmPackage {
    protected cwdForNpmCommands: string;
    protected nameAsConfigured: string;
    protected nameAsResolved: string | undefined;
    protected entryPoint: string | undefined;
    protected pathToEntryPoint: string | undefined;
    protected manifest: Manifest;

    constructor({nameAsConfigured, manifest}: {nameAsConfigured: string, manifest: Manifest}) {
        this.nameAsConfigured = nameAsConfigured;
        this.cwdForNpmCommands = process.cwd();
        this.manifest = manifest;
    }

    getConfiguredPackageName(): string {
        return this.nameAsConfigured;
    }

    getResolvedPackageName(): string {
        return this.manifest.name;
    }

    getPathToEntryPoint(plugin: OpenMctPlugin): string {
        if (this.pathToEntryPoint !== undefined) {
            return this.pathToEntryPoint;
        }

        const resolvedEntryPoint:string = plugin.getEntryPoint() || this.getNpmEntryPoint();
        const pathToEntryPoint = path.join('node_modules', this.getResolvedPackageName(), resolvedEntryPoint);

        if (!fs.existsSync(path.join(this.cwdForNpmCommands, pathToEntryPoint))) {
            throw new Error(`Unable to resolve entry point for ${plugin.getName()}`);
        } else {
            this.pathToEntryPoint = pathToEntryPoint;
            return this.pathToEntryPoint;
        }
    }

    getPackageType(): string | undefined {
        return this.manifest.type as string | undefined;
    }

    getNpmEntryPoint(): string {
        if (this.manifest.main === undefined) {
            console.warn(`Package ${this.nameAsConfigured} as no 'main' script specified. Defaulting to index.js`);
        }
        return this.manifest.main || 'index.js';
    }
}
