import { PackageJSON } from "@npm/types";
import OpenMctConfiguration, { INSTANCE_PATH } from "../openmct/OpenMctConfiguration";
import path from "path";
import * as fs from 'fs';
import * as child_process from 'child_process';
import NpmPackage from "./NpmPackage";
import { StringDecoder } from "string_decoder";
import { OpenMCTPluginsIndex } from "./OpenMctPluginsIndex";
import pacote from "pacote";
import InstalledNpmPackage from "./InstalledNpmPackage";

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
    async installPackage(packageName: string){
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
            const installedPackage = await this.getInstalledPackage(packageName);
            const entryPoint = installedPackage.getNpmEntryPoint();

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
    async install() {
        await this.installPackage(this.#config.getNpmPackage());

        const result = child_process.spawnSync('npm', ['install'], { cwd: this.#fullInstancePath });
        if (result.status !== 0) {
            throw new Error(`Failed to install dependencies for ${this.#fullInstancePath}`);
        }
    }
    async uninstallPackage(packageName: string) {
        const npmPackage:NpmPackage = await this.getInstalledPackage(packageName);

        child_process.spawnSync('npm', ['uninstall', npmPackage.getResolvedPackageName()], { cwd: this.#fullInstancePath });
    }
    async getInstalledPackage(packageName: string): Promise<NpmPackage> {
        const manifest = await pacote.manifest(packageName, {fullMetadata: true, where: this.#fullInstancePath });

        return new InstalledNpmPackage({fullInstancePath: this.#fullInstancePath, nameAsConfigured: packageName, manifest});
    }

    static async getNpmPackageFromRegistry(packageName: string): Promise<NpmPackage> {
        const manifest = await pacote.manifest(packageName, {fullMetadata: true});

        return new NpmPackage({nameAsConfigured: packageName, manifest});
    }

    static getNodePackageManagerForInstance({instance, config}: {instance: string, config: OpenMctConfiguration}): NpmPackageManager {
        const fullInstancePath:string = path.join(INSTANCE_PATH, instance);

        const npmPackage = new NpmPackageManager({fullInstancePath: fullInstancePath, config});
        
        return npmPackage;
    }

    static async generateListOfAvailableNpmPlugins(indexUrl:string): Promise<NpmPackage[]> {
        const indexJson = await httpOrLocalFileFetchAsJSON(indexUrl);
        const npmPackageNames:string[] = indexJson.plugins.map((plugin) => plugin.npmPackageName);
        const npmPackages = Promise.all(npmPackageNames.map((npmPackageName) => NpmPackageManager.getNpmPackageFromRegistry(npmPackageName)));
        return npmPackages;
    }
}

async function httpOrLocalFileFetchAsJSON(url:string): Promise<OpenMCTPluginsIndex> {
    if (url.startsWith('file://')) {
        const fileText = fs.readFileSync(url.substring(7), 'utf8');
        return JSON.parse(fileText) as OpenMCTPluginsIndex;
    } else {
        return await (await fetch(url)).json() as OpenMCTPluginsIndex;
    }
}
    
