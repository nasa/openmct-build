# Representations of Plugins
## Yaml
### Purpose
This is the canonical representation of an Open MCT Plugin for the purposes of configuring an Open MCT instance. Yaml is chosen for its widespread support in development tools, and its familiarity to developers and systems administrators.
### Example
```YAML
    - openmct.plugins.PlanLayout:
        options:
            creatable: true
```

## JSON
### Purpose

The purpose of the JSON representation of Open MCT plugins is to provide a schema for validation of YAML configuration from IDEs that support it. Additionally, it allows for useful errors to be thrown when invalid configuration is provided. This is to aid developers and systems administrators in defining configuration that conforms to the expected format.

### Example
```JSON
"plugin": {
    "type": "object",
    "properties": {
        "source": {
            "type": "string",
            "enum": ["npm", "github", "local", "builtin"],
            "default": "builtin"
        },
        "version": {
            "type": "string",
            "description": "Version of the plugin to use"
        },
        "options": {
            "type": "object",
            "description": "The options to be passed to the plugin at install time"
        }
    },
    "additionalProperties": true
}
```

## PluginMap and Plugin

### Purpose
This is used in the JSON Schema representation of the Yaml plugin definition. Its purpose is to support validation of Yaml configuration to assist Users and Developers.

### Example
```JavaScript
{
    LocalClock: {
        source: 'local',
        version: 'latest',
        options: {
            startOffset: -12000,
            endOffset: 0
        }
    }
}
```

## OpenMctPlugin
### Purpose
?
