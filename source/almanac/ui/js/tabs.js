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
 *
 * Clicks and arrow keys are taken on the document, so a tab row added after load
 * answers them; what it needs once is its first view, the other panes hidden:
 * Almanac.tabs.show(nav) gives it, as the load does for the rows written in.
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

  function fromHash(nav) {
    var places = window.Almanac.hash.places();
    return linksOf(nav).filter(function (link) { return places.indexOf(link.hash.slice(1)) >= 0; })[0];
  }

  /* A tab row's first view: the tab the address names, else the one written
     active, else the first. */
  function show(nav) {
    var links = linksOf(nav);
    if (links.length) activate(nav, fromHash(nav) || nav.querySelector('.nav-link.active[data-tab]') || links[0]);
  }

  /* The clicks and keys are taken on the document and the row read at each, so a
     tab row added after load answers them as a written one does. */
  function tabOf(target) {
    var link = target.closest && target.closest('.nav-link[data-tab]');
    var nav = link && link.closest('.nav-tabs');
    return nav ? { link: link, nav: nav } : null;
  }

  document.addEventListener('click', function (event) {
    var tab = tabOf(event.target);
    if (!tab) return;
    event.preventDefault();
    activate(tab.nav, tab.link);
    /* Remember the tab in the address without jumping the page to it. */
    window.Almanac.hash.place(linksOf(tab.nav).map(function (link) { return link.hash.slice(1); }),
      tab.link.hash.slice(1));
  });

  document.addEventListener('keydown', function (event) {
    var step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    var tab = step && tabOf(event.target);
    if (!tab) return;
    event.preventDefault();
    var links = linksOf(tab.nav);
    var next = links[(links.indexOf(tab.link) + step + links.length) % links.length];
    next.focus();
    next.click();
  });

  window.addEventListener('hashchange', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.nav-tabs'), function (nav) {
      var link = fromHash(nav);
      if (link) activate(nav, link);
    });
  });

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.nav-tabs'), show);
  });

  window.Almanac.tabs = { show: show };
})();
