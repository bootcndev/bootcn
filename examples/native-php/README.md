# Native PHP example

A minimal PHP site that uses Bootcn components. It is also the fixture for the
end-to-end test in `tests/e2e/install.spec.ts`.

The component files are **not** committed: the CLI installs them. From the
repository root:

```bash
pnpm build
node packages/cli/dist/index.js init --yes --cwd examples/native-php --registry packages/registry/dist
node packages/cli/dist/index.js add button dialog --yes --cwd examples/native-php
php -S 127.0.0.1:8000 -t examples/native-php
```

Then open http://127.0.0.1:8000. Bootstrap 5.3 is loaded from jsDelivr with
SRI hashes in `header.php` and `footer.php`; no Node.js is needed at runtime.
