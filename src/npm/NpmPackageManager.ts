import { PackageJSON } from "@npm/types";
import OpenMctConfiguration, { INSTANCE_PATH } from "../openmct/OpenMctConfiguration";
import path from "path";
import * as fs from 'fs';
import * as child_process from 'child_process';
import NpmPackage from "./NpmPackage";
import { StringDecoder } from "string_decoder";

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
        const result = child_process.spawnSync('npm', ['install', '--save-dev', packageName], { cwd: this.#fullInstancePath });
        if (result.status !== 0) {
            const decoder = new StringDecoder('utf8');
            const error = decoder.write(result.stderr);
            if (error.toLocaleLowerCase().includes('e404')) {
                throw new Error(`Unknown NPM package ${packageName}`);
            }
            throw new Error(`Failed to install ${packageName}: ${error}`);
        } else {
            // TODO: Validate the installed package
            // Does it have a `main` function specified in package.json?
            const installedPackage = this.getPackage(packageName);
            let entryPoint = installedPackage.getNpmEntryPoint();
            if (!entryPoint) {
                console.warn(`NPM package ${packageName} does not have a 'main' entry point specified in package.json. Will default to 'index.js'`);
                entryPoint = 'index.js';
            }
            const entryPointPath = path.join(this.#fullInstancePath, 'node_modules', installedPackage.getResolvedPackageName(), entryPoint);
            if (!fs.existsSync(entryPointPath)) {
                throw new Error(`Could not resolve entry point for ${packageName}: ${entryPointPath}`);
            }
            // Does it have a `type` field specified in package.json?
            const packageType = installedPackage.getPackageType();
            if (!packageType) {
                console.warn(`NPM package ${packageName} does not have a 'type' field specified in package.json. Will default to 'commonjs'`);
            }
        }
    }
    install() {
        this.installPackage(this.#config.getNpmPackage());

        const result = child_process.spawnSync('npm', ['install'], { cwd: this.#fullInstancePath });
        if (result.status !== 0) {
            throw new Error(`Failed to install dependencies for ${this.#fullInstancePath}`);
        }
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
    
