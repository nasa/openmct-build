# Dynamic Substitution Example

This example shows how `${dynamic:...}` markers produce values that are
**re-evaluated every time they are used**, instead of being frozen when the
instance loads.

Regular time-math expressions such as `${now} - ${one_day}` are resolved once
during plugin install. A value wrapped as `"${dynamic:${now} - ${two_hours}}"`
instead resolves to a closure that runs the same time expression fresh on
every call.

## When to use this

Only where the receiving code invokes function values. The canonical consumer
is the Open MCT time conductor: preset bounds declared as functions are
evaluated each time the preset is clicked, so a "Last 2 hours" preset stays
accurate no matter how long the session has been open. A dynamic marker
landing where a plain string or number is expected will misbehave — use
markers deliberately, per receiving API.

## This recipe

Builds an instance with the core conductor and two fixed-mode presets on the
`utc` time system:

- `Last Day (frozen at load)` uses eager `${now}` expressions. Its bounds are
  computed once at page load.
- `Last 2 hours (dynamic)` uses `${dynamic:...}` markers. Its bounds are
  recomputed on every click.

## Usage

From this directory:

```bash
mct build -i mct-dynamic-example -r recipe.yaml
```

Preview the instance using an HTTP server.

eg.

```bash
npx http-server instances/mct-dynamic-example
```

Open the time conductor menu and compare the two presets after leaving the
page open: the dynamic preset tracks click time, the frozen one tracks load
time.
