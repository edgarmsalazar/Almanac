/*
 * The site's search, in Tabler's navbar search field (.input-icon over a
 * .form-control, its search icon at the start) with its results in a dropdown
 * under it, Tabler's dropdown items: each a page or a section, its page above
 * its title, a line of its text with the words found marked.
 *
 * The index is the search plugin's, which the almanac plugin writes again as
 * search/search_index.js, a script rather than JSON, so a site opened from disk
 * reads it without a server. It is loaded the first time the field is used.
 *
 * Every word typed must be found, in a title or the text, a word's start
 * counting as found; a title's match outranks the text's. "/" or Ctrl K (⌘K)
 * puts the cursor in the field from anywhere; the arrows move through the
 * results, Enter opens one, Escape closes them.
 */
(function () {
  'use strict';

  var LIMIT = 10;
  var SNIPPET = 140;
  var form = document.querySelector('[data-almanac-search]');
  if (!form) return;
  var input = form.querySelector('input');
  var menu = form.querySelector('.almanac-search-results');
  var base = form.getAttribute('data-base') || '.';
  var docs = null;
  var chosen = -1;

  function escape(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* The index, loaded once, each entry with its page's title beside it. */
  function load(then) {
    if (docs) return then();
    if (window.ALMANAC_SEARCH) return then(prepare(window.ALMANAC_SEARCH));
    var tag = document.createElement('script');
    tag.src = form.getAttribute('data-index');
    tag.onload = function () { then(prepare(window.ALMANAC_SEARCH || { docs: [] })); };
    tag.onerror = function () { docs = []; show('<div class="almanac-search-empty">Search is not available: the site was built without the search plugin.</div>'); };
    document.head.appendChild(tag);
  }

  function prepare(index) {
    var pages = {};
    index.docs.forEach(function (doc) { if (doc.location.indexOf('#') < 0) pages[doc.location] = doc.title; });
    docs = index.docs.map(function (doc) {
      var page = doc.location.split('#')[0];
      return {
        location: doc.location,
        title: doc.title,
        page: doc.location.indexOf('#') < 0 ? '' : (pages[page] || ''),
        text: doc.text,
        haystack: (doc.title + ' ' + doc.text).toLowerCase(),
        titleLower: doc.title.toLowerCase()
      };
    });
  }

  function terms(query) {
    return query.toLowerCase().split(/\s+/).filter(Boolean);
  }

  /* A word found at a word's start scores more than one found inside a word. */
  function score(doc, words) {
    var total = 0;
    for (var i = 0; i < words.length; i++) {
      var atStart = new RegExp('(^|[^a-z0-9])' + escapeRegExp(words[i]));
      var inTitle = doc.titleLower.indexOf(words[i]) >= 0;
      if (doc.haystack.indexOf(words[i]) < 0) return 0;
      total += (inTitle ? 10 : 1) * (atStart.test(inTitle ? doc.titleLower : doc.haystack) ? 2 : 1);
    }
    return total;
  }

  /* A line of the text around the first word found, every word marked. */
  function snippet(text, words) {
    var lower = text.toLowerCase();
    var at = Math.max(0, lower.indexOf(words[0]));
    var start = Math.max(0, at - SNIPPET / 3);
    var line = (start ? '…' : '') + text.slice(start, start + SNIPPET) + (start + SNIPPET < text.length ? '…' : '');
    var marked = escape(line);
    words.forEach(function (word) {
      marked = marked.replace(new RegExp('(' + escapeRegExp(escape(word)) + ')', 'gi'), '<mark>$1</mark>');
    });
    return marked;
  }

  /* In the sidebar the results open over the page beside it, since the sidebar
     scrolls and would cut them off at its edge. */
  var inSidebar = !!form.closest('.navbar-vertical');
  var wide = window.matchMedia('(min-width: 992px)');

  function show(html) {
    menu.innerHTML = html;
    if (inSidebar && wide.matches) {
      var box = form.getBoundingClientRect();
      menu.style.top = box.top + 'px';
      menu.style.left = box.right + 8 + 'px';
    }
    menu.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function hide() {
    menu.hidden = true;
    chosen = -1;
    input.setAttribute('aria-expanded', 'false');
  }

  function search() {
    var words = terms(input.value);
    if (!words.length) return hide();
    load(function () {
      var found = docs.map(function (doc) { return { doc: doc, score: score(doc, words) }; })
        .filter(function (hit) { return hit.score > 0; })
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, LIMIT);
      chosen = -1;
      if (!found.length) return show('<div class="almanac-search-empty">Nothing found for “' + escape(input.value.trim()) + '”.</div>');
      show(found.map(function (hit, index) {
        var doc = hit.doc;
        return '<a class="dropdown-item almanac-search-hit" role="option" id="almanac-hit-' + index + '" href="' + escape(base + '/' + doc.location) + '">' +
          (doc.page ? '<span class="almanac-search-page">' + escape(doc.page) + '</span>' : '') +
          '<span class="almanac-search-title">' + escape(doc.title) + '</span>' +
          (doc.text ? '<span class="almanac-search-text">' + snippet(doc.text, words) + '</span>' : '') + '</a>';
      }).join(''));
    });
  }

  function choose(step) {
    var hits = menu.querySelectorAll('.almanac-search-hit');
    if (!hits.length) return;
    chosen = (chosen + step + hits.length) % hits.length;
    Array.prototype.forEach.call(hits, function (hit, index) { hit.classList.toggle('active', index === chosen); });
    hits[chosen].scrollIntoView({ block: 'nearest' });
    input.setAttribute('aria-activedescendant', hits[chosen].id);
  }

  input.addEventListener('focus', function () { load(function () {}); if (input.value.trim()) search(); });
  input.addEventListener('input', search);
  input.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowDown') { event.preventDefault(); choose(1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); choose(-1); }
    else if (event.key === 'Escape') { hide(); input.blur(); }
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var hits = menu.querySelectorAll('.almanac-search-hit');
    var hit = hits[chosen >= 0 ? chosen : 0];
    if (hit) window.location.href = hit.href;
  });
  document.addEventListener('click', function (event) { if (!form.contains(event.target)) hide(); });
  document.addEventListener('keydown', function (event) {
    var typing = /^(input|textarea|select)$/i.test(event.target.tagName) || event.target.isContentEditable;
    if ((event.key === '/' && !typing) || (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey))) {
      event.preventDefault();
      input.focus();
      input.select();
    }
  });

  /* The hint shows the shortcut this keyboard has. */
  var hint = form.querySelector('.almanac-search-kbd');
  if (hint && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) hint.textContent = '⌘K';
})();
