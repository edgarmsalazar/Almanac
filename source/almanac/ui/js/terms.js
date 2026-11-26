/*
 * The lexicon's words, explained where they are first used.
 *
 * On each page the first use of each term in data/lexicon.js (its plural too) is
 * marked as a .term, with its definition shown in a tooltip on hover or focus:
 * Tabler's tooltip (ui/_tooltip.scss), a small dark bubble with an arrow, written
 * here without Popper. Only the first use, as a reference work links a word once:
 * marking every one would stripe a page that leans on a word. Code, headings,
 * links and controls are left as they are, and so are the lexicon page's own cards.
 */
(function () {
  'use strict';

  var SKIP = 'code, pre, .mermaid, a, h1, h2, h3, h4, button, select, option, label, script, style, .term, .navbar, .code-block, .lexicon-term';

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function mark(root, entry) {
    var pattern = new RegExp('\\b(' + escapeRegExp(entry.term) + 's?)\\b', 'i');
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue.trim() || node.parentElement.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        return pattern.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var node = walker.nextNode();
    if (!node) return;
    var match = pattern.exec(node.nodeValue);
    var word = node.splitText(match.index);
    word.splitText(match[1].length);
    var term = document.createElement('span');
    term.className = 'term';
    term.tabIndex = 0;
    term.setAttribute('data-definition', entry.definition + (entry.note ? ' ' + entry.note : ''));
    term.setAttribute('aria-label', match[1] + ': ' + entry.definition);
    term.textContent = word.nodeValue;
    word.parentNode.replaceChild(term, word);
  }

  var tip = null;

  function show(term) {
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'tooltip';
      tip.setAttribute('role', 'tooltip');
      tip.innerHTML = '<div class="tooltip-inner"></div>';
      document.body.appendChild(tip);
    }
    tip.firstChild.textContent = term.getAttribute('data-definition');
    tip.hidden = false;
    var box = term.getBoundingClientRect();
    var width = tip.offsetWidth;
    var left = Math.max(8, Math.min(window.innerWidth - width - 8, box.left + box.width / 2 - width / 2));
    var above = box.top - tip.offsetHeight - 8 > 0;
    tip.classList.toggle('is-below', !above);
    tip.style.left = left + window.scrollX + 'px';
    tip.style.top = (above ? box.top - tip.offsetHeight - 8 : box.bottom + 8) + window.scrollY + 'px';
    tip.style.setProperty('--arrow-x', box.left + box.width / 2 - left + 'px');
  }

  function hide() {
    if (tip) tip.hidden = true;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var lexicon = window.ALMANAC_DATA && window.ALMANAC_DATA.lexicon;
    var body = document.querySelector('.page-body');
    if (!lexicon || !body) return;
    lexicon.forEach(function (entry) { mark(body, entry); });
    ['mouseover', 'focusin'].forEach(function (kind) {
      body.addEventListener(kind, function (event) {
        var term = event.target.closest && event.target.closest('.term');
        if (term) show(term);
      });
    });
    ['mouseout', 'focusout'].forEach(function (kind) {
      body.addEventListener(kind, function (event) {
        if (event.target.closest && event.target.closest('.term')) hide();
      });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') hide();
    });
  });
})();
