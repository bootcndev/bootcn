(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.promptInput) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-prompt-input]';
  const REMOVE_ICON =
    '<svg class="bootcn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  const attached = new WeakMap(); // form -> File[]
  let listening = false;

  function parts(form) {
    return {
      textarea: form.querySelector('[data-bootcn-prompt-textarea]'),
      file: form.querySelector('[data-bootcn-prompt-file]'),
      list: form.querySelector('[data-bootcn-prompt-attachments]'),
      submit: form.querySelector('[data-bootcn-prompt-submit]'),
      status: form.querySelector('[data-bootcn-prompt-status]'),
    };
  }

  function filesOf(form) {
    if (!attached.has(form)) attached.set(form, []);
    return attached.get(form);
  }

  function announce(form, text) {
    const region = parts(form).status;
    if (!region) return;
    region.textContent = '';
    setTimeout(function () {
      region.textContent = text;
    }, 50);
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function resize(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  function isBusy(form) {
    return form.classList.contains('is-busy');
  }

  function sync(form) {
    const p = parts(form);
    if (!p.submit || isBusy(form)) return;
    const empty = !(p.textarea && p.textarea.value.trim()) && filesOf(form).length === 0;
    p.submit.disabled = empty;
  }

  // Keeps the file input's FileList equal to the attachment list, so a
  // normal form post sends exactly the files shown.
  function syncInput(form) {
    const input = parts(form).file;
    if (!input || typeof DataTransfer === 'undefined') return;
    try {
      const transfer = new DataTransfer();
      filesOf(form).forEach(function (file) {
        transfer.items.add(file);
      });
      input.files = transfer.files;
    } catch {
      // Older browsers: the list is still shown; the input keeps its own files.
    }
  }

  function render(form) {
    const p = parts(form);
    if (!p.list) return;
    p.list.replaceChildren();
    filesOf(form).forEach(function (file, index) {
      const item = document.createElement('li');
      item.className = 'bootcn-prompt-attachment';
      const name = document.createElement('span');
      name.className = 'bootcn-prompt-attachment__name';
      name.textContent = file.name;
      const size = document.createElement('span');
      size.className = 'bootcn-prompt-attachment__size';
      size.textContent = formatSize(file.size);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'bootcn-prompt-attachment__remove';
      remove.setAttribute('aria-label', 'Remove ' + file.name);
      remove.setAttribute('data-bootcn-prompt-remove', String(index));
      remove.innerHTML = REMOVE_ICON;
      item.append(name, size, remove);
      p.list.appendChild(item);
    });
    p.list.hidden = filesOf(form).length === 0;
    syncInput(form);
    sync(form);
  }

  function addFiles(form, fileList) {
    const files = filesOf(form);
    const added = [];
    Array.from(fileList || []).forEach(function (file) {
      const duplicate = files.some(function (other) {
        return (
          other.name === file.name &&
          other.size === file.size &&
          other.lastModified === file.lastModified
        );
      });
      if (!duplicate) {
        files.push(file);
        added.push(file.name);
      }
    });
    render(form);
    if (added.length === 1) announce(form, added[0] + ' attached.');
    else if (added.length > 1) announce(form, added.length + ' files attached.');
  }

  function removeFile(form, index) {
    const files = filesOf(form);
    const file = files[index];
    if (!file) return;
    files.splice(index, 1);
    render(form);
    const buttons = form.querySelectorAll('[data-bootcn-prompt-remove]');
    const next = buttons[index] || buttons[index - 1];
    if (next) next.focus();
    else if (parts(form).file) parts(form).file.focus();
    announce(form, file.name + ' removed.');
  }

  function clear(form) {
    const p = parts(form);
    if (p.textarea) {
      p.textarea.value = '';
      resize(p.textarea);
    }
    attached.set(form, []);
    render(form);
  }

  function setBusy(form, busy) {
    const p = parts(form);
    form.classList.toggle('is-busy', busy);
    if (p.submit) {
      p.submit.setAttribute('aria-label', busy ? 'Stop' : 'Send');
      p.submit.type = busy ? 'button' : 'submit';
      if (busy) p.submit.disabled = false;
    }
    sync(form);
  }

  function onInput(event) {
    const textarea = event.target;
    if (!textarea.matches || !textarea.matches('[data-bootcn-prompt-textarea]')) return;
    const form = textarea.closest(ROOT);
    if (!form) return;
    resize(textarea);
    sync(form);
  }

  function onKeydown(event) {
    const textarea = event.target;
    if (!textarea.matches || !textarea.matches('[data-bootcn-prompt-textarea]')) return;
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    const form = textarea.closest(ROOT);
    if (!form) return;
    event.preventDefault();
    const submit = parts(form).submit;
    if (!isBusy(form) && submit && !submit.disabled) form.requestSubmit(submit);
  }

  function onChange(event) {
    const input = event.target;
    if (!input.matches || !input.matches('[data-bootcn-prompt-file]')) return;
    const form = input.closest(ROOT);
    if (form) addFiles(form, input.files);
  }

  function onClick(event) {
    const target = event.target.closest && event.target.closest(ROOT + ' button');
    if (!target) return;
    const form = target.closest(ROOT);
    if (target.hasAttribute('data-bootcn-prompt-remove')) {
      removeFile(form, Number(target.getAttribute('data-bootcn-prompt-remove')));
    } else if (target.hasAttribute('data-bootcn-prompt-suggestion')) {
      const textarea = parts(form).textarea;
      if (!textarea) return;
      textarea.value = target.textContent.trim();
      resize(textarea);
      sync(form);
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      form.dispatchEvent(
        new CustomEvent('bootcn:prompt-input:suggestion', {
          bubbles: true,
          detail: { text: textarea.value },
        }),
      );
    } else if (target.hasAttribute('data-bootcn-prompt-submit') && isBusy(form)) {
      form.dispatchEvent(new CustomEvent('bootcn:prompt-input:stop', { bubbles: true }));
    }
  }

  // A form without an action attribute is handled in JavaScript only.
  // With an action, it posts normally unless a listener of
  // bootcn:prompt-input:submit calls preventDefault().
  function onSubmit(event) {
    const form = event.target;
    if (!form.matches || !form.matches(ROOT)) return;
    const p = parts(form);
    const text = p.textarea ? p.textarea.value.trim() : '';
    const files = filesOf(form).slice();
    if (isBusy(form) || (!text && files.length === 0)) {
      event.preventDefault();
      return;
    }
    const custom = new CustomEvent('bootcn:prompt-input:submit', {
      bubbles: true,
      cancelable: true,
      detail: { text: text, files: files, data: new FormData(form) },
    });
    const handled = !form.dispatchEvent(custom);
    if (handled || !form.hasAttribute('action')) {
      event.preventDefault();
      clear(form);
      if (p.textarea) p.textarea.focus();
    }
  }

  function dropZone(event) {
    const box = event.target.closest && event.target.closest(ROOT + ' .bootcn-prompt-input__box');
    if (!box || !event.dataTransfer || !Array.from(event.dataTransfer.types).includes('Files')) {
      return null;
    }
    const form = box.closest(ROOT);
    return parts(form).file ? box : null;
  }

  function onDragOver(event) {
    const box = dropZone(event);
    if (!box) return;
    event.preventDefault();
    box.classList.add('is-dragging');
  }

  function onDragLeave(event) {
    const box = event.target.closest && event.target.closest(ROOT + ' .bootcn-prompt-input__box');
    if (box && !box.contains(event.relatedTarget)) box.classList.remove('is-dragging');
  }

  function onDrop(event) {
    const box = dropZone(event);
    if (!box) return;
    event.preventDefault();
    box.classList.remove('is-dragging');
    addFiles(box.closest(ROOT), event.dataTransfer.files);
  }

  function refresh(form) {
    resize(parts(form).textarea);
    sync(form);
  }

  const handlers = [
    ['input', onInput],
    ['keydown', onKeydown],
    ['change', onChange],
    ['click', onClick],
    ['submit', onSubmit],
    ['dragover', onDragOver],
    ['dragleave', onDragLeave],
    ['drop', onDrop],
  ];

  function init() {
    if (!listening) {
      handlers.forEach(function (pair) {
        document.addEventListener(pair[0], pair[1]);
      });
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(refresh);
  }

  function destroy() {
    if (!listening) return;
    handlers.forEach(function (pair) {
      document.removeEventListener(pair[0], pair[1]);
    });
    listening = false;
  }

  ns.promptInput = {
    init: init,
    destroy: destroy,
    setBusy: setBusy,
    clear: clear,
    refresh: refresh,
    files: function (form) {
      return filesOf(form).slice();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
