# TODO
- [X] Support single Open MCT instance of latest stable with built-in plugins
- [X] Support initialization of instance from external yaml file.
- [X] Support initialization of an instance from scratch
- [X] Support multiple Open MCT instances
- [X] Support adding builtin plugins via CLI
- [X] Support removing builtin plugins via CLI
- [X] Support adding npm plugins via CLI
- [X] Support removing npm plugins via CLI

- [X] Demo
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
- [X] Document the requirements for a plugin.
- [X] Add some docs for building and previewing a basic open mct instance.
- [X] Install plugins from local file system
- [X] List plugins installed for a given instance.
- [X] Externalize initialization block to local plugin
- [X] Support disabling plugins.
- [X] Confirm that overriding default plugins works.
    * "enabled" flag, options, etc.
- [X] Support configuring plugins via cli
    ```JavaScript
    mct-cli plugins configure openmct-yamcs enabled=false
    mct-cli plugins configure openmct-yamcs options='{devMode: true}'
    ```
- [X] Need to be able to specify plugin version via command line.
    - This is handled by npm conventions
- [X] Need to be able to support Open MCT branches
    - [X] Figure out how to make it so that instance.yaml only contains Open MCT version OR package name, and not both.
- [X] Generated instance.yaml should include the Open MCT Yaml schema to make them easier to edit.
- [X] Support "now" and basic time math in "mct-configure-time" AND time conductor plugins.
    - start: 'now - 90000'
    - end: 'now + 90000'
- [X] Move start block and asset path to bootstrap plugin.
- [ ] Do validation of plugin names. Reject plugins that we can't match, and do not add them to instance.yaml.
    - [X] validate builtins against installed version of open mct
- [X] Usage docs for all defined commands
- [X] Better error handling and feedback
- [X] Support "arguments" for plugins
- [X] Plugins add should support options
- [X] List all builtin plugins
- [X] List all external plugins
- [X] List and list all should return JavaScript objects that are then printed to console in a human readable format from mct.js.
- [X] Add "instances list" command to list local instances.
- [X] Add "instances info <instance name>" command to get info about a specific instance.
- [X] Refactor all commands into services, and focus commands on CLI use cases (ie. remove all the console.logging etc.)
- [X] Support multiple exports (plugins) from a single npm package
    - Just dedupe the npmPackage name, only import it once no matter how many times it's referenced
    - const exportsFromPackage = await import('path/to/package'); // For es6 imports
    - const exportsFromPackage = await loadUmd('path/to/package'); // For commonjs imports
    - Use configured plugin name to access the correct export
    - figure out how to support import default.
- [X] implement `mct plugins info <plugin name> -i instance` for plugin configuration for a specific instance
- [X] Refactor commands to services, and focus commands on CLI use cases (ie. remove all the console.logging etc.)
- [ ] Support multiple plugins for same npm package
    - Make sure this works with remove as well. Do NOT uninstall npm packages that still have references from other plugins.
- [ ] Support 'installFunctionName' from instance.yaml
- [ ] Figure out how to support plugin-relative paths for assets
- [ ] Ensure plugin order is preserved
- [ ] Support cascading recipes
- [ ] implement `mct plugins info <plugin name>` for just general available plugin configuration
    - For npm packages, get a description of the package from from the package.json. Options are a little trickier.
    - This could be a starting point for figuring out how to get type information out of the plugin     
        - https://github.com/ccontrols/structured-types?tab=readme-ov-file
    - In brief, this will rely upon types being published for plugins.
- [ ] Refactor BuildCommand to be an alias to InstancesCommand.build(). Move all build logic into InstancesCommand, because you're building a mystery (instance).
- [ ] Tests
    - [ ] Default plugins can be disabled
    - [ ] An already installed plugin can be configured
    - [ ] Options for default plugins can be overridden
    - [ ] 'entryPoint' works
    - [ ] Different 'entryPoint's for the same npmPackage works.
- [ ] Remove all Open MCT internal plugins from loader.js in openmct-mcws and move them to a recipe
   - @Jamie
- [ ] Get VIPER building with this tool
    - @Dave
- [ ] Hand over to PDP
- [ ] Plugin reorder command
- [ ] How can plugins reference other installed plugins. eg. for the CouchDB / CouchDBSearchFolder plugin case

- [ ] Figure out how the hell this will be compiled and run as a cli tool
- [ ] Error on version incompatibilities between plugins, Open MCT versions, etc.
- [ ] List all available plugins, as well as installed plugins.
- [ ] Update all Open MCT package.jsons with compatibility information, AND MAINTAIN IT GOING FORWARD.
EOY scope ends here.
- [ ] define a plugin registry for external plugins
    - Support a custom organizational plugin index eg. `-i https://trunk.ndc.nasa.gov/bitbucket/VIPERGDS/viper-openmct-nasa-internal-plugins.json`
- [ ] file:// packages always bypass plugin registry for validation
- [ ] Include a `--force` `-f` flag to bypass plugin registry validation. Will only validate that npm package exists.

- [ ] Add a "did you mean?" capability when trying to match a plugin name. Can use levenshtein distance to calculate similarity. https://www.npmjs.com/package/js-levenshtein-esm
- [ ] Man entries for all defined commands
- [ ] Support importing multiple plugins from a single source file

## Bugs
- [ ] Figure out how to build parseArgs options programmatically from commands. Need the superset of options for all commands for the first pass.

## Improvements to OMM
- [ ] package.json should identify the source location.