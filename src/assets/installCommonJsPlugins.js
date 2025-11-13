import loadUmd from './load-umd.js';
export default async function installCommonJsPlugins({openmct, importPath, installFunctionNames, installFunctionOptions}) {
    const imports = await loadUmd(importPath);
    if (typeof imports === 'function') {
        const installFunction = imports;
        const installFunctionOption = installFunctionOptions[0];
        openmct.install(installFunction(installFunctionOption));
        return;
    } else if (typeof imports === 'object') {
        if (installFunctionNames.length === 1) {
            const installFunctionName = Object.keys(imports)[0];
            const installFunctionOption = installFunctionOptions[0];
            const installFunction = imports[installFunctionName];
            openmct.install(installFunction(installFunctionOption));
        } else {
            const exportedFunctionMap = Object.keys(imports).reduce((map, key) => {
                map.set(key.toLowerCase(), imports[key]);
                return map;
            }, new Map());
            installFunctionNames.forEach((installFunctionName, index) => {
                const installFunction = exportedFunctionMap.get(installFunctionName.toLowerCase());
                const installFunctionOption = installFunctionOptions[index];
                openmct.install(installFunction(installFunctionOption));
            });
        }
    } else {
        console.error(`Unsupported import type for ${importPath}`);
    }
}