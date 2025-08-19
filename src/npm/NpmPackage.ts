import * as child_process from 'child_process';
import path from 'path';

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
            const resolvedPackageDetails: child_process.SpawnSyncReturns<string> = child_process.spawnSync('npm', ['view', this.#nameAsConfigured, 'name'], { cwd: this.#fullInstancePath, encoding: 'utf-8' });
            this.#nameAsResolved=resolvedPackageDetails.stdout?.trim();
        }
        return this.#nameAsResolved;
    }
    getEntryPoint(): string {
        if (this.#entryPoint === undefined) {
            const entryPointDetails: child_process.SpawnSyncReturns<string> = child_process.spawnSync('npm', ['view', this.#nameAsConfigured, 'main'], { cwd: this.#fullInstancePath, encoding: 'utf-8' });
            this.#entryPoint = path.join('node_modules', this.getResolvedPackageName(), entryPointDetails.stdout?.trim());
        }
        
        return this.#entryPoint;
    }
}
