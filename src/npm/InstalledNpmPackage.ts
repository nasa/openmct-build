import path from "path";
import * as fs from 'fs';
import NpmPackage from "./NpmPackage";
import * as child_process from 'child_process';

export default class InstalledNpmPackage extends NpmPackage {
    #fullInstancePath: string;
    #nameAsResolved: string | undefined;
    #installedManifest: {main?: string, type?: string} | undefined;

    constructor({fullInstancePath, nameAsConfigured}: {fullInstancePath: string, nameAsConfigured: string}) {
        super({nameAsConfigured});
        this.#fullInstancePath = fullInstancePath;
        this.cwdForNpmCommands = fullInstancePath;
    }

    // Read metadata from the installed package on disk rather than via `npm view`.
    // `npm view` only resolves registry packages and local directories; it returns
    // a 404 for local tarball (.tgz) specs, which breaks tarball-based recipes.
    #readInstalledManifest(): {main?: string, type?: string} {
        if (this.#installedManifest === undefined) {
            const manifestPath = path.join(this.getInstalledPath(), 'package.json');
            try {
                this.#installedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            } catch {
                this.#installedManifest = {};
            }
        }

        return this.#installedManifest ?? {};
    }

    getNpmEntryPoint(): string | undefined {
        return this.#readInstalledManifest().main ?? super.getNpmEntryPoint();
    }

    getPackageType(): string | undefined {
        return this.#readInstalledManifest().type ?? super.getPackageType();
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
        const targetPath = this.#resolveSpecToRealPath(this.nameAsConfigured);
        const resolvedDependency = Object.entries(dependenciesObject).find(
            ([key, value]): boolean => {
                const spec = value as string;
                // Local file/tarball specs may be stored relative while the configured
                // name is absolute (or vice versa); compare them by resolved real path.
                if (targetPath !== undefined) {
                    const candidatePath = this.#resolveSpecToRealPath(spec);
                    if (candidatePath !== undefined && candidatePath === targetPath) {
                        return true;
                    }
                }
                // Fall back to a substring match for registry/version specs.
                return spec.includes(this.nameAsConfigured);
            })?.[0];

        return resolvedDependency;
    }

    // Resolve a local `file:`/relative/absolute path spec to an absolute real path.
    // Returns undefined for non-path specs (e.g. registry versions like `openmct@1.0.0`).
    #resolveSpecToRealPath(spec: string): string | undefined {
        const match = spec.match(/^(?:file:)?((?:\.{1,2}[/\\]|[/\\]).*)$/);
        if (match === null) {
            return undefined;
        }
        const resolved = path.resolve(this.#fullInstancePath, match[1]);
        try {
            return fs.realpathSync(resolved);
        } catch {
            return resolved;
        }
    }
}