# OpenMCT Configurator

This tool helps configure OpenMCT applications using YAML configuration files.

## TODO
- [X] Support single Open MCT instance of latest stable with built-in plugins
- [X] Support initialization of instance from external yaml file.
- [X] Support initialization of an instance from scratch
- [X] Support multiple Open MCT instances
- [X] Support adding builtin plugins via CLI
- [X] Support removing builtin plugins via CLI
- [] Support adding npm plugins via CLI
- [] Support removing npm plugins via CLI

- [ ] Demo
- [ ] Tests
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