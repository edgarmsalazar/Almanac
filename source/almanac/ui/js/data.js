/*
 * Measured numbers, filled into a page from data/*.js.
 *
 * A number a helper measured is never typed into a page: the page names it,
 * <span data-value="showcase.pages"></span>, by its path in window.ALMANAC_DATA,
 * and this fills it in once the page has loaded, so a rerun of the helper
 * updates the page. data-format says how to show it: "number" (1,344, the
 * default for numbers), "hex2" or "hex3" (0x1CB), or "text". A path that finds
 * nothing leaves the place as written, marked .data-missing.
 *
 * window.Almanac.data.get(path) gives the same lookup to a page's own script.
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

  function format(value, how) {
    if (how === 'hex2' || how === 'hex3') {
      var number = typeof value === 'number' ? value : parseInt(value, 16);
      var text = number.toString(16).toUpperCase();
      while (text.length < +how.slice(3)) text = '0' + text;
      return '0x' + text;
    }
    if (typeof value === 'number' && how !== 'text') return value.toLocaleString('en-GB');
    return String(value);
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-value]'), function (place) {
      var value = get(place.getAttribute('data-value'));
      if (value === undefined || value === null) {
        place.classList.add('data-missing');
        return;
      }
      place.textContent = format(value, place.getAttribute('data-format'));
    });
  });

  window.Almanac.data = { get: get, format: format };
})();
