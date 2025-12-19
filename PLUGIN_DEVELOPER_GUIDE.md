# mct-cli Plugin Developer Guide

This guide explains how to prepare your Open MCT plugin for use with **mct-cli**, the Open MCT Configuration Tool.

## Overview

mct-cli allows developers to build an Open MCT deployment and install and manage Open MCT plugins through a command-line interface. To make your plugin compatible with mct-cli, you need to follow a few key conventions.

## TL;DR

1. Open MCT plugins are npm packages
2. Your plugin needs to have a `package.json` file, per the npm standard
3. Your package.json should define a `main` field that points to the entry point of your plugin. This should be a file that exports an Open MCT install function.
4. Your package.json should define a `type` field that is either "commonjs" or "module" depending on whether you are using CommonJS or ES6 modules respectively.
5. Your package.json should define a `peerDependencies` field that lists the version(s) of Open MCT your plugin is compatible with.
6. Your plugin should export an install function that takes an Open MCT instance and, optionally, an options object as arguments.

## Plugin Structure

Your plugin should be published as an npm package with a clear entry point that exports an install function. It is also good practice to include a peerDependencies field in your package.json to specify the version(s) of Open MCT your plugin is compatible with.

mct-cli is compatible with UMD and ES6 modules. To specify that your plugin is an ES6 module, include a "type": "module" field in your package.json. The default type is "commonjs", but this can also be specified manually.

### Basic Plugin Package.json

```json
{
  "name": "@myorg/openmct-my-plugin",
  "version": "1.0.0",
  "description": "My awesome Open MCT plugin",
  "main": "dist/index.js",
  "type": "module",
  "peerDependencies": {
    "openmct": "^3.0.0"
  }
}
```

## Script Entry Point

Your scripts's main entry point must export a function that, when executed, will return an install function. The outer function may optionall accept an options object as an argument. The options object will be populated from one of three sources, in descending order of priority:
1. Any options specified on the command line
2. Any options specified in a provided recipe
3. Any options specified in the YAML configuration file

The returned install function takes an Open MCT instance as an argument.

### Example Plugin
The example below will install a new object view provider that creates a new "hello world" object view.
```javascript
// src/index.js
export default function myPlugin(options?) {
  return function install(openmct) {
  // Register your plugin with Open MCT
  openmct.objectViews.addProvider({
    canView(object) {
      return true;
    },
    canEdit(object) {
      return false;
    },
    view(object) {
      return {
        show(domElement) {
            domElement.innerHTML = '<div>Hello World!</div>';
        }
      };
    }
  });
  }
}
```

## Adding a plugin with mct-cli

### For plugins published to GitHub or NPM
Once your plugin is published to npm, users can install it using mct-cli:

```bash
# Install to default instance
mct-cli plugins add @myorg/my-openmct-plugin

# Install plugin to a specific instance
mct-cli -i my-instance plugins add @myorg/openmct-my-plugin

```

The above is shorthand for:

```bash
# Install to default instance
mct-cli plugins add my-openmct-plugin --source npm --npmPackage @myorg/my-openmct-plugin

# Install plugin to a specific instance
mct-cli -i my-instance plugins add openmct-my-plugin  --source npm --npmPackage @myorg/my-openmct-plugin
```

### For plugins available locally

```bash
# Install to default instance
mct-cli plugins add file:../path/to/your/plugin

# Install plugin to a specific instance
mct-cli -i my-instance plugins add file:../path/to/your/plugin
```
The above is shorthand for:

```bash
# Install to default instance
mct-cli plugins add my-local-plugin --npmPackage ../path/to/your/plugin

# Install plugin to a specific instance
mct-cli -i my-instance plugins add my-local-plugin --npmPackage ../path/to/your/plugin
```

## Removing a plugin with mct-cli

Note that when removing a plugin, you only need to specify the package name, not the source or npm package.

```bash
# Remove plugin from default instance
mct-cli plugins remove my-openmct-plugin

# Remove plugin from specific instance
mct-cli -i my-instance plugins remove my-openmct-plugin
```

## Plugin Configuration

Plugins can be configured through mct-cli by specifying options in the YAML configuration file or via the command line.

### YAML Configuration

When a plugin is installed, it's added to the instance's configuration YAML:

```yaml
openmct:
  version: stable
  plugins:
    - akhenry/openmct-yamcs:
        options:
          customSetting: "my-value"
```

### Plugin Definition Schema

Each plugin in the configuration can have the following properties:

- **enabled** (boolean): Whether the plugin is enabled (default: true). This can be used to override plugins that are enabled by default.
- **options** (object): Configuration options passed to the plugin at install time (optional). These will be converted to a JavaScript object and passed into the object install function as a second argument.

#### Specifying Options

Options can be specified in the YAML configuration file or via the command line.

```Yaml
openmct:
  version: stable
  plugins:
    - akhenry/openmct-yamcs:
        options:
          customSetting: "my-value"
```

```bash
mct-cli plugins configure openmct-my-plugin --options '{"customMessage": "value"}'
```

Note: An options object with named properties is the preferred approach for reasons of user friendliness, but for legacy support an array of JavaScript primitives and / or objects may also be specified here.

```Yaml
openmct:
  version: stable
  plugins:
    - akhenry/openmct-yamcs:
        options:
          - true
          - "my-value"
          - 1234
          - 
            - An Array
            - Of Values
```

```bash
mct-cli plugins configure openmct-my-plugin --options '[true, "my-value", 1234, ["An Array", "Of Values"]]'
```


### Example Instance Configuration specifying a combination of builtin and npm plugins

```yaml
openmct:
  version: stable
  plugins:
    # Builtin plugin
    - openmct.plugins.LocalStorage
    
    # Plugin with options
    - openmct-my-plugin:
      source: npm
      npmPackage: @myorg/my-openmct-plugin
      options:
        customMessage: "value"
```

```javascript

export default function myPlugin(openmct, options?) {
  return function install(openmct) {
    //'options' object here will be {customMessage: "Hello Universe"}
    openmct.objectViews.addProvider({
      canView(object) {
        return true;
      },
      canEdit(object) {
        return false;
      },
      view(object) {
        return {
          show(domElement) {
              domElement.innerHTML = `<div>${options?.customMessage ? options.customMessage : 'Hello World!'}</div>`;
          }
        };
      }
    });
  }
}
```

## Publishing Your Plugin

1. Update your `package.json` with correct version information. Npm uses semver, more information is available here - https://docs.npmjs.com/about-semantic-versioning
2. * Best practice: Update your `package.json` with a `peerDependencies` entry for Open MCT, specifying the version of Open MCT that this version of your plugin has been tested with. This allows the Open MCT build tool to identify version incompatibilities. We strongly recommend specifying an npm version of Open MCT, and not a GitHub version as this avoids the need to compile from source.
2. Build your plugin
3. Publish to npm: `npm publish`
4. Users can now install it with mct-cli