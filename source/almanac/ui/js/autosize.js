/*
 * A textarea with data-autosize grows with what is typed, as tall as its text
 * and no taller. Where the browser sizes a field to its content by itself
 * (field-sizing, which app.css asks for), this does nothing.
 *
 *   <textarea class="form-control" data-autosize rows="1"></textarea>
 *
 * Almanac.autosize(textarea) sizes one again after the page changes its value.
 */
(function () {
  'use strict';

  var native = window.CSS && CSS.supports && CSS.supports('field-sizing', 'content');

  function size(area) {
    if (native || !area) return;
    var style = getComputedStyle(area);
    var borders = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    area.style.height = 'auto';
    area.style.height = (area.scrollHeight + borders) + 'px';
  }

  document.addEventListener('input', function (event) {
    if (event.target.matches && event.target.matches('textarea[data-autosize]')) size(event.target);
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('textarea[data-autosize]').forEach(size);
  });

  window.Almanac = window.Almanac || {};
  window.Almanac.autosize = size;
})();
