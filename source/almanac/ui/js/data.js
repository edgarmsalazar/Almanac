/*
 * Measured numbers, filled into a page from data/*.js.
 *
 * A number a helper measured is never typed into a page: the page names it,
 * <span data-value="showcase.pages"></span>, by its path in window.ALMANAC_DATA,
 * and this fills it in once the page has loaded, so a rerun of the helper
 * updates the page. data-format says how to show it: "number" (1,344, the
 * default for numbers), "currency" ($1,630.00), "hex2" or "hex3" (0x1CB), or
 * "text". A path that finds nothing leaves the place as written, marked
 * .data-missing.
 *
 * A currency is the element's data-currency, else the page's <html
 * data-currency>, else US dollars; data-decimals sets the decimals, else the
 * currency's own (two for dollars, none for yen).
 *
 * window.Almanac.data.get(path) gives the same lookup to a page's own script,
 * and format(value, how, options) the same formatting, options being
 * {currency: 'EUR', decimals: 0} for a currency (settings.js's Almanac.money,
 * which the charts share). fill(root) fills the places under root again, for
 * markup a page adds after load.
 */
(function () {
  'use strict';

  function get(path) {
    var value = window.ALMANAC_DATA;
    String(path).split('.').forEach(function (part) {
      value = value === undefined || value === null ? undefined : value[part];
    });
    return value;
  }

  function format(value, how, options) {
    if (how === 'currency') return window.Almanac.money(value, options);
    if (how === 'hex2' || how === 'hex3') {
      var number = typeof value === 'number' ? value : parseInt(value, 16);
      var text = number.toString(16).toUpperCase();
      while (text.length < +how.slice(3)) text = '0' + text;
      return '0x' + text;
    }
    if (typeof value === 'number' && how !== 'text') return value.toLocaleString('en-GB');
    return String(value);
  }

  /* Fill every [data-value] under root (the document unless given). Run once
     when the page has loaded; a page that adds such places later, or changes
     the data, runs it again over what it added. */
  function fill(root) {
    root = root || document;
    var places = Array.prototype.slice.call(root.querySelectorAll('[data-value]'));
    /* A place handed in itself is filled too, not only the places inside it. */
    if (root.matches && root.matches('[data-value]')) places.unshift(root);
    places.forEach(function (place) {
      var value = get(place.getAttribute('data-value'));
      if (value === undefined || value === null) {
        place.classList.add('data-missing');
        return;
      }
      place.classList.remove('data-missing');
      place.textContent = format(value, place.getAttribute('data-format'), {
        currency: place.getAttribute('data-currency'),
        decimals: place.getAttribute('data-decimals')
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    fill(document);
  });

  window.Almanac.data = { get: get, format: format, fill: fill };
})();
