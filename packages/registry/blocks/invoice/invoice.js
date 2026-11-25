(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.invoice) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-invoice]';
  let listening = false;

  function format(root, value) {
    const currency = root.getAttribute('data-currency') || 'USD';
    const locale = root.getAttribute('data-locale') || undefined;
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(value);
    } catch {
      return value.toFixed(2);
    }
  }

  function set(root, name, text) {
    const el = root.querySelector('[data-bootcn-invoice-' + name + ']');
    if (el) el.textContent = text;
  }

  // Amounts and totals from each row's data-quantity and data-price, so the
  // server only fills in the rows (cents are rounded per line, as on paper).
  function calculate(root) {
    let subtotal = 0;
    root.querySelectorAll('[data-bootcn-invoice-item]').forEach(function (row) {
      const quantity = Number(row.getAttribute('data-quantity')) || 0;
      const price = Number(row.getAttribute('data-price')) || 0;
      const amount = Math.round(quantity * price * 100) / 100;
      subtotal += amount;
      const priceCell = row.querySelector('[data-bootcn-invoice-price]');
      const amountCell = row.querySelector('[data-bootcn-invoice-amount]');
      if (priceCell) priceCell.textContent = format(root, price);
      if (amountCell) amountCell.textContent = format(root, amount);
    });
    const rate = Number(root.getAttribute('data-tax-rate')) || 0;
    const tax = Math.round(subtotal * rate * 100) / 100;
    const total = subtotal + tax;
    set(root, 'subtotal', format(root, subtotal));
    set(root, 'tax', format(root, tax));
    set(root, 'rate', Math.round(rate * 1000) / 10 + '%');
    set(root, 'total', format(root, total));
    return { subtotal: subtotal, tax: tax, total: total };
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest('[data-bootcn-invoice-print]');
    if (button && button.closest(ROOT)) window.print();
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(calculate);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    listening = false;
  }

  ns.invoice = { init: init, destroy: destroy, calculate: calculate };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
