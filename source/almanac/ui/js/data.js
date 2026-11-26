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
 * {currency: 'EUR', decimals: 0} for a currency.
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

  /* One Intl formatter per currency and decimals, made on first use. Narrow
     symbols, so dollars read $ rather than US$; the numbers' own locale, so a
     sum groups like the counts beside it. A code Intl does not know gives null. */
  var moneyFormats = {};
  function moneyFormat(code, decimals) {
    var key = code + '|' + decimals;
    if (!(key in moneyFormats)) {
      var options = { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' };
      if (decimals !== undefined) {
        options.minimumFractionDigits = decimals;
        options.maximumFractionDigits = decimals;
      }
      var made = null;
      try {
        made = new Intl.NumberFormat('en-GB', options);
      } catch (error) {
        /* An older browser without narrowSymbol: the plain symbol. */
        try {
          delete options.currencyDisplay;
          made = new Intl.NumberFormat('en-GB', options);
        } catch (again) {
          made = null;
        }
      }
      moneyFormats[key] = made;
    }
    return moneyFormats[key];
  }

  function money(value, options) {
    var number = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(number)) return String(value);
    var code = String(options.currency || document.documentElement.getAttribute('data-currency') || 'USD').toUpperCase();
    var decimals = parseInt(options.decimals, 10);
    decimals = isNaN(decimals) ? undefined : Math.max(0, Math.min(20, decimals));
    var made = moneyFormat(code, decimals);
    if (made) return made.format(number);
    var places = decimals === undefined ? 2 : decimals;
    return number.toLocaleString('en-GB', { minimumFractionDigits: places, maximumFractionDigits: places }) + ' ' + code;
  }

  function format(value, how, options) {
    if (how === 'currency') return money(value, options || {});
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
      place.textContent = format(value, place.getAttribute('data-format'), {
        currency: place.getAttribute('data-currency'),
        decimals: place.getAttribute('data-decimals')
      });
    });
  });

  window.Almanac.data = { get: get, format: format };
})();
