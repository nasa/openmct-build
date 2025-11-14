import path from "path";
import NpmPackage from "./NpmPackage";
import * as child_process from 'child_process';

export default class InstalledNpmPackage extends NpmPackage {
    #fullInstancePath: string;
    #nameAsResolved: string | undefined;

    constructor({fullInstancePath, nameAsConfigured}: {fullInstancePath: string, nameAsConfigured: string}) {
        super({nameAsConfigured});
        this.#fullInstancePath = fullInstancePath;
        this.cwdForNpmCommands = fullInstancePath;
    }

    getResolvedPackageName(): string {
        if (this.#nameAsResolved === undefined) {
            // First attempt to resolve the package name via package dependencies
            this.#nameAsResolved = this.#resolvePackageNameViaDependencies();
            // If that fails, attempt to resolve it via the npm registry
            if (this.#nameAsResolved === undefined || this.#nameAsResolved === '') {
                this.#nameAsResolved = super.getResolvedPackageName();
            }
        }

        return this.#nameAsResolved ?? this.nameAsConfigured;
    }

    getInstalledPath(): string {
        return path.join(this.#fullInstancePath, this.getRelativeInstalledPath());
    }

    getRelativeInstalledPath(): string {
        return path.join('node_modules', this.getResolvedPackageName());
    }

    #resolvePackageNameViaDependencies(): string | undefined {
        const resolvedDependencies: child_process.SpawnSyncReturns<string> = child_process.spawnSync('npm', ['pkg', 'get', 'devDependencies'], { cwd: this.#fullInstancePath, encoding: 'utf-8' });
        const dependenciesObject = JSON.parse(resolvedDependencies.stdout?.trim() || '{}');
        const resolvedDependency = Object.entries(dependenciesObject).find(
            ([key, value]): boolean => {
                return (value as string).includes(this.nameAsConfigured);
            })?.[0];

        return resolvedDependency;
    }
}