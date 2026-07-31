import path from "path";
import NpmPackage from "./NpmPackage";
import { Manifest } from "pacote";

export default class InstalledNpmPackage extends NpmPackage {
    #fullInstancePath: string;

    constructor({fullInstancePath, nameAsConfigured, manifest}: {fullInstancePath: string, nameAsConfigured: string, manifest: Manifest}) {
        super({nameAsConfigured, manifest});
        this.#fullInstancePath = fullInstancePath;
        this.cwdForNpmCommands = fullInstancePath;
    }

    getInstalledPath(): string {
        return path.join(this.#fullInstancePath, this.getRelativeInstalledPath());
    }

    getRelativeInstalledPath(): string {
        return path.join('node_modules', this.getResolvedPackageName());
    }

}