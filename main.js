// PR Lens: agents draw a code change they made as an SVG, drawn on this Mac, shown in the thread (![alt](/abs.svg)).
// Only the CLI's local commands (draw.js): analyze, canvas and auth would send the code or the graph to another service.
const path = require('path')
const { nativeTheme } = require('electron')

const GUIDE = path.join(__dirname, 'GUIDE.md'), DRAW = path.join(__dirname, 'draw.js')

const rule = (theme) => `When you finish a change to code that spans several files or parts (not a one-file fix, a question or an investigation), also draw it with PR Lens and show the picture in the thread, under your summary. Read ${GUIDE} first. Write .context/pr-lens/graph.json in the worktree by hand from the diff against your base branch, then run \`node ${DRAW} --base <your base, e.g. origin/main> --theme ${theme}\` until it prints the markdown that shows the picture, and put that line in your final message. Never run PR Lens's analyze, canvas or auth commands. The pull request body and the ticket keep their Mermaid diagram: they cannot show a file on this Mac. If drawing fails twice, say so in one line and go on without it.`

module.exports = (api) => {
  // read at each agent launch, so the picture matches the app's theme of that moment
  api.prompt('session', () => rule(nativeTheme.shouldUseDarkColors ? 'dark' : 'light'))
}
