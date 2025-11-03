import * as child_process from 'child_process';
import path from 'path';
import OpenMctPlugin from '../openmct/OpenMctPlugin';

export default class NpmPackage {
    #fullInstancePath: string;
    #nameAsConfigured: string;
    #nameAsResolved: string | undefined;
    #entryPoint: string | undefined;

    constructor({fullInstancePath, nameAsConfigured}: {fullInstancePath: string, nameAsConfigured: string}) {
        this.#fullInstancePath = fullInstancePath;
        this.#nameAsConfigured = nameAsConfigured;
    }

    getResolvedPackageName(): string {
        if (this.#nameAsResolved === undefined) {
            // First attempt to resolve the package name via package dependencies
            this.#nameAsResolved = this.#resolvePackageNameViaDependencies();
            // If that fails, attempt to resolve it via the npm registry
            if (this.#nameAsResolved === undefined || this.#nameAsResolved === '') {
                this.#nameAsResolved = this.#resolvePackageNameFromRegistry();
            }
        }

        return this.#nameAsResolved ?? this.#nameAsConfigured;
    }
    #resolvePackageNameFromRegistry(): string {
        const resolvedPackageDetails: child_process.SpawnSyncReturns<string> = child_process.spawnSync('npm', ['view', this.#nameAsConfigured, 'name'], { cwd: this.#fullInstancePath, encoding: 'utf-8' });
        return resolvedPackageDetails.stdout?.trim() ?? this.#nameAsConfigured;
    }
    #resolvePackageNameViaDependencies(): string | undefined {
        const resolvedDependencies: child_process.SpawnSyncReturns<string> = child_process.spawnSync('npm', ['pkg', 'get', 'devDependencies'], { cwd: this.#fullInstancePath, encoding: 'utf-8' });
        const dependenciesObject = JSON.parse(resolvedDependencies.stdout?.trim() || '{}');
        const resolvedDependency = Object.entries(dependenciesObject).find(
            ([key, value]): boolean => {
                return (value as string).includes(this.#nameAsConfigured);
            })?.[0];

        return resolvedDependency;
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
        const packageTypeDetails: child_process.SpawnSyncReturns<string> = child_process.spawnSync('npm', ['view', this.#nameAsConfigured, 'type'], { cwd: this.#fullInstancePath, encoding: 'utf-8' });
        return packageTypeDetails.stdout?.trim();
    }
    getNpmEntryPoint(): string | undefined {
        if (this.#entryPoint === undefined) {
            const entryPointDetails: child_process.SpawnSyncReturns<string> = child_process.spawnSync('npm', ['view', this.#nameAsConfigured, 'main'], { cwd: this.#fullInstancePath, encoding: 'utf-8' });
            this.#entryPoint = entryPointDetails.stdout?.trim();
        }
        
        return this.#entryPoint;
    }
}
