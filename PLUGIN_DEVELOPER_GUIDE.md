# mct-cli Plugin Developer Guide

This guide explains how to prepare your Open MCT plugin for use with **mct-cli**, the Open MCT Configuration Tool.

## Overview

mct-cli allows developers to install and manage Open MCT plugins through a command-line interface. To make your plugin compatible with mct-cli, you need to follow a few key conventions.

## Plugin Structure

Your plugin should be published as an npm package with a clear entry point that exports an install function.

### Basic Plugin Package

```json
{
  "name": "@myorg/openmct-my-plugin",
  "version": "1.0.0",
  "description": "My awesome Open MCT plugin",
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js"
  },
  "peerDependencies": {
    "openmct": "^3.0.0"
  }
}
```

## Script Entry Point

Your scripts's main entry point must export an install function that installs any plugins made available by your package.

### Example Plugin

```javascript
// src/index.js
export default function installMyPlugin(openmct, options?) {
  // Register your plugin with Open MCT
  openmct.install(openmct.plugins.MyPlugin(options));
}
```

## Installation with mct-cli

### For plugins published to GitHub or NPM
Once your plugin is published to npm, users can install it using mct-cli:

```bash
# Install to default instance
mct-cli plugins install @myorg/my-openmct-plugin

# Install to a specific instance
mct-cli -i my-instance plugins install @myorg/openmct-my-plugin

# Install a specific version
mct-cli plugins install @myorg/openmct-my-plugin --version 1.0.0
```

### For plugins available locally


## Plugin Configuration

Plugins can be configured through mct-cli by specifying options in the YAML configuration file or via the command line.

### YAML Configuration

When a plugin is installed, it's added to the instance's configuration YAML:

```yaml
openmct:
  version: stable
  plugins:
    - @myorg/openmct-my-plugin:
        options:
          enabled: true
          customSetting: "my-value"
```

### Plugin Definition Schema

Each plugin in the configuration can have the following properties:

- **source** (string): Where the plugin comes from
  - `npm` - Published npm package (default for non-builtin plugins)
  - `github` - GitHub repository
  - `local` - Local file system
  - `builtin` - Built-in Open MCT plugin

- **entryPoint** (string): The script that exports the install function (optional, defaults to package main)

- **version** (string): Specific version of the plugin to use (optional)

- **options** (object): Configuration options passed to the plugin at install time (optional)

### Example Configuration

```yaml
openmct:
  version: stable
  plugins:
    # Simple plugin reference
    - openmct.plugins.LocalStorage
    
    # Plugin with options
    - @myorg/openmct-my-plugin:
        options:
          enabled: true
          customSetting: "value"
    
    # Plugin with custom entry point
    - @myorg/openmct-advanced-plugin:
        entryPoint: "dist/custom-entry.js"
        options:
          apiUrl: "https://api.example.com"
```

## Best Practices

### 1. Export a Default Function

Always export your install function as the default export:

```javascript
export default function installMyPlugin(openmct, options) {
  // Plugin installation code
}
```

### 2. Accept Options Parameter

Your install function should accept an options object to allow configuration:

```javascript
export default function installMyPlugin(openmct, options = {}) {
  const {
    enabled = true,
    customSetting = 'default'
  } = options;
  
  // Use options in your plugin
}
```

### 3. Handle Missing Dependencies

Gracefully handle cases where Open MCT or required plugins are not available:

```javascript
export default function installMyPlugin(openmct, options = {}) {
  if (!openmct) {
    console.error('Open MCT is required');
    return;
  }
  
  // Plugin installation code
}
```

### 4. Document Configuration Options

Provide clear documentation of all available options:

```javascript
/**
 * Install My Plugin
 * @param {OpenMCT} openmct - The Open MCT instance
 * @param {Object} options - Plugin options
 * @param {boolean} options.enabled - Enable the plugin (default: true)
 * @param {string} options.customSetting - Custom setting value (default: 'default')
 */
export default function installMyPlugin(openmct, options = {}) {
  // Implementation
}
```

### 5. Use Semantic Versioning

Follow semantic versioning (MAJOR.MINOR.PATCH) for your plugin releases to ensure compatibility.

### 6. Specify Peer Dependencies

Clearly specify which version of Open MCT your plugin requires:

```json
{
  "peerDependencies": {
    "openmct": "^3.0.0"
  }
}
```

## Testing Your Plugin with mct-cli

To test your plugin locally before publishing:

1. Build your plugin:
   ```bash
   npm run build
   ```

2. Link it locally:
   ```bash
   npm link
   ```

3. Install it to a test instance:
   ```bash
   mct-cli -i test-instance plugins install file:../path/to/your/plugin
   ```

4. Build and run the instance:
   ```bash
   mct-cli build -i test-instance
   ```

## Publishing Your Plugin

1. Update your `package.json` with correct metadata
2. Build your plugin: `npm run build`
3. Publish to npm: `npm publish`
4. Users can now install it with mct-cli

## Troubleshooting

### Plugin not found
- Ensure your package is published to npm
- Check the package name matches what you're installing

### Plugin not loading
- Verify the entry point exports a default function
- Check that the function accepts `(openmct, options)` parameters
- Review browser console for errors

### Options not being applied
- Ensure your install function reads from the options parameter
- Verify the YAML configuration is correctly formatted
- Check that option names match your implementation

## Support

For more information about Open MCT plugin development, visit the [Open MCT documentation](https://nasa.github.io/openmct/).
