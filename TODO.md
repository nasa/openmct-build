# TODO
- [X] Support single Open MCT instance of latest stable with built-in plugins
- [X] Support initialization of instance from external yaml file.
- [X] Support initialization of an instance from scratch
- [X] Support multiple Open MCT instances
- [X] Support adding builtin plugins via CLI
- [X] Support removing builtin plugins via CLI
- [X] Support adding npm plugins via CLI
- [X] Support removing npm plugins via CLI
- [X] Plugins remove needs to uninstall npm dependency
- [X] Decide on whether OMM is multiple plugins, or just one
    - Just one initially.
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
- [X] Support multiple plugins for same npm package
    - Make sure this works with remove as well. Do NOT uninstall npm packages that still have references from other plugins.
- [X] Support 'installFunctionName' from instance.yaml
- [X] Figure out how to support plugin-relative paths for assets
- [X] Ensure plugin order is preserved
- [X] implement `mct plugins info <plugin name>` for just general available plugin configuration
    - For npm packages, get a description of the package from from the package.json. Options are a little trickier.
    - This could be a starting point for figuring out how to get type information out of the plugin     
        - https://github.com/ccontrols/structured-types?tab=readme-ov-file
    - In brief, this will rely upon types being published for plugins.
- [X] Remove all Open MCT internal plugins from loader.js in openmct-mcws and move them to a recipe
- [X] Date support for specific dates
- [X] Implement example custom plugin
- [X] ~~When installing a local plugin, either via a plugins or build command, copy the content of the plugin path across to the new instance directory, then run the npm command from there to install dependencies.~~
    - No. instance.yaml uses absolute path. This gives equivalent behavior to remote npm packages. The difference is that it's located on your computer and not the internet. For development in particular, this is what you want. Changes are immediately reflected in the running instance.
    - _Recipes_ by contrast can use relative paths to assets, including plugins, located relative to the recipe.
- [X] Retest all builds
- [X] Docs for OMM plugin that detail all the options
- [X] Restore legacy build process for OMM
- [X] define a plugin registry for external plugins
    - Support a custom organizational plugin index eg. `-i https://blahblahblah.nasa.gov/bitbucket/GDS/viper-openmct-nasa-internal-plugins.json`
- [X] Deploy OMM from new build process to uphill.
- [X] Deploy OMM from new "legacy" process to uphill.
- [ ]Fix bug reported by Jamie from legacy build process openmct-mcws.css is 404.
    - [X] Support dynamic roots (Andrew)
    - [ ] Support dynamic namespaces (Jamie)
- [X] Fix bug with running globally.
- [X] Confirm that npm relative paths still work with plugins?
- [X] Add some more console logs for feedback to user.
- [X] Proof read docs.
- [X] Ask NASA org to create new public repo for build tool
- [X] Merge to master
- [X] Publish OMM to npm
- [X] Publish Open MCT to npm
- [X] Mainline changes to conductor
- [X] Mainline changes to openmct-mcws-plugin
- [X] Update MCWS package.json with compatibility information, AND MAINTAIN IT GOING FORWARD.

EOY scope ends here.

- [ ] Additional Tests
    - [ ] Default plugins can be disabled
    - [ ] An already installed plugin can be configured
    - [ ] Options for default plugins can be overridden
    - [ ] 'entryPoint' works
    - [ ] Different 'entryPoint's for the same npmPackage works.
- [ ] When installing builtin plugins via cli do not include the source property. It's just noise.
- [ ] Refactor BuildCommand to be an alias to InstancesCommand.build(). Move all build logic into InstancesCommand, because you're building a mystery (instance).
- [ ] Support cascading recipes
- [ ] Plugin reorder command
- [ ] How can plugins reference other installed plugins. eg. for the CouchDB / CouchDBSearchFolder plugin case
- [ ] Compile TS to JS for build tool to speed it up.
- [ ] Better feedback on version incompatibilities between plugins, Open MCT versions, etc.
- [ ] file:// packages always bypass plugin registry for validation
- [ ] Add a "did you mean?" capability when trying to match a plugin name. Can use Levenshtein distance to calculate similarity. https://www.npmjs.com/package/js-levenshtein-esm

## Performance
This tool is NOT optimized for speed right now.
- [X] Publish OMM to npm
- [X] Publish Open MCT to npm
- [ ] Pre-compile TS to JS for npm version of build tool
- [ ] Reduce the number of `npm` calls used. 