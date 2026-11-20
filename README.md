# PR Lens for Control Room

A [Control Room](https://github.com/Tenjin-Tech/control-room) community plugin. When an agent finishes a code change that spans several files, it draws the change as one picture and shows it in the thread, under its summary: the parts in lanes, each marked new, changed, removed or unchanged, and how they connect.

Drawn with [PR Lens](https://www.npmjs.com/package/@coldtea/pr-lens-cli) (`@coldtea/pr-lens-cli`, MIT, by Coldtea AI).

## What it does

- Adds one rule to every agent session: after a multi-file change, write `.context/pr-lens/graph.json` from the diff ([GUIDE.md](GUIDE.md)), then run `draw.js`.
- `draw.js` fills the graph's provenance from git, then runs the CLI's `validate` and `render`, and prints the markdown line that shows the SVG.
- The picture follows the app's theme (dark or light) at each agent launch.
- Pull request bodies and tickets keep their Mermaid diagram: they cannot show a file on your Mac.

## Network and privacy

- Each Mac fetches the pinned CLI, `@coldtea/pr-lens-cli@0.15.2`, from npm through `npx`.
- Only `validate` and `render` run, locally. Never `analyze`, `canvas` or `auth`, which would send code or the graph to another service.
- Everything is written under `.context/pr-lens/`, which gets its own `.gitignore` of `*`: nothing is committed.

## Install

Needs Node.js (with `npx`) and git.

```sh
git clone https://github.com/Tenjin-Tech/control-room-pr-lens ~/.nightshift/control-room/plugins/pr-lens
```

The folder must be named `pr-lens`, the plugin's id. Then turn it on in Control Room: **Settings › Community plugins**.

## Update

```sh
git -C ~/.nightshift/control-room/plugins/pr-lens pull
```

Control Room approves a plugin by a hash of every file in its folder. Any change turns it off until you turn it on again, so you see each new version before it runs.

## License

MIT. See [LICENSE](LICENSE).
