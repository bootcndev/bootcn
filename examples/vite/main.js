// Files installed by: bootcn init && bootcn add button dialog
// Vite bundles the CSS and the dialog script; the installed files stay plain
// CSS and JavaScript that also work without a bundler.
import './assets/css/tokens.css';
import './assets/css/button.css';
import './assets/css/dialog.css';
import './assets/js/dialog.js';

document.addEventListener('bootcn:dialog:confirm', () => {
  document.getElementById('confirm-status').textContent = 'Confirmed.';
});
