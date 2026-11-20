# Drawing a code change with PR Lens

One picture of what a change did: its parts in lanes, each marked new, changed, removed or unchanged, and the
connections between them. You write the graph by hand from the diff; the CLI only checks and draws it, on this Mac.

## Steps

1. Read the diff against your base branch: `git diff --stat <base>...`, then `git diff <base>...`.
2. Write `.context/pr-lens/graph.json` at the root of the worktree (below). Leave `provenance` out: the next step
   fills it from git.
3. Run `node <this folder>/draw.js --base <base> --theme <dark or light, as your instructions say>`. It checks the
   document and lists every problem with a path into it: fix them all in graph.json and run it again. Once clean, it
   draws the SVGs into `.context/pr-lens/out/` and prints the markdown line that shows the picture.
4. Put that line in your final message, under your summary. The thread shows the picture; the Artifacts tab lists it.

`.context/pr-lens/` is ignored by git (draw.js puts a `.gitignore` in it): nothing there is ever committed. Never run
PR Lens's `analyze`, `canvas` or `auth`, which send the code or the graph to another service, and never its default
`.pr-lens/` folder, which edits the repository's `.gitignore`. A pull request body or a ticket cannot show a file on
this Mac: they keep their Mermaid diagram.

## The document

```json
{
  "schemaVersion": "0.3.1",
  "kind": "graph",
  "title": "Queue broadcast sends",
  "summary": "One short paragraph: what does this change do?",
  "lenses": ["architecture"],
  "lanes": [
    { "id": "api", "label": "API", "order": 0 },
    { "id": "worker", "label": "Worker", "order": 1 },
    { "id": "external", "label": "Email provider", "order": 2 }
  ],
  "nodes": [
    { "id": "send-route", "label": "POST /broadcasts/:id/send", "kind": "route", "delta": "modified", "lane": "api",
      "subtitle": "routes/broadcasts.ts", "files": [{ "path": "src/routes/broadcasts.ts", "startLine": 40, "endLine": 72 }] },
    { "id": "send-job", "label": "sendBroadcast", "kind": "job", "delta": "added", "lane": "worker",
      "summary": "Sends a broadcast in batches of 500." },
    { "id": "provider", "label": "Postmark", "kind": "external", "delta": "unchanged", "lane": "external" }
  ],
  "edges": [
    { "id": "route-to-job", "from": "send-route", "to": "send-job", "kind": "queue", "delta": "added",
      "label": "enqueue", "emphasis": "hero", "animated": true },
    { "id": "job-to-provider", "from": "send-job", "to": "provider", "kind": "http", "delta": "added", "label": "POST /email/batch" }
  ],
  "flows": [],
  "stats": { "filesChanged": 6, "additions": 210, "deletions": 95 },
  "views": [
    { "id": "overview", "title": "Where the change lives", "lens": "architecture", "defaultOpen": true, "scope": { "kind": "all" } }
  ]
}
```

Every key is checked: an unknown one is an error. Keys with a default may be left out.

- **Ids**: readable kebab-case (`send-job`, not `n1`), unique in their own list, `[A-Za-z0-9][A-Za-z0-9._:/-]*`.
- **delta** on every node, edge, flow and flow step: `added`, `modified`, `removed`, `unchanged`. Add the unchanged
  neighbours the change touches: without them nobody can tell where the change sits.
- **lanes** (1-16): how a reader thinks of the system (a process, a tier, a service, an outside system), not the
  folder tree. `order` places them left to right. Every node is in exactly one.
- **nodes**: `kind` is one of `service app module function route job queue datastore cache external ui config test
  package other` (it only picks the icon). `subtitle` is a short second line (a file name works). `files` are
  repository paths, no leading `/`; use `"revision": "base"` on a removed node. Labels stay short: about 30 characters.
- **edges**: `from` and `to` must be node ids you declared (the most common error). `kind` is one of `call http rpc
  event queue data dependency render other`. One `"emphasis": "hero"` edge, two at most: the connection the change is about.
- **stats**: from `git diff --shortstat origin/main...`.

## A flow, when there is a sequence worth showing

Add `"data-flow"` to `lenses`, a flow, and a view of it:

```json
"flows": [{
  "id": "send", "title": "Sending a broadcast", "delta": "modified",
  "participants": [{ "node": "send-route" }, { "node": "send-job" }, { "node": "provider" }],
  "messages": [
    { "id": "enqueue", "from": "send-route", "to": "send-job", "label": "enqueue", "kind": "async", "delta": "added" },
    { "id": "post", "from": "send-job", "to": "provider", "label": "500 emails", "kind": "sync", "delta": "added", "repeat": 4 },
    { "id": "ok", "from": "provider", "to": "send-job", "label": "200", "kind": "return", "delta": "added" }
  ]
}]
```
and in `views`: `{ "id": "send-flow", "title": "Sending a broadcast", "lens": "data-flow", "scope": { "kind": "selection", "flows": ["send"] } }`.

2-12 participants, each a node id; message order is array order; `kind` is `sync`, `async`, `return` or `self`
(`self` only when `from` equals `to`); both ends of a message must be participants of that flow.

## A walkthrough, only when the change has several parts

It plays the change step by step in its own SVG. 2 to 12 steps; each is one change, never a description:

```json
"walkthrough": { "steps": [
  { "id": "queued", "heading": "Route now queues the send", "body": "The API answers at once. A worker sends the mail later.",
    "stage": { "kind": "view", "view": "overview" }, "focus": { "kind": "selection", "nodes": ["send-route"] } },
  { "id": "batches", "heading": "Postmark now gets 500 emails per call", "body": "One call per batch instead of one per person.",
    "stage": { "kind": "flow", "flow": "send" }, "focus": { "kind": "selection", "messages": ["post", "ok"] } }
] }
```

`heading` up to 48 characters, built from change words (added, removed, now, replaced, moved); `body` up to 140, what
it means for behaviour; short common words. A focus names one node on a view of five cards or more, up to three
nodes on a smaller one, up to three flow steps in a row on a flow; never a lane. `messages` only on a flow stage.
