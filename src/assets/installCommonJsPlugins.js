import loadUmd from './load-umd.js';
export default async function installCommonJsPlugins({openmct, importPath, installFunctionNames, installFunctionOptions}) {
    const imports = await loadUmd(importPath);
    if (typeof imports === 'function') {
        const installFunction = imports;
        const installFunctionOption = installFunctionOptions[0];
        openmct.install(installFunction(installFunctionOption));
        return;
    } else if (typeof imports === 'object') {
        const exportedFunctionNames = Object.keys(imports);
        if (installFunctionNames.length === 1) {
            const installFunctionName = exportedFunctionNames[0].toLowerCase().replaceAll(/[^a-z0-9]/g, '');
            const installFunctionOption = installFunctionOptions[0];
            const installFunction = imports[installFunctionName];
            openmct.install(installFunction(installFunctionOption));
        } else {
            const exportedFunctionMap = exportedFunctionNames.reduce((map, key) => {
                map.set(key.toLowerCase().replaceAll(/[^a-z0-9]/g, ''), imports[key]);
                return map;
            }, new Map());
            installFunctionNames.forEach((installFunctionName, index) => {
                const installFunction = exportedFunctionMap.get(installFunctionName.toLowerCase().replaceAll(/[^a-z0-9]/g, ''));
                const installFunctionOption = installFunctionOptions[index];
                openmct.install(installFunction(installFunctionOption));
            });
        }
    } else {
        console.error(`Unsupported import type for ${importPath}`);
    }
}