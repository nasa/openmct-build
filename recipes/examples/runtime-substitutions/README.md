# Runtime Substitution Example

This example shows how plugins can register **runtime substitutions** — values computed when the Open MCT instance loads — and how later plugins can consume those values via `${token}` placeholders in recipe options.

Unlike build-time substitutions (which are resolved when `mct build` runs), runtime substitutions are registered by a plugin during install using `registerRuntimeSubstitution`. They are useful when a value depends on the browser environment or on logic that cannot be expressed in YAML alone.

In this example, one plugin calculates sunrise for a location and registers the results. A second plugin receives those values through its recipe options and displays them in a simple Open MCT view.

## How it works

1. `sunrise-calculation-plugin` installs first. It calculates sunrise (defaulting to Pasadena coordinates) and registers:
   - `${sunriseTime}`
   - `${sunriseDate}`
   - `${sunriseLatitude}`
   - `${sunriseLongitude}`
2. `sunrise-plugin` installs next. Its options in `recipe.yaml` reference those tokens (for example, `sunriseTime: ${sunriseTime}`).
3. Before install, the builder resolves the tokens and passes the real values into the plugin.
4. `sunrise-plugin` adds a **Sunrise** object to the tree and renders a view with the substituted values.

Plugin order in the recipe matters: the plugin that registers substitutions must appear **before** any plugin that consumes them.

## Descriptions

### sunrise-calculation-plugin

Calculates sunrise for a given date and location using a NOAA-style solar-position algorithm, then registers the results as runtime substitutions.

Optional recipe options:

| Option | Default | Description |
| --- | --- | --- |
| `latitude` | `34.05` | Latitude in decimal degrees |
| `longitude` | `-118.25` | Longitude in decimal degrees |
| `date` | current date | Date used for the sunrise calculation |

Example with custom coordinates:

```yaml
- sunrise-calculation-plugin:
    npmPackage: file:./sunrise-calculation-plugin
    options:
      latitude: 37.77
      longitude: -122.42
```
This plugin does not add UI of its own. It returns a no-op install function after registering substitutions.

### sunrise-plugin
Consumes the substituted sunrise values and displays them in Open MCT:

- Registers a non-creatable `sunrise` object type
- Adds a root **Sunrise** object to the tree
- Provides a view that shows sunrise time, date, latitude, and longitude

Recipe options (normally filled by substitutions):

| Option | Description |
| --- | --- |
| `sunriseTime` | Formatted local sunrise time |
| `sunriseDate` | Formatted date used for the calculation |
| `sunriseLatitude` | Latitude used for the calculation |
| `sunriseLongitude` | Longitude used for the calculation |


## Usage
From this directory:

```bash
mct build -i mct-examples -r recipe.yaml
```

You can now preview your instance using an HTTP server.

eg.
```bash
npx http-server instance/mct-examples
```

Navigate to `http://localhost:8080` in your browser and select Sunrise in the tree.
