# mct - The Open MCT Build Tool

The Open MCT Build Tool's `mct` command is a command-line interface for building a packaged Open MCT instance that can be deployed to a web server. It allows you to install and remove supported Open MCT plugins.

## Installation

```bash
git clone https://github.com/akhenry/openmct-build.git
cd openmct-build
npm install
npm link
```

`npm link` will install `mct` as a global command line tool that can be run from any directory. Open MCT instances will be created in the `instances` directory relative to the current working directory. `npm install` installs the `mct` dependencies.

## Quick start

The following will build a new Open MCT instance -

```bash
mct build
```

To _preview_ the instance, we can use a development server like `http-server`. For production deployments Open MCT should be deployed to a web server that meets your security and traffic needs. Open MCT is tested with Apache.

eg.
```bash
npx http-server instances/default -o
```

## Limitations

* This version of the build tool is not optimized. It's doing a lot of npm operations that it doesn't strictly need to do and as a result some seemingly simple operations may be inexplicably slow. We are working on it. In the mean time using published NPM packages helps speed things up alot.
* This will only build Open MCT plugins. It cannot be used to build or package Yamcs, MCWS, AMPCS, or any other upstream dependencies.
* Some Open MCT plugins are still [installed by default in code](https://github.com/nasa/openmct/blob/4ab98ffef09adbe38a28a5e275d45a37e8196ef4/src/MCT.js#L277) and cannot be overridden via the build tool. This will be fixed in a future release of Open MCT.

## Commands

### Initialize a new instance

Build the default instance
```bash
mct build
```

Build a new named instance
```bash
mct build --instance <instance-name>
```

If no instance is specified, the default instance will be used.

### Build a new instance from a recipe

Recipes are a way of defining configuration in an all-in-one package.

```bash
mct build --recipe <recipe> [-i <instance-name>]
```

Some recipes are provided under the `recipes/` folder in the Open MCT Build Tool repository.

### Build a particular version of Open MCT

```bash
mct build --version <version>
```

Examples:

```bash
mct build --version latest
```

```bash
mct build --version stable
```

```bash
mct build --version 4.3.0
```

### Build a particular package of Open MCT

If you want to use a custom build of Open MCT, you can specify an npm package specifier. This can be used to build github branches, local, or custom npm packages of Open MCT

```bash
mct build --npmPackage <npm package specifier>
```
Example:

```bash
mct build --npmPackage nasa/openmct#gold
```

### Install a plugin

```bash
mct plugins add <plugin name or npm package specifier> [-i <instance-name>] [-o options]
```

```bash
mct plugins add <plugin name> --npmPackage <npm package specifier> [-i <instance-name>] [-o <options>]
```

Examples:
```bash
mct plugins add openmct-mcws-plugin -i my-mcws-instance 
```

```bash
mct plugins add openmct-mcws-plugin --npmPackage file:/../local-mcws-build -i my-mcws-instance
```

```bash
mct plugins add openmct.plugins.CouchDB -o '["http://localhost:5984/openmct"]'
```

#### Installing a plugin from a package that exports multiple plugins
Multiple plugins may reference the same `npmPackage`. The build tool will assume that the referenced npm package exports a function with the same name as the plugin name.

See `recipes/examples/local-plugin` for an example of this.

### Listing installed plugins for an instance

```bash
mct plugins list [-i <instance-name>]
```

Example:
```bash
mct plugins list -i my-instance 
```


### Listing all available plugins for a specific instance

```bash
mct plugins list -a [-i <instance-name>]
```

Example:

```bash
mct plugins list -i my-instance 
```

By default the `mct` build tool will rely upon the plugins index published by the Open MCT team. If you want to use a different plugins index, you can specify it using the `--pluginsIndex` option. This can be used for maintaining a private plugins index.

### Specifying options when installing a plugin

Options can be specified as a JSON object. The options will be passed to the plugin's install function. To support legacy plugins, options may also be specified as an array of JavaScript primitives or objects. Each member of the array will be passed to the plugin's install function as a separate argument.

```bash
mct plugins add <plugin name> --options <options>
```

Examples:

* Installing a plugin and providing configuration in the form of an options object with named arguments:

```bash
mct plugins add openmct.plugins.PlanLayout --options '{"creatable": true}'
```

* Installing a plugin and providing configuration in the form of an array of ordered arguments:
```bash
mct plugins add openmct.plugins.CouchDB --options '["http://localhost:5984/openmct"]'
```

### Configuring an already installed plugin

```bash
mct plugins configure openmct.plugins.PlanLayout [--enabled <true|false>] --options <options> [-i <instance-name>]
```

Example:
```bash
mct plugins configure openmct.plugins.PlanLayout --enabled true --options '{"creatable": true}'
```

### Remove a plugin

When removing a plugin, always reference it by its name as defined in the instance.yaml. This is typically the resolved NPM package name as defined in the plugin's package.json.

```bash
mct plugins remove <plugin-name> [-i <instance-name>]
```
Example:

```bash
mct plugins remove openmct-yamcs
```

### Disabling an installed plugin

It is possible to disable a plugin but retain its configuration in the instance.yaml. This can be useful for debugging, but it can also be useful for overriding builtin configuration such as the installed theme:

Example:

```bash
mct plugins configure openmct.plugins.Espresso --enabled false
# With espresso disabled some theme needs to be applied. Apply the snow theme.
mct plugins add openmct.plugins.Snow
```

## Understanding Instance Configuration

### Instance Directory Structure

When you build an instance using `mct build`, a new directory is created in the `instances/` folder. Each instance contains:

```
instances/
└── <instance-name>/
    ├── index.html          # The main HTML file to serve
    ├── instance.yaml       # Configuration file for the instance
    ├── assets/             # Runtime dependencies needed to bootstrap Open MCT and install plugins.
    └── node_modules/       # Any node plugin dependencies configured for this instance, including Open MCT itself.
```

### instance.yaml Files

The `instance.yaml` file is the configuration file for an Open MCT instance. It defines which version of Open MCT to build from and which plugins to install. When the build tool is executed using mct build, it will use the `instance.yaml` file as a manifest to install the referenced plugins and provide any configuration defined.

#### Structure

An `instance.yaml` file has the following structure:

```yaml
openmct:
  version: latest              # or a specific version like "3.0.0"
  plugins:
    - openmct.plugins.LocalStorage
    - openmct.plugins.PlanLayout:
        options:
          creatable: true
    - akhenry/openmct-yamcs:
        npmPackage: akhenry/openmct-yamcs
        options:
          host: localhost
          port: 8090
```

A JSON schema document is also provided for convenience to support IDE and build-time validation of your instance YAML file. It is referenced at the top of the instance.yaml file.

#### Key Fields

- **version** (string): The version of Open MCT to use. Can be a specific version (e.g., "3.0.0"), a version range (e.g., "^3.0.0"), or "latest".
- **plugins** (array): List of plugins to install. Each plugin can be:
  - A string: The plugin identifier (for builtin plugins), npm package name, or an installFunction name if an npmPackage is also specified.
  - An object: A plugin configuration with the following properties:
    - **npmPackage** (string, optional): The npm package specifier if different from the plugin name
    - **enabled** (boolean, optional): Whether the plugin is enabled (default: true)
    - **options** (object or array, optional): Configuration options passed to the plugin

#### Plugin Options

Plugin options can be specified in two ways:

**As an options object** (recommended for most plugins):
```yaml
openmct:
  version: latest
  plugins:
    - openmct.plugins.PlanLayout:
        options:
          creatable: true
          editable: false
```

**As an array** (for legacy plugins that only accept positional arguments):
```yaml
openmct:
  version: latest
  plugins:
    - openmct.plugins.CouchDB:
        options:
          - "http://localhost:5984/openmct"
```

#### Variable substitutions

Variables can be used for plugin option values in order to substitute values from the environment. Currently the following variables are available:

- `${pluginContextPath}`: The path to the plugin's directory relative to the instance. This allows you to provide URLs as options that are relative to the plugin's installed path. This can be useful for referencing assets that are packaged with the plugin.
- `${now}`: The current time in milliseconds since the epoch. This will be evaluated at _runtime_ not build time. It can be used to set time bounds for the conductor plugin. 
- `${<time_duration>}`: A duration in milliseconds. Valid durations are: `five_seconds`, `ten_seconds`, `fifteen_seconds`, `thirty_seconds`, `one_minute`, `five_minutes`, `ten_minutes`, `fifteen_minutes`, `thirty_minutes`, `one_hour`, `two_hours`, `one_day`, `one_week`, `one_month`, `one_year`, `two_years`, `five_years`, `ten_years`. These can be combined with `+` and `-` to create more complex time expressions. eg. `${now} - ${thirty_minutes}`.

eg.
```yaml
openmct:
  version: latest
  plugins:
    - my-map-plugin:
        options:
          baseMap: "${pluginContextPath}/maps/base-map.png"
    - openmct.plugins.Conductor:
      options:
        bounds:
          start: "${now} - ${thirty_minutes}"
          end: "${now}"
```

##### Runtime substitutions from plugins

In addition to the built-in substitutions above, plugins can register their own substitutions at runtime. This is useful when a value must be computed in the browser, or when configuration cannot be expressed in YAML alone.

To register a substitution, a plugin's install function may accept a second argument with a `registerRuntimeSubstitution` helper:

```js
export function myPlugin(options = {}, { registerRuntimeSubstitution } = {}) {
    registerRuntimeSubstitution('myValue', 'hello');
    return function install(openmct) {
        // ...
    };
}
```

Registered values can then be referenced in later plugin options using `${myValue}`:

```yaml
openmct:
  version: latest
  plugins:
    - my-plugin:
        npmPackage: file:./my-plugin
    - another-plugin:
        npmPackage: file:./another-plugin
        options:
          greeting: ${myValue}
```

Plugin order matters. The plugin that registers a substitution must appear _before_ any plugin that consumes it.

See `recipes/examples/runtime-substitutions` for a complete example.

### Modifying an Instance After Creation

After creating an instance, you can modify any plugin configuration either by editing the `instance.yaml` file directly, or using the `mct plugins` commands.

eg.
```bash
# Add a new plugin
mct plugins add openmct.plugins.Snow -i demo-instance

# Remove a plugin
mct plugins remove openmct.plugins.PlanLayout -i demo-instance

# Configure an existing plugin
mct plugins configure openmct-yamcs --options '{"yamcsDictionaryEndpoint": "http://localhost:8080/"}' --instance demo-instance
```

These changes will be reflected in the instance's `instance.yaml` file.


### Recipes

Recipes are template `instance.yaml` files that can be used to quickly create new instances with a predefined set of plugins and configurations. Recipes are useful for:

- Creating standardized instances across your organization
- Sharing common configurations with team members
- Quickly deploying instances with specific plugin combinations

#### Using a Recipe

To build an instance from a recipe:

```bash
mct build --recipe <path-to-recipe.yaml> [-i <instance-name>]
```

Example:
```bash
mct build --recipe recipes/demo.yaml -i demo-instance
```

#### Creating a Recipe

Recipes are simply YAML files with the same structure as `instance.yaml`. As such, building a new recipe is as simple as creating a new instance, configuring it to meet your needs, and copying out it's `instance.yaml` file. It can then be referenced as a recipe when creating subseqent instances.

##### Recipe Examples

See the `recipes/` directory for example recipes:

- `recipes/yamcs.yaml` - A configuration for YAMCS integration
- `recipes/mcws/` - Example configurations for Open MCT with the MCWS plugin (`dev.yaml`, `prod.yaml`)
- `recipes/examples/demo.yaml` - A demo configuration with common builtin and example plugins
- `recipes/examples/custom-openmct-build` - Same demo-style plugin set, but using a custom Open MCT npm package (`npmPackage`) instead of a published version
- `recipes/examples/hello-world` - A minimal plugin package that can be added to an instance with `mct plugins add`
- `recipes/examples/local-plugin` - Building an instance that references local plugin code via `file:` npm packages, including multiple exports from one package and `${pluginContextPath}` for assets
- `recipes/examples/runtime-substitutions` - An example of plugins registering and consuming runtime substitutions

## Development

### Type Generation

This project uses [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) to generate TypeScript types from its JSON Schemas.

#### Generating Types

Generate the types by running:
```bash
npm run generate:types
```

This regenerates two files from their corresponding schemas:

| Schema | Generated types |
| --- | --- |
| `src/assets/openmct-configuration-schema.json` | `src/openmct/OpenMctConfigurationDocument.ts` |
| `src/npm/openmct-plugins-index-schema.json` | `src/npm/OpenMctPluginsIndex.ts` |

#### Schema Updates

When you update either schema listed above:
1. Run `npm run generate:types` to update the TypeScript types
2. The TypeScript compiler will show any type errors in your code

### Testing

Tests run under [Playwright Test](https://playwright.dev/), combining direct execution of CLI commands (asserting on generated files, same as before) with real-browser assertions against the built instance served over HTTP. Install the Chromium browser binary once before running tests for the first time (this is a large download and is intentionally not run automatically on `npm install`):

```bash
npx playwright install chromium
```

Run the test suite:

```bash
npm test
```

Run tests in watch/UI mode:

```bash
npm run test:watch
```

Generate a test coverage report for the build tool's own source (`src/**/*.ts`, excluding the browser-only runtime shims under `src/assets/`):

```bash
npm run test:coverage
```