import {loadUmd, runtimeSubstitutions, substituteVariables, getUserDefinedSubstitutions} from './mct-builder-core.js';

export default async function installCommonJsPlugin({openmct, importPath, installFunctionName, installFunctionOptions, buildTimeSubstitutions}) {
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

    const imports = await loadUmd(importPath);
    if (typeof imports === 'function') {
        const installFunction = imports;
        await installPlugin(installFunction);
    } else if (typeof imports === 'object') {
        const exportedFunctionNames = Object.keys(imports);
        if (exportedFunctionNames.length === 1) {
            const resolvedInstallFunctionName = exportedFunctionNames[0];
            const installFunction = imports[resolvedInstallFunctionName];
            await installPlugin(installFunction);
        } else {
            const exportedFunctionMap = exportedFunctionNames.reduce((map, key) => {
                map.set(key.toLowerCase().replaceAll(/[^a-z0-9]/g, ''), imports[key]);
                return map;
            }, new Map());
            const installFunction = exportedFunctionMap.get(installFunctionName.toLowerCase().replaceAll(/[^a-z0-9]/g, ''));
            await installPlugin(installFunction);
        }
    } else {
        console.error(`Unsupported import type for ${importPath}`);
    }
}