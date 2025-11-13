# mct - Open MCT Configuration Tool

The `mct` is a command-line interface for building a packaged Open MCT instance that can be deployed to a web server. It allows you to install and remove supported Open MCT plugins.

## Installation

```bash
npm install
npm link
```

`npm link` will install `mct` as a global command line tool that can be run from any directory. Open MCT instances will be created in the `instances` directory relative to the current working directory. `npm install` installs the `mct` dependencies.

## Quick start

The following will build a new Open MCT instance -

```bash
mct build
```

To preview the instance, we can use a development server like `http-server`:

eg.
```bash
npx http-server instances/default -o
```

For production deployments Open MCT should be deployed to a web server that meets your security and traffic needs. Open MCT is tested with Apache.


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

```bash
mct build --recipe <recipe> [-i <instance-name>]
```

### Build a particular version of Open MCT

```bash
mct build --version <version>
```

### Build a particular package of Open MCT

If you want to use a custom build of Open MCT, you can specify an npm package specifier. This can be used to build github branches, local, or custom npm packages of Open MCT

```bash
mct build --npmPackage <npm package specifier>
```

### List available plugins configured for a given instance

```bash
mct plugins list [-i <instance-name>]
```

### Install a plugin

```bash
mct plugins add <plugin or npm package specifier> [-i <instance-name>] [-o options]
```

```bash
mct plugins add <plugin name> --npmPackage <npm package specifier> [-i <instance-name>] [-o <options>]
```

### Installing a plugin from a package that exports multiple plugins
Multiple plugins may reference the same `npmPackage`, in which case they will be treated as being imported from the same module. The npmPackage referenced will assume to export functions with the same name as the plugin name.

### List all available plugins

```bash
mct plugins list -a [-i <instance-name>]
```

By default the `mct` build tool will rely upon the plugins index published by the Open MCT team. If you want to use a different plugins index, you can specify it using the `--pluginsIndex` option. This can be used for maintaining a private plugins index.

#### Specifying plugin options

Options can be specified as a JSON object. The options will be passed to the plugin's install function. To support legacy plugins, options may also be specified as an array of JavaScript primitives and / or objects. Each member of the array will be passed to the plugin's install function as a separate argument.

```bash
mct plugins add <plugin name> --options <options>
```

Example:
```bash
mct plugins add openmct.plugins.PlanLayout --options '{"creatable": true}'
```
```bash
mct plugins add openmct.plugins.CouchDB --options '["http://localhost:5984/openmct"]'
```
### Remove a plugin

```bash
mct plugins remove <plugin-name> [-i <instance-name>]
```

### Configure an installed plugin

```bash
mct plugins configure <plugin-name> --enabled <true|false> --npmPackage <npm package specifier> --options <options> [-i <instance-name>]
```


## Understanding Instance Configuration

### Instance Directory Structure

When you build an instance using `mct build`, a new directory is created in the `instances/` folder. Each instance contains:

```
instances/
└── <instance-name>/
    ├── index.html          # The main HTML file to serve
    ├── instance.yaml       # Configuration file for the instance
    └── dist/               # Compiled Open MCT files
```

### instance.yaml Files

The `instance.yaml` file is the configuration file for an Open MCT instance. It defines which version of Open MCT to use and which plugins to install.

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

#### Key Fields

- **version** (string): The version of Open MCT to use. Can be a specific version (e.g., "3.0.0"), a version range (e.g., "^3.0.0"), or "latest".
- **plugins** (array): List of plugins to install. Each plugin can be:
  - A string: The plugin identifier (for builtin plugins) or npm package name
  - An object: A plugin configuration with the following properties:
    - **npmPackage** (string, optional): The npm package specifier if different from the plugin name
    - **enabled** (boolean, optional): Whether the plugin is enabled (default: true)
    - **options** (object or array, optional): Configuration options passed to the plugin

#### Plugin Options

Plugin options can be specified in two ways:

**As an object** (recommended for most plugins):
```yaml
openmct:
  version: latest
  plugins:
    - openmct.plugins.PlanLayout:
        options:
          creatable: true
          editable: false
```

**As an array** (for legacy plugins that accept positional arguments):
```yaml
openmct:
  version: latest
  plugins:
    - openmct.plugins.CouchDB:
        options:
          - "http://localhost:5984/openmct"
```

### Modifying an Instance After Creation

After creating an instance, you can modify any plugin configuration either by editing the `instance.yaml` file directly, or using the `mct plugins` commands.

eg.
```bash
# Add a new plugin
mct plugins add openmct.plugins.Snow -i demo-instance

# Remove a plugin
mct plugins remove openmct.plugins.PlanLayout -i demo-instance

# Configure an existing plugin
mct plugins configure openmct.plugins.CouchDB --options '["http://new-server:5984/openmct"]' -i demo-instance
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

- `recipes/demo.yaml` - A demo configuration with common builtin plugins
- `recipes/yamcs.yaml` - A configuration for YAMCS integration

## Examples

1. Deploy a new default instance of Open MCT
```bash
mct build
```

2. Deploy a new named instance of Open MCT
```bash
mct build --instance my-instance
```

3. Deploy a new default instance of Open MCT using a specific version
```bash
mct build --version latest
```

4. Deploy a new default instance of Open MCT using a specific npm package
```bash
mct build --npmPackage nasa/openmct#gold
```

5. Install a plugin to the default instance:
```bash
mct plugins add akhenry/openmct-yamcs
```
6. Install a plugin to a specific instance:
```bash
mct -i my-instance plugins add akhenry/openmct-mcws
```
7. Install a builtin plugin with arguments:
```bash
mct plugins add openmct.plugins.CouchDB -o '["http://localhost:5984/openmct"]'
```
8. Remove a plugin from the default instance:
```bash
mct plugins remove openmct-yamcs
```
9. Remove a plugin from a specific instance:
```bash
mct -i my-instance plugins remove openmct-mcws
```
10. List plugins installed for the default instance:
```bash
mct plugins list
```
11. List plugins installed for a specific instance:
```bash
mct -i my-instance plugins list
```
12. List all available plugins for the default instance:
```bash
mct plugins list -a
```
13. List all available plugins for a specific instance:
```bash
mct -i my-instance plugins list -a
```
14. Configure an installed plugin:
```bash
mct plugins configure openmct.plugins.PlanLayout --enabled true --options '{"creatable": true}'
```
15. Override a default plugin:
```bash
mct plugins configure openmct.plugins.Espresso --enabled false
# With espresso disabled some theme needs to be applied. Apply the snow theme.
mct plugins add openmct.plugins.Snow
```

## Development

### Type Generation

This project uses [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) to generate TypeScript types from the JSON Schema.

#### Generating Types

Types are automatically generated:
1. When you run `npm install` (via the `postinstall` hook)
2. Manually by running:
```bash
npm run generate:types
```

The generated types will be available in `src/openmct/types.ts`.

#### Schema Updates

When you update the schema in `src/yaml/openmct-configuration-schema.json`:
1. Run `npm run generate:types` to update the TypeScript types
2. The TypeScript compiler will show any type errors in your code

### Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate test coverage report:

```bash
npm run test:coverage
```