/*
 * Maths, as pymdownx.arithmatex writes it with generic: true — inline
 * <span class="arithmatex">\(…\)</span>, a block <div class="arithmatex">\[…\]</div>
 * — typeset in the browser by KaTeX. KaTeX ships with the theme, so a site
 * opened from disk draws it with no server. A formula KaTeX cannot read is left
 * as written, in the danger colour.
 */
(function () {
  'use strict';

  var DELIMITED = /^\s*(\\\(|\\\[|\$\$?)([\s\S]*?)(\\\)|\\\]|\$\$?)\s*$/;

  Array.prototype.forEach.call(document.querySelectorAll('.arithmatex'), function (element) {
    var found = element.textContent.match(DELIMITED);
    if (!found) return;
    window.katex.render(found[2], element, {
      displayMode: element.tagName === 'DIV',
      throwOnError: false,
      errorColor: 'var(--danger)'
    });
  });
})();
