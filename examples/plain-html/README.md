# Plain HTML example

A static page that uses Bootcn components. It is also the fixture for the
end-to-end test in `tests/e2e/install.spec.ts`.

Plain HTML has no includes, so the markup from `components/ui/*.html` is copied
into `index.html`; the CSS and JavaScript come from the files the CLI installs.
From the repository root:

```bash
pnpm build
node packages/cli/dist/index.js init --yes --cwd examples/plain-html --registry packages/registry/dist
node packages/cli/dist/index.js add button dialog --yes --cwd examples/plain-html
```

Then serve the folder with any static server (for example
`python3 -m http.server -d examples/plain-html`) and open it. Bootstrap 5.3 is
loaded from jsDelivr with SRI hashes; no Node.js is needed at runtime.
