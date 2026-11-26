/*
 * Tabs: one pane shown at a time, the rest a click away. From Portal.
 *
 * Binds Tabler's tab class contract (Bootstrap's, which Tabler keeps):
 *
 *   <ul class="nav nav-tabs" role="tablist">
 *     <li class="nav-item" role="presentation">
 *       <a class="nav-link active" href="#L10" role="tab" data-tab>L10</a>
 *     </li>
 *   </ul>
 *   <div class="tab-content">
 *     <div class="tab-pane active" id="L10" role="tabpanel">…</div>
 *   </div>
 *
 * Hand-written rather than Tabler's tab.ts, which is not standalone: it rides on
 * Bootstrap's base-component, event-handler and selector-engine. What it does is
 * this, and Tabler's one addition is kept — the URL hash picks the tab, so
 * report.html#L10 opens on L10 and a copied link says which level it showed. The
 * hash is shared (Almanac.hash): each tab row keeps its own pane in it, beside the
 * charts' views.
 *
 * Without JS every pane shows, stacked, and each tab is a link to its pane: the
 * inactive panes are hidden by this script, never by CSS. A chart in a pane drawn
 * while hidden repaints when shown — chart.js watches its container's width.
 */
(function () {
  'use strict';

  function linksOf(nav) {
    return Array.prototype.slice.call(nav.querySelectorAll('.nav-link[data-tab]'));
  }

  function paneOf(link) {
    return document.getElementById(link.hash.slice(1));
  }

  /* Show one tab's pane and hide its siblings'; only the chosen tab takes the
     keyboard (roving tabindex), so Tab moves past the row and arrows move in it. */
  function activate(nav, chosen) {
    linksOf(nav).forEach(function (link) {
      var on = link === chosen;
      link.classList.toggle('active', on);
      link.setAttribute('aria-selected', on ? 'true' : 'false');
      link.tabIndex = on ? 0 : -1;
      var pane = paneOf(link);
      if (!pane) return;
      pane.classList.toggle('active', on);
      pane.hidden = !on;
    });
  }

  function bind(nav) {
    var links = linksOf(nav);
    if (!links.length) return;

    var ids = links.map(function (link) { return link.hash.slice(1); });

    function fromHash() {
      var places = window.Almanac.hash.places();
      return links.filter(function (link) { return places.indexOf(link.hash.slice(1)) >= 0; })[0];
    }

    activate(nav, fromHash() || nav.querySelector('.nav-link.active[data-tab]') || links[0]);

    links.forEach(function (link, i) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        activate(nav, link);
        /* Remember the tab in the address without jumping the page to it. */
        window.Almanac.hash.place(ids, link.hash.slice(1));
      });
      link.addEventListener('keydown', function (event) {
        var step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        var next = links[(i + step + links.length) % links.length];
        next.focus();
        next.click();
      });
    });

    window.addEventListener('hashchange', function () {
      var link = fromHash();
      if (link) activate(nav, link);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.nav-tabs'), bind);
  });
})();
