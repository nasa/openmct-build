# mct-cli - Open MCT Configuration Tool

The `mct-cli` is a command-line interface for building a packaged Open MCT instance that can be deployed to a web server. It allows you to install and remove supported Open MCT plugins.

## Installation

```bash
npm install
npm link
```

`npm link` will install `mct-cli` as a global command line tool that can be run from any directory. Open MCT instances will be created in the `instances` directory relative to the current working directory. `npm install` installs the `mct-cli` dependencies.

## Quick start

The following will build a new Open MCT instance and start a local server to preview it.

```bash
mct-cli build
npx http-server instances/default
```

Now navigate a web browser to `http://localhost:8080` to preview your Open MCT instance. This is intended for preview purposes only. For production deployments, Open MCT should be deployed to a web server that meets your security and traffic needs. Open MCT is tested with Apache.


## Commands

### Initialize a new instance

Build the default instance
```bash
mct-cli build
```

Build a new named instance
```bash
mct-cli build --instance <instance-name>
```

If no instance is specified, the default instance will be used.

### Build a particular version of Open MCT

```bash
mct-cli build --version <version>
```

### Build a particular package of Open MCT

If you want to use a custom build of Open MCT, you can specify an npm package specifier. This can be used to build github branches, local, or custom npm packages of Open MCT

```bash
mct-cli build --npmPackage <npm package specifier>
```

### List available plugins configured for a given instance

```bash
mct-cli plugins list
```

### Install a plugin

```bash
mct-cli plugins add <plugin or npm package specifier>
```

```bash
mct-cli plugins add <plugin name> --npmPackage <npm package specifier>
```

### Remove a plugin

```bash
mct-cli plugins remove <plugin-name>
```

### Configure an installed plugin

```bash
mct-cli plugins configure <plugin-name> --enabled <true|false> --npmPackage <npm package specifier> --options <options>
```

## Options
* `-i`, `--instance` <instance-name>: Specify an instance name (default: 'default')
* `-r`, `--recipe` <recipe>: Specify a recipe for plugin installation

## Examples

1. Deploy a new default instance of Open MCT
```bash
mct-cli build
```

2. Deploy a new named instance of Open MCT
```bash
mct-cli build --instance my-instance
```

3. Deploy a new default instance of Open MCT using a specific version
```bash
mct-cli build --version latest
```

4. Deploy a new default instance of Open MCT using a specific npm package
```bash
mct-cli build --npmPackage nasa/openmct#gold
```

5. Install a plugin to the default instance:
```bash
mct-cli plugins add akhenry/openmct-yamcs
```
6. Install a plugin to a specific instance:
```bash
mct-cli -i my-instance plugins add akhenry/openmct-mcws
```
7. Remove a plugin from the default instance:
```bash
mct-cli plugins remove openmct-yamcs
```
8. Remove a plugin from a specific instance:
```bash
mct-cli -i my-instance plugins remove openmct-mcws
```
9. List plugins installed for the default instance:
```bash
mct-cli plugins list
```
10. List plugins installed for a specific instance:
```bash
mct-cli -i my-instance plugins list
```
11. Configure an installed plugin:
```bash
mct-cli plugins configure openmct.plugins.PlanLayout --enabled true --options '{"creatable": true}'
```
12. Override a default plugin:
```bash
mct-cli plugins configure openmct.plugins.Espresso --enabled false
# With espresso disabled some theme needs to be applied. Apply the snow theme.
mct-cli plugins add openmct.plugins.Snow
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