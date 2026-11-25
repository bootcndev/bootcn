(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.cart) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-cart]';
  const states = new WeakMap();
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function fill(text, values) {
    return text.replace(/\{(\w+)\}/g, (m, k) => (values[k] !== undefined ? values[k] : m));
  }

  function root() {
    return document.querySelector(ROOT);
  }

  function q(el, name) {
    return el.querySelector('[data-bootcn-cart-' + name + ']');
  }

  function money(el, value) {
    try {
      return new Intl.NumberFormat(el.getAttribute('data-locale') || undefined, {
        style: 'currency',
        currency: el.getAttribute('data-currency') || 'USD',
      }).format(value);
    } catch {
      return value.toFixed(2);
    }
  }

  function state(el) {
    let s = states.get(el);
    if (!s) {
      s = { items: [], thumbs: {} };
      const key = el.getAttribute('data-storage-key');
      if (key) {
        try {
          s.items = JSON.parse(localStorage.getItem(key) || '[]').filter((i) => i && i.id);
        } catch {
          s.items = [];
        }
      }
      states.set(el, s);
    }
    return s;
  }

  function save(el) {
    const key = el.getAttribute('data-storage-key');
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(state(el).items));
    } catch {
      /* storage blocked: the cart lasts for this page */
    }
  }

  function keyOf(item) {
    return item.id + '|' + (item.variant || '');
  }

  function totals(el) {
    const items = state(el).items;
    return {
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: Math.round(items.reduce((n, i) => n + i.price * i.quantity, 0) * 100) / 100,
    };
  }

  function announce(el, text) {
    const live = q(el, 'live');
    if (live) live.textContent = text;
  }

  // ------------------------------------------------------------------ render

  function stepButton(label, step, item) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bootcn-cart__step';
    b.setAttribute('data-bootcn-cart-step', String(step));
    b.setAttribute('data-key', keyOf(item));
    b.setAttribute('aria-label', fill(label, { name: item.name }));
    b.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true" focusable="false">' +
      (step > 0 ? '<path d="M12 5v14M5 12h14" />' : '<path d="M5 12h14" />') +
      '</svg>';
    return b;
  }

  function render(el) {
    const s = state(el);
    const list = q(el, 'list');
    const sums = totals(el);
    if (list) {
      list.textContent = '';
      s.items.forEach(function (item) {
        const li = document.createElement('li');
        li.className = 'bootcn-cart__item';
        li.setAttribute('data-key', keyOf(item));
        const thumb = document.createElement('span');
        thumb.className = 'bootcn-cart__thumb';
        if (item.image) {
          const img = document.createElement('img');
          img.src = item.image;
          img.alt = '';
          thumb.appendChild(img);
        } else if (s.thumbs[keyOf(item)]) {
          thumb.appendChild(s.thumbs[keyOf(item)].cloneNode(true));
        }
        const info = document.createElement('div');
        info.className = 'bootcn-cart__info';
        const name = document.createElement('p');
        name.className = 'bootcn-cart__name';
        name.textContent = item.name;
        info.appendChild(name);
        if (item.variant) {
          const variant = document.createElement('p');
          variant.className = 'bootcn-cart__variant';
          variant.textContent = item.variant;
          info.appendChild(variant);
        }
        const qty = document.createElement('div');
        qty.className = 'bootcn-cart__quantity';
        qty.setAttribute('role', 'group');
        qty.setAttribute('aria-label', fill(t('cart.quantityOf', 'Quantity of {name}'), item));
        const minus = stepButton(t('cart.decrease', 'One less {name}'), -1, item);
        minus.disabled = item.quantity <= 1;
        const value = document.createElement('output');
        value.className = 'bootcn-cart__count';
        value.textContent = String(item.quantity);
        qty.append(minus, value, stepButton(t('cart.increase', 'One more {name}'), 1, item));
        info.appendChild(qty);
        const side = document.createElement('div');
        side.className = 'bootcn-cart__side';
        const price = document.createElement('p');
        price.className = 'bootcn-cart__price';
        price.textContent = money(el, item.price * item.quantity);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'bootcn-cart__remove';
        remove.setAttribute('data-bootcn-cart-remove', '');
        remove.setAttribute('data-key', keyOf(item));
        remove.textContent = t('cart.remove', 'Remove');
        remove.setAttribute('aria-label', fill(t('cart.removeName', 'Remove {name}'), item));
        side.append(price, remove);
        li.append(thumb, info, side);
        list.appendChild(li);
      });
    }
    const empty = q(el, 'empty');
    if (empty) empty.hidden = s.items.length > 0;
    const footer = q(el, 'footer');
    if (footer) footer.hidden = s.items.length === 0;
    const subtotal = q(el, 'subtotal');
    if (subtotal) subtotal.textContent = money(el, sums.subtotal);
    // Free shipping above data-free-shipping.
    const free = Number(el.getAttribute('data-free-shipping')) || 0;
    const shipping = q(el, 'shipping');
    if (shipping && free) {
      const left = Math.max(0, free - sums.subtotal);
      const text = shipping.querySelector('[data-bootcn-cart-shipping-text]');
      const bar = shipping.querySelector('progress');
      if (text) {
        text.textContent = left
          ? fill(t('cart.freeShippingLeft', 'Add {amount} more for free shipping'), {
              amount: money(el, left),
            })
          : t('cart.freeShipping', 'Your order ships free');
      }
      if (bar) bar.value = Math.min(100, Math.round((sums.subtotal / free) * 100));
      shipping.classList.toggle('is-free', left === 0);
    }
    const title = q(el, 'title-count');
    if (title) title.textContent = sums.count ? '(' + sums.count + ')' : '';
    document.querySelectorAll('[data-bootcn-cart-count]').forEach(function (badge) {
      badge.textContent = String(sums.count);
      badge.hidden = sums.count === 0;
    });
    document.querySelectorAll('[data-bootcn-cart-toggle]').forEach(function (toggle) {
      toggle.setAttribute('aria-label', fill(t('cart.label', 'Cart, {count} items'), sums));
    });
    document.querySelectorAll('[data-bootcn-cart-checkout]').forEach(function (link) {
      link.classList.toggle('disabled', sums.count === 0);
      if (sums.count === 0) link.setAttribute('aria-disabled', 'true');
      else link.removeAttribute('aria-disabled');
    });
  }

  function changed(el) {
    save(el);
    render(el);
    const sums = totals(el);
    el.dispatchEvent(
      new CustomEvent('bootcn:cart:change', {
        bubbles: true,
        detail: {
          items: state(el).items.map((i) => Object.assign({}, i)),
          count: sums.count,
          subtotal: sums.subtotal,
        },
      }),
    );
  }

  // ------------------------------------------------------------------- api

  function open(el) {
    const panel = el.matches('.offcanvas') ? el : el.querySelector('.offcanvas') || el;
    if (window.bootstrap && window.bootstrap.Offcanvas && panel.classList.contains('offcanvas')) {
      window.bootstrap.Offcanvas.getOrCreateInstance(panel).show();
    }
  }

  function add(el, item, options) {
    const s = state(el);
    const entry = {
      id: String(item.id),
      name: String(item.name || item.id),
      price: Number(item.price) || 0,
      variant: item.variant ? String(item.variant) : '',
      image: item.image || '',
      quantity: Math.max(1, Number(item.quantity) || 1),
    };
    const existing = s.items.find((i) => keyOf(i) === keyOf(entry));
    if (existing) existing.quantity += entry.quantity;
    else s.items.push(entry);
    if (options && options.thumb) s.thumbs[keyOf(entry)] = options.thumb;
    changed(el);
    announce(el, fill(t('cart.added', 'Added {name} to your cart.'), entry));
    if (!options || options.open !== false) open(el);
    return entry;
  }

  function setQuantity(el, key, quantity) {
    const s = state(el);
    const item = s.items.find((i) => keyOf(i) === key);
    if (!item) return;
    if (quantity <= 0) {
      s.items = s.items.filter((i) => i !== item);
      announce(el, fill(t('cart.removed', 'Removed {name}.'), item));
    } else {
      item.quantity = quantity;
      announce(el, fill(t('cart.quantity', '{name}: {quantity}'), item));
    }
    changed(el);
  }

  // ---------------------------------------------------------------- events

  function fromButton(button) {
    const card = button.closest('[data-bootcn-product]');
    const art = card && card.querySelector('.bootcn-product-art, .bootcn-product-card__media img');
    return {
      item: {
        id: button.getAttribute('data-id'),
        name: button.getAttribute('data-name'),
        price: button.getAttribute('data-price'),
        variant: button.getAttribute('data-variant'),
        image: button.getAttribute('data-image'),
        quantity: button.getAttribute('data-quantity'),
      },
      thumb: art ? art.cloneNode(true) : null,
    };
  }

  function onClick(event) {
    const target = event.target.closest && event.target.closest('button, a');
    if (!target) return;
    const el = target.closest(ROOT) || root();
    if (!el) return;
    if (target.hasAttribute('data-bootcn-cart-add')) {
      const data = fromButton(target);
      // Closing the drawer returns the focus to the button that opened it.
      state(el).returnTo = target;
      add(el, data.item, { thumb: data.thumb });
    } else if (target.hasAttribute('data-bootcn-cart-step')) {
      const key = target.getAttribute('data-key');
      const item = state(el).items.find((i) => keyOf(i) === key);
      if (item) {
        setQuantity(el, key, item.quantity + Number(target.getAttribute('data-bootcn-cart-step')));
        // Re-rendering replaced the button: focus its twin.
        const step = target.getAttribute('data-bootcn-cart-step');
        const again = el.querySelector(
          '[data-bootcn-cart-step="' + step + '"][data-key="' + CSS.escape(key) + '"]',
        );
        if (again && !again.disabled) again.focus();
        else {
          const other = el.querySelector(
            '[data-bootcn-cart-step][data-key="' + CSS.escape(key) + '"]:not(:disabled)',
          );
          if (other) other.focus();
        }
      }
    } else if (target.hasAttribute('data-bootcn-cart-remove')) {
      const key = target.getAttribute('data-key');
      const li = target.closest('li');
      const next = li && (li.nextElementSibling || li.previousElementSibling);
      const nextKey = next && next.getAttribute('data-key');
      setQuantity(el, key, 0);
      const focus = nextKey
        ? el.querySelector('[data-bootcn-cart-remove][data-key="' + CSS.escape(nextKey) + '"]')
        : el.querySelector('[data-bootcn-cart-continue], .btn-close');
      if (focus) focus.focus();
    } else if (target.hasAttribute('data-bootcn-cart-checkout') && totals(el).count === 0) {
      event.preventDefault();
    }
  }

  // A product form: id, name and price fields, chosen options and quantity.
  function onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute('data-bootcn-cart-form')) return;
    event.preventDefault();
    const el = root();
    if (!el) return;
    const data = new FormData(form);
    const options = (form.getAttribute('data-options') || 'color,size')
      .split(',')
      .map((name) => data.get(name.trim()))
      .filter(Boolean);
    state(el).returnTo = event.submitter || form.querySelector('[type="submit"]');
    const media = form.closest('[data-bootcn-product]');
    const art = media && media.querySelector('.bootcn-product-art');
    add(
      el,
      {
        id: data.get('id'),
        name: data.get('name'),
        price: data.get('price'),
        variant: options.join(' / '),
        quantity: data.get('quantity'),
      },
      { thumb: art ? art.cloneNode(true) : null },
    );
  }

  function onHidden(event) {
    const el = event.target.closest && event.target.closest(ROOT);
    if (!el) return;
    const back = state(el).returnTo;
    state(el).returnTo = null;
    if (back && back.isConnected && !el.contains(document.activeElement)) back.focus();
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('submit', onSubmit);
      document.addEventListener('hidden.bs.offcanvas', onHidden);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(render);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('submit', onSubmit);
    document.removeEventListener('hidden.bs.offcanvas', onHidden);
    listening = false;
  }

  ns.cart = {
    init: init,
    destroy: destroy,
    add: function (item, options) {
      const el = root();
      return el ? add(el, item, options) : null;
    },
    setQuantity: function (id, variant, quantity) {
      const el = root();
      if (el) setQuantity(el, id + '|' + (variant || ''), quantity);
    },
    remove: function (id, variant) {
      const el = root();
      if (el) setQuantity(el, id + '|' + (variant || ''), 0);
    },
    items: function () {
      const el = root();
      return el ? state(el).items.map((i) => Object.assign({}, i)) : [];
    },
    totals: function () {
      const el = root();
      return el ? totals(el) : { count: 0, subtotal: 0 };
    },
    clear: function () {
      const el = root();
      if (!el) return;
      state(el).items = [];
      changed(el);
    },
    open: function () {
      const el = root();
      if (el) open(el);
    },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
