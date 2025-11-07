import * as child_process from 'child_process';
import path from 'path';
import OpenMctPlugin from '../openmct/OpenMctPlugin';

export default class NpmPackage {
    protected cwdForNpmCommands: string;
    protected nameAsConfigured: string;
    protected nameAsResolved: string | undefined;
    #entryPoint: string | undefined;

    constructor({nameAsConfigured}: {nameAsConfigured: string}) {
        this.nameAsConfigured = nameAsConfigured;
        this.cwdForNpmCommands = process.cwd();
    }

    getConfiguredPackageName(): string {
        return this.nameAsConfigured;
    }

    getResolvedPackageName(): string {
        if (this.nameAsResolved === undefined) {
            const resolvedPackageDetails: child_process.SpawnSyncReturns<string> = child_process.spawnSync('npm', ['view', this.nameAsConfigured, 'name'], { cwd: this.cwdForNpmCommands, encoding: 'utf-8' });
            this.nameAsResolved = resolvedPackageDetails.stdout?.trim() ?? this.nameAsConfigured;
        }

        return this.nameAsResolved;
    }

    getResolvedEntryPoint(plugin: OpenMctPlugin): string {
        const configuredEntryPoint = plugin.getEntryPoint();
        let resolvedEntryPoint: string | undefined;

        if (configuredEntryPoint !== undefined) {
            resolvedEntryPoint = configuredEntryPoint;
        } else {
            resolvedEntryPoint = this.getNpmEntryPoint();
        }
        if (resolvedEntryPoint === undefined) {
            throw new Error('Could not determine entry point for plugin ' + plugin.getName());
        } else {
            return path.join('node_modules', this.getResolvedPackageName(), resolvedEntryPoint);
        }
        
    }
    getPackageType(): string | undefined {
        const packageTypeDetails: child_process.SpawnSyncReturns<string> = child_process.spawnSync('npm', ['view', this.nameAsConfigured, 'type'], { cwd: this.cwdForNpmCommands, encoding: 'utf-8' });
        return packageTypeDetails.stdout?.trim();
    }
    getNpmEntryPoint(): string | undefined {
        if (this.#entryPoint === undefined) {
            const entryPointDetails: child_process.SpawnSyncReturns<string> = child_process.spawnSync('npm', ['view', this.nameAsConfigured, 'main'], { cwd: this.cwdForNpmCommands, encoding: 'utf-8' });
            this.#entryPoint = entryPointDetails.stdout?.trim();
        }
        
        return this.#entryPoint;
    }
}
