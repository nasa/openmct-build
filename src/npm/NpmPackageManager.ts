import { PackageJSON } from "@npm/types";
import OpenMctConfiguration from "../openmct/OpenMctConfiguration";
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
    #packageJsonObject: PackageJSON | undefined;
    #config: OpenMctConfiguration;

    constructor({fullInstancePath, config}: {fullInstancePath: string, config: OpenMctConfiguration}) {
        this.#fullInstancePath = fullInstancePath;
        this.#config = config;
        this.#loadOrCreate();
    }
    #loadOrCreate() {
        const packageJsonPath = path.join(this.#fullInstancePath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            child_process.spawnSync('npm', ['init', '-y'], { cwd: this.#fullInstancePath });
        }

        const packageOnDisk = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJSON;
        this.#packageJsonObject = this.#applyDefaults(packageOnDisk);
    }
    #applyDefaults(packageObject: PackageJSON) {
        packageObject = Object.assign(packageObject, PACKAGE_DEFAULTS);

        return packageObject;
    }
    installPackage(packageName: string){
        child_process.spawnSync('npm', ['install', '--save-dev', packageName], { cwd: this.#fullInstancePath });
    }
    install() {
        const openMctPackageName = `openmct@${this.#config.getOpenMctVersion()}`;
        this.installPackage(openMctPackageName);

        child_process.spawnSync('npm', ['install'], { cwd: this.#fullInstancePath });
    }
    getPackage(packageName: string): NpmPackage {
        return new NpmPackage({fullInstancePath: this.#fullInstancePath, nameAsConfigured: packageName});
    }

    static getNodePackageManagerForInstance({fullInstancePath, config}: {fullInstancePath: string, config: OpenMctConfiguration}): NpmPackageManager {
        const npmPackage = new NpmPackageManager({fullInstancePath, config});
        
        return npmPackage;
    }
}
    
