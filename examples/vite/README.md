# Vite example

Bootcn components in a Vite project. Vite is optional: the installed files are
plain CSS and JavaScript, and Vite simply bundles them through `main.js`. This
folder is also the fixture for the Vite case in `tests/e2e/install.spec.ts`.

The component files are **not** committed: the CLI installs them. From the
repository root:

```bash
pnpm build
node packages/cli/dist/index.js init --yes --cwd examples/vite --registry packages/registry/dist
node packages/cli/dist/index.js add button dialog --yes --cwd examples/vite
pnpm exec vite examples/vite          # dev server
pnpm exec vite build examples/vite    # production build in examples/vite/dist
```

Bootstrap 5.3 stays on the CDN (with SRI) in `index.html`, so there is a
single copy of Bootstrap. To bundle Bootstrap instead, install it with npm,
import its CSS and JS in `main.js` and remove the CDN tags. Bootcn components
read `window.bootstrap`, so expose it: `window.bootstrap = bootstrap`.
