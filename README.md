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

- [ ] Demo
   - Start with context, show a diagram
   - Start from scratch, create a new default instance
      - Use stable initially
      - Switch to latest
      - launch http-server to demonstrate
   - Customize it by enabling a another builtin plugin.
      - SWG?
      - launch http-server to demonstrate
   - Customize it by adding an npm plugin (openmct-yamcs)
   - Now, this is all very manual, how do I define "recipes"?
      - Discuss templates
      - Open the default template
      - Open the yamcs.yaml template
      - Talk about the format and how options etc. are specified
   - Talk about instances
      - Create a new instance named something else
      - Explain why this is important.
   - Talk about the codebase
      - Yaml schema and how Yaml files get validated
      - Show our Open MCT custom schema and how it enables IDE support
      - All implemented in TypeScript
   - Roadmap and where this fits in it
- [ ] Tests
- [ ] Error on version incompatibilities
- [ ] Externalize initialization block to local plugin

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