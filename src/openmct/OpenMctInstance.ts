import OpenMctConfiguration from "./OpenMctConfiguration";
import OpenMctPlugin from "./OpenMctPlugin";

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
        return this.toStringLimited();
    }
    toStringLimited() {
        return `${this.#name} (version '${this.#config.getOpenMctVersion()}') at ${this.#path}`;
    }
    
    toStringDetailed() {
        let description:string = `name: ${this.#name}\n`
        + `version: ${this.#config.getOpenMctVersion()}\n`
        + `location: ${this.#path}\n`
        + `plugins:\n`;
        this.#config.getPlugins().forEach((plugin: OpenMctPlugin) => {
            description += `    - ${plugin.getName()}\n`;
        });
        return description;
    }
}
