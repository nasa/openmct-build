# Local Plugin Example

This example shows how to create a local plugin and add it to an instance. We encourage Open MCT plugins to be published as npm packages or github repositories as this makes them easier to share and distribute, as in the case of npm packages provides pre-compiled code which speeds up builds.

That said, there are sometimes occasions when it is useful to be able to build an instance that references local code. This is particularly useful during development of a plugin, as it allows you to test changes to the plugin without having to publish it to npm or github.

Additionally, this mechanism allows code to be distributed right alongside a recipe to provide any initialization and configuration that cannot be represented in YAML.

## Descriptions

### hello-world

This plugin adds a simple indicator to the Open MCT interface. It takes a single option, `greeting`, which is used to customize the greeting displayed in the indicator.

### plugin-with-resources

This plugin demonstrates how other non-js assets can be used by a plugin. In this case, it adds a custom stylesheet to the Open MCT interface.

## Usage

```bash
mct build -i mct-examples -r recipe.yaml
```

You can now preview your instance using an HTTP server.

eg.
```bash
npx http-server instance/mct-examples
```

Navigate to `http://localhost:8080` in your browser to view the example instance.
