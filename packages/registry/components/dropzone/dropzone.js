(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.dropzone) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-dropzone]';
  const uploads = new WeakMap(); // <li> -> { file, xhr }
  let listening = false;
  let counter = 0;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function size(bytes) {
    const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'];
    let value = bytes;
    let unit = 0;
    while (value >= 1000 && unit < units.length - 1) {
      value /= 1000;
      unit++;
    }
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'unit',
        unit: units[unit],
        unitDisplay: 'short',
        maximumFractionDigits: unit ? 1 : 0,
      }).format(value);
    } catch {
      return Math.round(value) + ' ' + ['B', 'kB', 'MB', 'GB'][unit];
    }
  }

  // The same rules as the input's accept attribute: ".pdf", "image/*", "text/csv".
  function accepted(file, accept) {
    if (!accept) return true;
    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();
    return accept.split(',').some(function (rule) {
      rule = rule.trim().toLowerCase();
      if (!rule) return false;
      if (rule.charAt(0) === '.') return name.endsWith(rule);
      if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
      return type === rule;
    });
  }

  function q(root, name) {
    return root.querySelector('[data-bootcn-dropzone-' + name + ']');
  }

  function announce(root, text) {
    const live = q(root, 'live');
    if (live) live.textContent = text;
  }

  function fileIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML =
      '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" />';
    return svg;
  }

  function item(root, file) {
    const li = document.createElement('li');
    li.className = 'bootcn-dropzone__file';
    li.id = 'bootcn-upload-' + ++counter;
    const thumb = document.createElement('span');
    thumb.className = 'bootcn-dropzone__thumb';
    if (/^image\//.test(file.type) && window.URL && URL.createObjectURL) {
      const img = document.createElement('img');
      img.alt = '';
      img.src = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(img.src);
      };
      thumb.appendChild(img);
    } else {
      thumb.appendChild(fileIcon());
    }
    const meta = document.createElement('div');
    meta.className = 'bootcn-dropzone__meta';
    const name = document.createElement('span');
    name.className = 'bootcn-dropzone__name';
    name.textContent = file.name;
    const progress = document.createElement('progress');
    progress.className = 'bootcn-dropzone__progress';
    progress.max = 100;
    progress.value = 0;
    progress.setAttribute('aria-label', t('dropzone.uploading', 'Uploading') + ' ' + file.name);
    const status = document.createElement('span');
    status.className = 'bootcn-dropzone__status';
    status.textContent = size(file.size);
    meta.append(name, progress, status);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'bootcn-dropzone__remove';
    remove.setAttribute('data-bootcn-dropzone-remove', '');
    remove.setAttribute('aria-label', t('dropzone.remove', 'Remove') + ' ' + file.name);
    remove.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12" /></svg>';
    li.append(thumb, meta, remove);
    q(root, 'list').appendChild(li);
    return li;
  }

  function setProgress(li, percent) {
    const bar = li.querySelector('progress');
    if (bar) bar.value = Math.max(0, Math.min(100, percent));
    const status = li.querySelector('.bootcn-dropzone__status');
    const data = uploads.get(li);
    if (status && data) status.textContent = Math.round(percent) + '% · ' + size(data.file.size);
  }

  function finish(root, li) {
    const data = uploads.get(li);
    if (!data || li.classList.contains('is-done')) return;
    li.classList.add('is-done');
    li.querySelector('.bootcn-dropzone__status').textContent =
      t('dropzone.done', 'Uploaded') + ' · ' + size(data.file.size);
    announce(root, data.file.name + ': ' + t('dropzone.done', 'Uploaded'));
    root.dispatchEvent(
      new CustomEvent('bootcn:dropzone:done', {
        bubbles: true,
        detail: { file: data.file, id: li.id },
      }),
    );
  }

  function fail(root, li, message) {
    li.classList.add('is-error');
    const text = message || t('dropzone.failed', 'Upload failed');
    li.querySelector('.bootcn-dropzone__status').textContent = text;
    const data = uploads.get(li);
    announce(root, (data ? data.file.name + ': ' : '') + text);
  }

  // With data-upload-url each file is POSTed (field data-field, "file");
  // otherwise bootcn:dropzone:file lets your code upload it.
  function upload(root, li, file) {
    const url = root.getAttribute('data-upload-url');
    if (url) {
      const xhr = new XMLHttpRequest();
      uploads.get(li).xhr = xhr;
      xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) setProgress(li, (event.loaded / event.total) * 100);
      };
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) finish(root, li);
        else fail(root, li);
      };
      xhr.onerror = function () {
        fail(root, li);
      };
      const body = new FormData();
      body.append(root.getAttribute('data-field') || 'file', file);
      xhr.open('POST', url);
      xhr.send(body);
      return;
    }
    const detail = {
      file: file,
      id: li.id,
      progress: function (percent) {
        setProgress(li, percent);
      },
      done: function () {
        finish(root, li);
      },
      fail: function (message) {
        fail(root, li, message);
      },
    };
    const handled = !root.dispatchEvent(
      new CustomEvent('bootcn:dropzone:file', { bubbles: true, cancelable: true, detail: detail }),
    );
    // Nobody uploads it: it is simply chosen (a form can submit the input).
    if (!handled) finish(root, li);
  }

  function add(root, files) {
    const input = q(root, 'input');
    const accept = input ? input.getAttribute('accept') : '';
    const max = Number(root.getAttribute('data-max-size')) || Infinity;
    const multiple = !input || input.multiple;
    let list = Array.from(files || []);
    if (!multiple) list = list.slice(0, 1);
    let added = 0;
    list.forEach(function (file) {
      const li = item(root, file);
      uploads.set(li, { file: file });
      if (!accepted(file, accept)) {
        fail(root, li, t('dropzone.type', 'This type of file is not allowed'));
      } else if (file.size > max) {
        fail(root, li, t('dropzone.size', 'Too large (max {max})').replace('{max}', size(max)));
      } else {
        added++;
        upload(root, li, file);
      }
    });
    if (added) {
      announce(root, t('dropzone.added', '{n} file(s) added').replace('{n}', String(added)));
    }
  }

  function rootOf(event) {
    return event.target instanceof Element ? event.target.closest(ROOT) : null;
  }

  function onChange(event) {
    if (!event.target.matches || !event.target.matches('[data-bootcn-dropzone-input]')) return;
    const root = rootOf(event);
    if (!root) return;
    add(root, event.target.files);
    // The same file can be chosen again after removing it.
    event.target.value = '';
  }

  function onDragOver(event) {
    const root = rootOf(event);
    if (!root || !event.dataTransfer || Array.from(event.dataTransfer.types).indexOf('Files') < 0) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    root.classList.add('is-dragging');
  }

  function onDragLeave(event) {
    const root = rootOf(event);
    if (root && !root.contains(event.relatedTarget)) root.classList.remove('is-dragging');
  }

  function onDrop(event) {
    const root = rootOf(event);
    if (!root) return;
    event.preventDefault();
    root.classList.remove('is-dragging');
    if (event.dataTransfer) add(root, event.dataTransfer.files);
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest('[data-bootcn-dropzone-remove]');
    if (!button) return;
    const root = button.closest(ROOT);
    const li = button.closest('li');
    const data = uploads.get(li);
    if (data && data.xhr && !li.classList.contains('is-done')) data.xhr.abort();
    root.dispatchEvent(
      new CustomEvent('bootcn:dropzone:remove', {
        bubbles: true,
        detail: { file: data && data.file, id: li.id },
      }),
    );
    const next = li.nextElementSibling || li.previousElementSibling;
    li.remove();
    const focus = next ? next.querySelector('[data-bootcn-dropzone-remove]') : q(root, 'input');
    if (focus) focus.focus();
    announce(root, (data ? data.file.name + ': ' : '') + t('dropzone.removed', 'Removed'));
  }

  function init() {
    if (listening) return;
    document.addEventListener('change', onChange);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('drop', onDrop);
    document.addEventListener('click', onClick);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('change', onChange);
    document.removeEventListener('dragover', onDragOver);
    document.removeEventListener('dragleave', onDragLeave);
    document.removeEventListener('drop', onDrop);
    document.removeEventListener('click', onClick);
    listening = false;
  }

  ns.dropzone = {
    init: init,
    destroy: destroy,
    add: add,
    progress: function (root, id, percent) {
      const li = root.querySelector('#' + CSS.escape(id));
      if (li) setProgress(li, percent);
    },
    done: function (root, id) {
      const li = root.querySelector('#' + CSS.escape(id));
      if (li) finish(root, li);
    },
    fail: function (root, id, message) {
      const li = root.querySelector('#' + CSS.escape(id));
      if (li) fail(root, li, message);
    },
    clear: function (root) {
      q(root, 'list').textContent = '';
    },
    size: size,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
