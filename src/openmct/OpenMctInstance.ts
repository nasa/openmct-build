import OpenMctConfiguration from "./OpenMctConfiguration";

export default class OpenMctInstance {
    #name:string;
    #path:string;
    #config:OpenMctConfiguration;

    constructor({name, path, config}: {name:string, path:string, config:OpenMctConfiguration}) {
        this.#name = name;
        this.#path = path;
        this.#config = config;
    }

    getName() {
        return this.#name;
    }

    getPath() {
        return this.#path;
    }

    getConfig() {
        return this.#config;
    }

    toString() {
        return `${this.#name} (version '${this.#config.getOpenMctVersion()}') at ${this.#path}`;
    }
}
