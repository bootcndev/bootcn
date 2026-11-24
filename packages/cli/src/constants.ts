/** Product name. Every user-facing occurrence derives from this constant. */
export const BRAND = 'bootcn';

/** Display name used in messages. */
export const BRAND_TITLE = 'Bootcn';

/** Project configuration file name. */
export const CONFIG_FILE = `${BRAND}.json`;

/**
 * Hosted registry (GitHub Pages, latest version). Frozen versions live under
 * `${DEFAULT_REGISTRY}/v/<version>`. Moves to a custom domain later.
 */
export const DEFAULT_REGISTRY = `https://tsirosgeorge.github.io/${BRAND}`;

/** JSON schema for bootcn.json, served next to the registry. */
export const CONFIG_SCHEMA_URL = `${DEFAULT_REGISTRY}/schema/config.schema.json`;

/** Item installed by `init` and implicitly by every `add`. */
export const TOKENS_ITEM = 'tokens';

/** Default Bootstrap minor version written to the config. */
export const DEFAULT_BOOTSTRAP = '5.3';

/** Pinned Bootstrap CDN tags with SRI hashes (verified against jsDelivr). */
export const BOOTSTRAP_VERSION = '5.3.9';
export const BOOTSTRAP_CSS_TAG = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@${BOOTSTRAP_VERSION}/dist/css/bootstrap.min.css" integrity="sha384-yEPZ7jP9S0QKiUQ0m3jjsO4ProIW7wvR9gXkI7JOGa2XVsw53Yke2bsdkBbjmmiX" crossorigin="anonymous">`;
export const BOOTSTRAP_JS_TAG = `<script src="https://cdn.jsdelivr.net/npm/bootstrap@${BOOTSTRAP_VERSION}/dist/js/bootstrap.bundle.min.js" integrity="sha384-WyOxWvTyr1QaMPfiPJSv76iReVthorl5uWlFtZPyK0IEB0hGzo9y5Bp9mYanr8Bu" crossorigin="anonymous"></script>`;

/** Exit codes (agent brief section 10.7). */
export const EXIT = {
  ok: 0,
  user: 1,
  registry: 2,
  partial: 3,
} as const;
