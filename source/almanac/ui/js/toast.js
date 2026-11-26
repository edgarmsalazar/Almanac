/*
 * Toasts: a short note in the window's bottom-right corner saying what just
 * happened, gone again after a few seconds. app.css draws them.
 *
 *   Almanac.toast('Saved.');
 *   Almanac.toast({ title: 'Imported', text: '42 transactions from October.',
 *                   color: 'success', delay: 8000 });
 *
 * title       bold, in a header with the close button; without it the text and
 *             the button share one line
 * text        the note itself, as text, never as HTML
 * meta        small words at the header's end: "just now", "3 of 5"
 * color       primary, success, info, warning or danger: the start edge's colour
 * delay       milliseconds before it goes by itself, 5000 unless given; 0 keeps
 *             it until closed. The time stops while the pointer is over it.
 *
 * It returns the toast's element; Almanac.toast.close(element) takes it away.
 * A screen reader hears each one: the corner is a polite live region. A .toast
 * written into the page closes from its [data-close] button the same way.
 */
(function () {
  'use strict';

  var CLOSE_ICON = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>';

  function corner() {
    var box = document.querySelector('.toast-container');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toast-container';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    return box;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function closeButton() {
    var button = el('button', 'btn-close');
    button.type = 'button';
    button.setAttribute('data-close', '');
    button.setAttribute('aria-label', 'Close');
    button.innerHTML = CLOSE_ICON;
    return button;
  }

  function close(toast) {
    if (!toast || !toast.parentNode) return;
    clearTimeout(toast._almanacTimer);
    if (toast.parentNode.classList.contains('toast-container')) toast.remove();
    else toast.hidden = true;
  }

  function timer(toast, delay) {
    if (!delay) return;
    var left = delay;
    var started;
    function run() {
      started = Date.now();
      toast._almanacTimer = setTimeout(function () { close(toast); }, left);
    }
    toast.addEventListener('mouseenter', function () {
      clearTimeout(toast._almanacTimer);
      left -= Date.now() - started;
    });
    toast.addEventListener('mouseleave', run);
    run();
  }

  function toast(options) {
    if (typeof options === 'string') options = { text: options };
    options = options || {};
    var node = el('div', 'toast' + (options.color ? ' toast-' + options.color : ''));
    if (options.title) {
      var header = el('div', 'toast-header');
      header.appendChild(el('strong', 'toast-title', options.title));
      if (options.meta) header.appendChild(el('span', 'toast-meta', options.meta));
      header.appendChild(closeButton());
      node.appendChild(header);
      if (options.text) node.appendChild(el('div', 'toast-body', options.text));
    } else {
      var row = el('div', 'toast-row');
      row.appendChild(el('div', 'toast-body', options.text || ''));
      row.appendChild(closeButton());
      node.appendChild(row);
    }
    corner().appendChild(node);
    timer(node, options.delay === undefined ? 5000 : options.delay);
    return node;
  }

  toast.close = close;

  document.addEventListener('click', function (event) {
    var button = event.target.closest('.toast [data-close]');
    if (button) close(button.closest('.toast'));
  });

  window.Almanac = window.Almanac || {};
  window.Almanac.toast = toast;
})();
