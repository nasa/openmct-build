import { substituteVariables, runtimeSubstitutions, getUserDefinedSubstitutions } from "./mct-builder-core.js";

export default async function installEs6Plugin({openmct, importPath, installFunctionName, installFunctionOptions, buildTimeSubstitutions}) {
    const imports = await import(importPath);
    const exportedNames = Object.keys(imports);
    const userDefinedSubstitutions = getUserDefinedSubstitutions();

    const optionsWithSubstitutions = substituteVariables(installFunctionOptions, {
        ...buildTimeSubstitutions,
        ...userDefinedSubstitutions,
        ...runtimeSubstitutions
    });

    async function installPlugin(installFunction) {
        const pluginOrSetup = installFunction(optionsWithSubstitutions);
        if (typeof pluginOrSetup?.then === 'function') {
            const installable = await pluginOrSetup;
            openmct.install(installable);
        } else {
            openmct.install(pluginOrSetup);
        }
    }

    // If only one export, assume it is the install function. This simplifies things for the 90% case of a single default export
    if (exportedNames.length === 1) {
        const resolvedInstallFunctionName = exportedNames[0];
        const installFunction = imports[resolvedInstallFunctionName];
        await installPlugin(installFunction);
    } else {
        const exportedFunctionMap = Object.keys(imports).reduce((map, key) => {
            map.set(key.toLowerCase().replaceAll(/[^a-z0-9]/g, ''), imports[key]);
            return map;
        }, new Map());
        const installFunction = exportedFunctionMap.get(installFunctionName.toLowerCase().replaceAll(/[^a-z0-9]/g, ''));
        await installPlugin(installFunction);
    }
}