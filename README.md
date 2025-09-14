# OpenMCT Configurator

This tool helps configure OpenMCT applications using YAML configuration files.

## TODO
- [X] Support single Open MCT instance of latest stable with built-in plugins
- [X] Support initialization of instance from external yaml file.
- [X] Support initialization of an instance from scratch
- [X] Support multiple Open MCT instances
- [X] Support adding builtin plugins via CLI
- [X] Support removing builtin plugins via CLI
- [X] Support adding npm plugins via CLI
- [X] Support removing npm plugins via CLI

- [x] Demo
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
- [x] Plugins remove needs to uninstall npm dependency
- [ ] Tests
- [ ] Externalize initialization block to local plugin
- [ ] Should be able to reference plugins by their configured or resolved name. (eg. akhenry/openmct-yamcs OR openmct-yamcs)
- [ ] In general better user feedback
- [ ] Error on version incompatibilities

## Improvements to OMM
- [ ] package.json should identify the source location.

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