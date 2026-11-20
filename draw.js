#!/usr/bin/env node
// node draw.js [--base <ref>] [--theme dark|light]: checks and draws .context/pr-lens/graph.json of the repository it runs in,
// into .context/pr-lens/out/, and prints the markdown that shows it. Everything stays on this Mac: only the CLI's validate and render.
const { execFileSync, spawnSync } = require('child_process')
const fs = require('fs'), path = require('path')

const CLI = '@coldtea/pr-lens-cli@0.15.2' // pinned: a new version runs only after this file changes and the plugin is turned on again
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback }
const theme = arg('--theme', 'dark'), base = arg('--base', 'origin/main')
if (!['dark', 'light'].includes(theme)) fail('--theme is dark or light')
const git = (...a) => { try { return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return '' } }
function fail(message) { console.error(`PR Lens: ${message}`); process.exit(1) }

const root = git('rev-parse', '--show-toplevel') || fail('not inside a git repository')
const dir = path.join(root, '.context', 'pr-lens'), doc = path.join(dir, 'graph.json'), out = path.join(dir, 'out')
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, '.gitignore'), '*\n') // ignored by git in any repository, whatever its own .gitignore says
if (!fs.existsSync(doc)) fail(`write ${path.relative(root, doc)} first (see GUIDE.md beside this script)`)

// provenance from git, never invented: the repository, the base and the head
let graph
try { graph = JSON.parse(fs.readFileSync(doc, 'utf8')) } catch (e) { fail(`${path.relative(root, doc)} is not JSON: ${e.message}`) }
const remote = git('remote', 'get-url', 'origin').match(/[/:]([^/:]+)\/([^/]+?)(?:\.git)?$/)
const head = git('rev-parse', 'HEAD'), from = git('merge-base', base, 'HEAD')
if (!head || !from) fail(`no merge base between ${base} and HEAD: pass --base <the branch this work started from>`)
graph.provenance = { repo: { owner: remote?.[1] || 'local', name: remote?.[2] || path.basename(root) }, base: { sha: from }, head: { sha: head } }
fs.writeFileSync(doc, JSON.stringify(graph, null, 2) + '\n')

const npx = (...a) => spawnSync('npx', ['-y', CLI, ...a], { cwd: dir, encoding: 'utf8' })
const checked = npx('validate', doc)
if (checked.status !== 0) { process.stdout.write(checked.stdout + checked.stderr); fail('fix every problem above in graph.json, then run this again') }
fs.rmSync(out, { recursive: true, force: true }) // no picture of an earlier draft left beside the new one
const drawn = npx('render', doc, '-o', out, '--theme', theme)
if (drawn.status !== 0) { process.stdout.write(drawn.stdout + drawn.stderr); fail('render failed') }

const svgs = fs.readdirSync(out).filter(f => f.endsWith('.svg'))
const pick = (prefix) => svgs.find(f => f.startsWith(prefix + '-' + theme + '-'))
const overview = pick('overview') || svgs.find(f => !f.startsWith('walkthrough-')), tour = pick('walkthrough')
const title = String(graph.title || 'the change').replace(/[\[\]]/g, '')
console.log(`Drawn. Show it in your final message, under your summary:\n\n![PR Lens: ${title}](${path.join(out, overview)})`)
if (tour) console.log(`\nIts walkthrough, which plays each step, if you want it under that:\n\n![PR Lens walkthrough: ${title}](${path.join(out, tour)})`)
