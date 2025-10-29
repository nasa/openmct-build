import { PackageJSON } from "@npm/types";
import OpenMctConfiguration, { INSTANCE_PATH } from "../openmct/OpenMctConfiguration";
import path from "path";
import * as fs from 'fs';
import * as child_process from 'child_process';
import NpmPackage from "./NpmPackage";

const PACKAGE_DEFAULTS = {
    private: true,
    license: 'UNLICESNSED'
} as PackageJSON;

export default class NpmPackageManager {
    #fullInstancePath: string;
    #config: OpenMctConfiguration;

    constructor({fullInstancePath, config}: {fullInstancePath: string, config: OpenMctConfiguration}) {
        this.#fullInstancePath = fullInstancePath;
        this.#config = config;
        this.#loadOrCreate();
    }
    async #loadOrCreate() {
        const packageJsonPath = path.join(this.#fullInstancePath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            child_process.spawnSync('npm', ['init', '-y'], { cwd: this.#fullInstancePath });
        }
    }
    installPackage(packageName: string){
        child_process.spawnSync('npm', ['install', '--save-dev', packageName], { cwd: this.#fullInstancePath });
    }
    install() {
        this.installPackage(this.#config.getNpmPackage());

        child_process.spawnSync('npm', ['install'], { cwd: this.#fullInstancePath });
    }
    uninstallPackage(packageName: string) {
        const npmPackage:NpmPackage = this.getPackage(packageName);
        child_process.spawnSync('npm', ['uninstall', npmPackage.getResolvedPackageName()], { cwd: this.#fullInstancePath });
    }
    getPackage(packageName: string): NpmPackage {
        return new NpmPackage({fullInstancePath: this.#fullInstancePath, nameAsConfigured: packageName});
    }

    static getNodePackageManagerForInstance({instance, config}: {instance: string, config: OpenMctConfiguration}): NpmPackageManager {
        const fullInstancePath:string = path.join(INSTANCE_PATH, instance);

        const npmPackage = new NpmPackageManager({fullInstancePath: fullInstancePath, config});
        
        return npmPackage;
    }
}
    
