import { describe, expect, it } from 'vitest';

import { createConfig, parseConfig } from '../src/config.js';
import { renderContent, targetPath } from '../src/installer.js';
import { defaultPaths } from '../src/project.js';

const page = (target: string, content: string) => ({ type: 'registry:page', target, content });

describe('registry:page files', () => {
  const html = defaultPaths('html', false);
  const config = createConfig('https://example.test', '5.3', html);

  it('install at the project root when paths.pages is not set', () => {
    expect(config.paths.pages).toBeUndefined();
    expect(targetPath(config, page('admin.html', ''))).toBe('admin.html');
  });

  it('install under paths.pages when set', () => {
    const php = createConfig('https://example.test', '5.3', defaultPaths('php', true));
    expect(php.paths.pages).toBe('public');
    expect(targetPath(php, page('admin.html', ''))).toBe('public/admin.html');
  });

  it('replace placeholders with paths relative to the page', () => {
    const content =
      '<link href="{{bootcn:css}}/tokens.css"><script src="{{bootcn:js}}/a.js"></script>{{bootcn:components}}|{{bootcn:lib}}';
    expect(renderContent(config, page('admin.html', content))).toBe(
      '<link href="assets/css/tokens.css"><script src="assets/js/a.js"></script>components/ui|assets/js/lib',
    );

    const php = createConfig('https://example.test', '5.3', defaultPaths('php', true));
    expect(renderContent(php, page('admin.html', '{{bootcn:css}}/x.css'))).toBe('assets/css/x.css');

    const nested = parseConfig({ ...config, paths: { ...config.paths, pages: 'pages/admin' } });
    expect(renderContent(nested, page('index.html', '{{bootcn:css}}/x.css'))).toBe(
      '../../assets/css/x.css',
    );
  });

  it('leave other file types untouched', () => {
    const file = { type: 'registry:style', target: 'a.css', content: '/* {{bootcn:css}} */' };
    expect(renderContent(config, file)).toBe(file.content);
  });

  it('reject an unsafe paths.pages', () => {
    expect(() =>
      parseConfig({ ...config, paths: { ...config.paths, pages: '../outside' } }),
    ).toThrow();
  });
});
