# TODO
- [X] Support single Open MCT instance of latest stable with built-in plugins
- [X] Support initialization of instance from external yaml file.
- [X] Support initialization of an instance from scratch
- [X] Support multiple Open MCT instances
- [X] Support adding builtin plugins via CLI
- [X] Support removing builtin plugins via CLI
- [X] Support adding npm plugins via CLI
- [X] Support removing npm plugins via CLI

- [ ] Demo
   - Start with context, show a diagram
   - Start from scratch, create a new default instance
      - Use stable initially
      - Switch to latest
      - HOLD FOR APPLAUSE
      - launch http-server to demonstrate
   - Customize it by enabling a another builtin plugin.
      - openmct.plugins.example.Generator
      - launch http-server to demonstrate
      - openmct.plugins.LADTable
   - Customize it by adding an npm plugin (openmct-yamcs)
      - akhenry/openmct-yamcs#defaults
   - Now, this is all very manual, how do I define "recipes"?
      - Open the yamcs.yaml template
      - Talk about the format and how options etc. are specified
      - Open the default recipe
   - Talk about instances
      - Create a new instance named something else
      - Explain why this is important.
   - Talk about the codebase
      - Yaml schema and how Yaml files get validated
      - Show our Open MCT custom schema and how it enables IDE support
      - All implemented in TypeScript
   - Roadmap and where this fits in it
- [X] Plugins remove needs to uninstall npm dependency
- [X] Decide on whether OMM is multiple plugins, or just one
   * For V1 it is a single plugin
   * Define how multiple plugins will be supported in future though, so we don't paint ourselves into a corner.
   ```yaml
       - NASA-Ammos/openmct-mcws:
        source: npm
        plugins:
          firstPluginName:
            options:
              foo: bar
          secondPluginName:
            options:
              foo2: bar2
   ```
   ```JavaScript
   //IndexFileCreator.ts
    #buildImportLoadBlock(document: Document): HTMLScriptElement {
        const scriptElement = document.createElement('script');
        scriptElement.type = 'module';
        scriptElement.async = true;
        scriptElement.blocking = 'render';
        //Do import block first
        this.#configuration.getNodePlugins({type: 'es6'}).forEach((plugin: OpenMctPlugin) => {
            const packageEntryPoint = this.#npmPackageManager.getPackage(plugin.getName()).getResolvedEntryPoint(plugin);
            const subPlugins = plugin.getSubPlugins();
            if (subPlugins.length > 0) {
                subPlugins.forEach((subPlugin: OpenMctPlugin) => {
                    scriptElement.textContent += `import ${subPlugin.getName()} from '${packageEntryPoint}';\r\n`;
                });
            } else {
                scriptElement.textContent += `import ${subPlugin.getName()} from '${packageEntryPoint}';\r\n`;
            }
        });

        //Then do install block
        this.#configuration.getNodePlugins({type: 'es6'}).forEach((plugin: OpenMctPlugin) => {
            const subPlugins = plugin.getSubPlugins();
            if (subPlugins.length > 0) {
                subPlugins.forEach((subPlugin: OpenMctPlugin) => {
                    scriptElement.textContent += `openmct.install(${subPlugin.getName()}(${JSON.stringify(subPlugin.getOptions())}));\r\n`;
                });
            } else {
                scriptElement.textContent += `openmct.install(${plugin.getName()}(${JSON.stringify(plugin.getOptions())}));\r\n`;
            }
        });

        scriptElement.textContent += `document.dispatchEvent(new Event("OpenMCTPluginsInstalled"));`;

        return scriptElement;
    }

   ```
- [X] Remove plugins should work on ~~name-as-installed or~~ package name only for now.
    - [X] Should be able to remove locally install openmct-yamcs without having to specify the entire path.
    - [X] Once again plugins remove openmct-yamcs is not working for openmct-yamcs#defaults
- [x] Document the requirements for a plugin.
- [ ] Add some docs for building and previewing a basic open mct instance.
- [ ] List plugins installed for a given instance.
- [X] Install plugins from local file system
- [ ] Remove all Open MCT internal plugins from loader.js in openmct-mcws and move them to a recipe
   - @Jamie
- [ ] Externalize initialization block to local plugin
- [ ] Need to be able to specify plugin version via command line.
- [ ] Need to be able to specify configuration options from command line
- [ ] Tests
- [ ] In general better user feedback
- [ ] Hand over to PDP

- [ ] List all available plugins, as well as installed plugins.
- [ ] Error on version incompatibilities between plugins, Open MCT versions, etc.
- [ ] Update all Open MCT package.jsons with compatibility information, AND MAINTAIN IT GOING FORWARD.
- [ ] Support importing multiple plugins from a single source file

## Improvements to OMM
- [ ] package.json should identify the source location.