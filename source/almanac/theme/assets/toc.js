/*
 * The page's contents, in a side panel.
 *
 * Tabler's pieces: its floating button (.btn-floating, bottom-left, as its own
 * theme settings open) toggles an offcanvas panel from the left holding a
 * .nav.nav-vertical list of the page's sections — the list its documentation's
 * table of contents is. Not modal: the page stays usable while it is open, the
 * button stays clickable to close it, and choosing a section closes it too.
 *
 * The sections are the page's top-level cards, by their header titles, read when
 * the panel opens — so a new card appears with no list to maintain, and a card in
 * a tab not chosen is left out until its tab is. The section being read is
 * marked ("you are here") while the panel is open, as the page scrolls.
 * Choosing one scrolls to it without rewriting the address, which holds the
 * choices a copied link carries (Almanac.hash).
 *
 * A page opts in by carrying the button and the panel; without JS the button stays
 * hidden.
 */
(function () {
  'use strict';

  /* Top-level cards with a header title, in page order: not a card inside a card
     (a card of cards), not one hidden, as in a tab not chosen. */
  function sections() {
    return Array.prototype.filter.call(document.querySelectorAll('.page-body .card'), function (card) {
      if (card.parentElement.closest('.card')) return false;
      if (card.offsetParent === null) return false;
      return !!titleOf(card);
    });
  }

  function titleOf(card) {
    var header = card.querySelector('.card-header');
    var title = header && header.querySelector('.card-title');
    return title ? title.textContent.trim() : '';
  }

  /* A card needs an id to be linked to: its own, its title's, or one made from
     its title, unique on the page. */
  function anchor(card, used) {
    if (card.id) return card.id;
    var title = card.querySelector('.card-header .card-title[id]');
    if (title) return title.id;
    var base = 'toc-' + titleOf(card).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    var id = base;
    for (var n = 2; used[id] || document.getElementById(id); n++) id = base + '-' + n;
    used[id] = true;
    card.id = id;
    return id;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('toc-toggle');
    var panel = document.getElementById('toc');
    if (!toggle || !panel) return;
    var list = panel.querySelector('[data-toc-list]');
    var close = panel.querySelector('.btn-close');
    var cards = [];
    var pending = false;
    toggle.hidden = false;

    function mark(id) {
      Array.prototype.forEach.call(list.querySelectorAll('.nav-link'), function (link) {
        var here = link.hash === '#' + id;
        link.classList.toggle('active', here);
        if (here) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }

    /* "You are here": the last card whose top has passed the upper third of the
       window — the one being read — or the first, above them all. Worked out
       from the cards' positions rather than from intersection events, which only
       report changes and can skip a section on a fast scroll. */
    function locate() {
      pending = false;
      if (!cards.length || panel.hidden) return;
      var line = window.innerHeight / 3;
      var here = cards[0];
      cards.forEach(function (card) {
        if (card.getBoundingClientRect().top <= line) here = card;
      });
      mark(here.id);
    }

    window.addEventListener('scroll', function () {
      if (pending || panel.hidden) return;
      pending = true;
      window.requestAnimationFrame(locate);
    }, { passive: true });

    function build() {
      var used = {};
      cards = sections();
      list.textContent = '';
      cards.forEach(function (card) {
        var link = document.createElement('a');
        link.className = 'nav-link';
        link.href = '#' + anchor(card, used);
        link.textContent = titleOf(card);
        link.addEventListener('click', function (event) {
          event.preventDefault();
          setOpen(false);
          card.scrollIntoView();
        });
        list.appendChild(link);
      });
    }

    function setOpen(open) {
      if (open) build();
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) locate();
    }

    toggle.addEventListener('click', function () { setOpen(panel.hidden); });
    if (close) close.addEventListener('click', function () {
      setOpen(false);
      toggle.focus();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
  });
})();
