# mct-cli - Open MCT Configuration Tool

The `mct-cli` is a command-line interface for building a packaged Open MCT instance that can be deployed to a web server. It allows you to install and remove supported Open MCT plugins.

## Installation

```bash
npm link
```

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

### List available plugins configured for a given instance

```bash
mct-cli plugins list
```

### Install a plugin

```bash
mct-cli plugins install <plugin or npm package specifier>
```

```bash
mct-cli plugins install <plugin name> --npmPackage <npm package specifier>
```

### Remove a plugin

```bash
mct-cli plugins remove <plugin-name>
```

## Options
* `-i`, `--instance` <instance-name>: Specify an instance name (default: 'default')
* `-r`, `--recipe` <recipe>: Specify a recipe for plugin installation

## Examples
1. Install a plugin to the default instance:
```bash
mct-cli plugins add akhenry/openmct-yamcs
```
2. Install a plugin to a specific instance:
```bash
mct-cli -i my-instance plugins add akhenry/openmct-mcws
```
3. Remove a plugin from the default instance:
```bash
mct-cli plugins remove openmct-yamcs
```
4. Install a plugin from a specific instance:
```bash
mct-cli -i my-instance plugins remove openmct-mcws
```
5. List plugins installed for the default instance:
```bash
mct-cli plugins list
```
6. List plugins installed for a specific instance:
```bash
mct-cli -i my-instance plugins list
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