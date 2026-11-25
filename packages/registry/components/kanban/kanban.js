(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.kanban) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-kanban]';
  const CARD = '[data-bootcn-kanban-card]';
  const COLUMN = '[data-bootcn-kanban-column]';
  const LIST = '[data-bootcn-kanban-list]';
  const lifted = new WeakMap(); // root -> { card, list, next } while moving by keyboard
  let drag = null; // the pointer drag in progress
  let listening = false;
  let counter = 0;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function fill(text, values) {
    return text.replace(/\{(\w+)\}/g, function (match, key) {
      return values[key] !== undefined ? values[key] : match;
    });
  }

  function columns(root) {
    return Array.from(root.querySelectorAll(COLUMN));
  }

  function cardsOf(list) {
    return Array.from(list.querySelectorAll(':scope > ' + CARD));
  }

  function titleOf(card) {
    const title = card.querySelector('.bootcn-kanban__title');
    return (title ? title.textContent : card.textContent).trim();
  }

  function columnName(column) {
    const heading = column.querySelector('h1, h2, h3, h4');
    return heading ? heading.textContent.trim() : column.getAttribute('data-bootcn-kanban-column');
  }

  function announce(root, text) {
    const live = root.querySelector('[data-bootcn-kanban-live]');
    if (live) live.textContent = text;
  }

  function position(card) {
    const list = card.parentElement;
    const column = list.closest(COLUMN);
    return {
      title: titleOf(card),
      column: columnName(column),
      n: cardsOf(list).indexOf(card) + 1,
      total: cardsOf(list).length,
    };
  }

  // Counts, and the work-in-progress limit (data-limit) when a column has one.
  function syncCounts(root) {
    columns(root).forEach(function (column) {
      const list = column.querySelector(LIST);
      const count = column.querySelector('[data-bootcn-kanban-count]');
      const n = list ? cardsOf(list).length : 0;
      const limit = Number(column.getAttribute('data-limit')) || 0;
      if (count) count.textContent = limit ? n + ' / ' + limit : String(n);
      column.classList.toggle('is-over-limit', limit > 0 && n > limit);
      const empty = column.querySelector('[data-bootcn-kanban-empty]');
      if (empty) empty.hidden = n > 0;
    });
  }

  function moved(root, card, from, fromIndex) {
    const to = card.closest(COLUMN);
    const index = cardsOf(card.parentElement).indexOf(card);
    syncCounts(root);
    if (from === to && fromIndex === index) return false;
    root.dispatchEvent(
      new CustomEvent('bootcn:kanban:move', {
        bubbles: true,
        detail: {
          card: card.getAttribute('data-bootcn-kanban-card'),
          from: from.getAttribute('data-bootcn-kanban-column'),
          to: to.getAttribute('data-bootcn-kanban-column'),
          index: index,
        },
      }),
    );
    return true;
  }

  // ---------------------------------------------------------------- keyboard

  function isRtl(root) {
    return getComputedStyle(root).direction === 'rtl';
  }

  function lift(root, card) {
    lifted.set(root, {
      card: card,
      column: card.closest(COLUMN),
      next: card.nextElementSibling,
      index: cardsOf(card.parentElement).indexOf(card),
    });
    card.classList.add('is-lifted');
    announce(
      root,
      fill(
        t(
          'kanban.lifted',
          'Picked up {title}. {column}, position {n} of {total}. Use the arrow keys to move, Space to drop, Escape to cancel.',
        ),
        position(card),
      ),
    );
  }

  function drop(root, card) {
    const state = lifted.get(root);
    lifted.delete(root);
    card.classList.remove('is-lifted');
    moved(root, card, state.column, state.index);
    announce(
      root,
      fill(
        t('kanban.dropped', 'Dropped {title} in {column}, position {n} of {total}.'),
        position(card),
      ),
    );
  }

  function cancel(root, card) {
    const state = lifted.get(root);
    lifted.delete(root);
    const list = state.column.querySelector(LIST);
    list.insertBefore(card, state.next && state.next.parentElement === list ? state.next : null);
    card.classList.remove('is-lifted');
    card.focus();
    syncCounts(root);
    announce(
      root,
      fill(t('kanban.cancelled', 'Move cancelled. {title} is back in {column}.'), position(card)),
    );
  }

  function moveBy(root, card, dx, dy) {
    const list = card.parentElement;
    if (dy) {
      const siblings = cardsOf(list);
      const index = siblings.indexOf(card) + dy;
      if (index < 0 || index >= siblings.length) return;
      list.insertBefore(card, dy > 0 ? siblings[index].nextElementSibling : siblings[index]);
    } else {
      const all = columns(root);
      const target = all[all.indexOf(card.closest(COLUMN)) + dx];
      if (!target) return;
      const targetList = target.querySelector(LIST);
      const index = Math.min(cardsOf(list).indexOf(card), cardsOf(targetList).length);
      targetList.insertBefore(card, cardsOf(targetList)[index] || null);
    }
    card.focus();
    syncCounts(root);
    announce(
      root,
      fill(t('kanban.position', '{column}, position {n} of {total}.'), position(card)),
    );
  }

  function focusBy(root, card, dx, dy) {
    if (dy) {
      const siblings = cardsOf(card.parentElement);
      const next = siblings[siblings.indexOf(card) + dy];
      if (next) next.focus();
      return;
    }
    const all = columns(root);
    let i = all.indexOf(card.closest(COLUMN)) + dx;
    const index = cardsOf(card.parentElement).indexOf(card);
    // Skip empty columns.
    while (all[i]) {
      const cards = cardsOf(all[i].querySelector(LIST));
      if (cards.length) {
        cards[Math.min(index, cards.length - 1)].focus();
        return;
      }
      i += dx;
    }
  }

  function onKeydown(event) {
    const card = event.target.closest && event.target.closest(CARD);
    const root = card && card.closest(ROOT);
    if (!root || event.target !== card) return;
    const state = lifted.get(root);
    const rtl = isRtl(root) ? -1 : 1;
    const keys = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-rtl, 0],
      ArrowRight: [rtl, 0],
    };
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (state && state.card === card) drop(root, card);
      else lift(root, card);
    } else if (event.key === 'Escape' && state && state.card === card) {
      event.preventDefault();
      cancel(root, card);
    } else if (keys[event.key]) {
      event.preventDefault();
      const [dx, dy] = keys[event.key];
      if (state && state.card === card) moveBy(root, card, dx, dy);
      else focusBy(root, card, dx, dy);
    }
  }

  // Leaving a lifted card with Tab or a click drops it where it is.
  function onFocusOut(event) {
    const card = event.target.closest && event.target.closest(CARD);
    const root = card && card.closest(ROOT);
    if (!root) return;
    const state = lifted.get(root);
    if (state && state.card === card && !card.contains(event.relatedTarget)) {
      // Moving a card re-inserts it, which blurs it for a moment: check later.
      setTimeout(function () {
        if (lifted.get(root) === state && document.activeElement !== card) drop(root, card);
      }, 0);
    }
  }

  // ----------------------------------------------------------------- pointer

  function onPointerDown(event) {
    const card = event.target.closest && event.target.closest(CARD);
    const root = card && card.closest(ROOT);
    if (!root || event.button !== 0 || drag) return;
    if (event.target.closest('a, button, input, textarea, select')) return;
    // On touch screens the grip starts a drag; elsewhere the page scrolls.
    if (event.pointerType === 'touch' && !event.target.closest('.bootcn-kanban__grip')) return;
    drag = {
      root: root,
      card: card,
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      started: false,
      column: card.closest(COLUMN),
      index: cardsOf(card.parentElement).indexOf(card),
    };
  }

  function startDrag(event) {
    const card = drag.card;
    const box = card.getBoundingClientRect();
    const placeholder = document.createElement('li');
    placeholder.className = 'bootcn-kanban__placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.style.height = box.height + 'px';
    card.parentElement.insertBefore(placeholder, card);
    drag.placeholder = placeholder;
    drag.offsetX = event.clientX - box.left;
    drag.offsetY = event.clientY - box.top;
    card.classList.add('is-dragging');
    card.style.width = box.width + 'px';
    card.style.left = '0px';
    card.style.top = '0px';
    drag.root.classList.add('is-dragging');
    try {
      card.setPointerCapture(drag.id);
    } catch {
      /* the pointer may already be gone */
    }
    drag.started = true;
  }

  function onPointerMove(event) {
    if (!drag || event.pointerId !== drag.id) return;
    if (!drag.started) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
      startDrag(event);
    }
    event.preventDefault();
    const card = drag.card;
    card.style.transform =
      'translate(' +
      (event.clientX - drag.offsetX) +
      'px, ' +
      (event.clientY - drag.offsetY) +
      'px) rotate(2deg)';
    // Which list is under the pointer, and where in it.
    const under = document.elementFromPoint(event.clientX, event.clientY);
    const column = under && under.closest(COLUMN);
    if (column && column.closest(ROOT) === drag.root) {
      const list = column.querySelector(LIST);
      const before = cardsOf(list).find(function (other) {
        if (other === card) return false;
        const box = other.getBoundingClientRect();
        return event.clientY < box.top + box.height / 2;
      });
      list.insertBefore(drag.placeholder, before || null);
    }
    // Near the board's edges, scroll it.
    const board = drag.root.querySelector('.bootcn-kanban__board');
    if (board) {
      const box = board.getBoundingClientRect();
      if (event.clientX > box.right - 40) board.scrollLeft += 12;
      else if (event.clientX < box.left + 40) board.scrollLeft -= 12;
    }
  }

  function endDrag(event, keep) {
    if (!drag || event.pointerId !== drag.id) return;
    const state = drag;
    drag = null;
    if (!state.started) return;
    const card = state.card;
    if (keep) state.placeholder.parentElement.insertBefore(card, state.placeholder);
    else {
      const list = state.column.querySelector(LIST);
      list.insertBefore(card, cardsOf(list)[state.index] || null);
    }
    state.placeholder.remove();
    card.classList.remove('is-dragging');
    card.style.transform = '';
    card.style.width = '';
    card.style.left = '';
    card.style.top = '';
    state.root.classList.remove('is-dragging');
    if (moved(state.root, card, state.column, state.index)) {
      announce(
        state.root,
        fill(
          t('kanban.dropped', 'Dropped {title} in {column}, position {n} of {total}.'),
          position(card),
        ),
      );
    }
    // A drag is not a click on the card.
    state.root.addEventListener('click', swallow, { capture: true, once: true });
  }

  function swallow(event) {
    event.stopPropagation();
    event.preventDefault();
  }

  function onPointerUp(event) {
    endDrag(event, true);
  }

  function onPointerCancel(event) {
    endDrag(event, false);
  }

  // ---------------------------------------------------------------- add card

  function onClick(event) {
    const button = event.target.closest && event.target.closest('button');
    if (!button) return;
    const column = button.closest(COLUMN);
    if (!column) return;
    const form = column.querySelector('[data-bootcn-kanban-form]');
    if (button.hasAttribute('data-bootcn-kanban-add') && form) {
      form.hidden = false;
      button.hidden = true;
      form.querySelector('textarea').focus();
    } else if (button.hasAttribute('data-bootcn-kanban-cancel') && form) {
      closeForm(column);
    }
  }

  function closeForm(column) {
    const form = column.querySelector('[data-bootcn-kanban-form]');
    const add = column.querySelector('[data-bootcn-kanban-add]');
    form.reset();
    form.hidden = true;
    if (add) {
      add.hidden = false;
      add.focus();
    }
  }

  function addCard(root, column, title) {
    const list = column.querySelector(LIST);
    const card = document.createElement('li');
    card.className = 'bootcn-kanban__card';
    card.tabIndex = 0;
    card.setAttribute('data-bootcn-kanban-card', 'new-' + ++counter);
    const help = root.querySelector('[data-bootcn-kanban-help]');
    if (help && help.id) card.setAttribute('aria-describedby', help.id);
    const grip = root.querySelector('.bootcn-kanban__grip');
    if (grip) card.appendChild(grip.cloneNode(true));
    const p = document.createElement('p');
    p.className = 'bootcn-kanban__title';
    p.textContent = title;
    card.appendChild(p);
    list.appendChild(card);
    syncCounts(root);
    root.dispatchEvent(
      new CustomEvent('bootcn:kanban:add', {
        bubbles: true,
        detail: {
          card: card.getAttribute('data-bootcn-kanban-card'),
          column: column.getAttribute('data-bootcn-kanban-column'),
          title: title,
          element: card,
        },
      }),
    );
    announce(root, fill(t('kanban.added', 'Added {title} to {column}.'), position(card)));
    return card;
  }

  function onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute('data-bootcn-kanban-form')) return;
    event.preventDefault();
    const column = form.closest(COLUMN);
    const root = form.closest(ROOT);
    const text = form.querySelector('textarea').value.trim();
    if (!text) {
      closeForm(column);
      return;
    }
    addCard(root, column, text);
    form.reset();
    form.querySelector('textarea').focus();
  }

  // Enter adds the card, Shift+Enter a new line, Escape closes the form.
  function onFormKeydown(event) {
    const area = event.target;
    if (!(area instanceof HTMLTextAreaElement) || !area.closest('[data-bootcn-kanban-form]'))
      return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      area.form.requestSubmit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeForm(area.closest(COLUMN));
    }
  }

  function init() {
    if (!listening) {
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('keydown', onFormKeydown);
      document.addEventListener('focusout', onFocusOut);
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('pointermove', onPointerMove, { passive: false });
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerCancel);
      document.addEventListener('click', onClick);
      document.addEventListener('submit', onSubmit);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(syncCounts);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('keydown', onFormKeydown);
    document.removeEventListener('focusout', onFocusOut);
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerCancel);
    document.removeEventListener('click', onClick);
    document.removeEventListener('submit', onSubmit);
    listening = false;
  }

  ns.kanban = {
    init: init,
    destroy: destroy,
    add: function (root, columnId, title) {
      const column = root.querySelector(
        '[data-bootcn-kanban-column="' + CSS.escape(columnId) + '"]',
      );
      return column ? addCard(root, column, title) : null;
    },
    move: function (root, cardId, columnId, index) {
      const card = root.querySelector('[data-bootcn-kanban-card="' + CSS.escape(cardId) + '"]');
      const column = root.querySelector(
        '[data-bootcn-kanban-column="' + CSS.escape(columnId) + '"]',
      );
      if (!card || !column) return false;
      const from = card.closest(COLUMN);
      const fromIndex = cardsOf(card.parentElement).indexOf(card);
      const list = column.querySelector(LIST);
      const others = cardsOf(list).filter((c) => c !== card);
      list.insertBefore(card, others[index] || null);
      return moved(root, card, from, fromIndex);
    },
    sync: syncCounts,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
