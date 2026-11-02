/*
 * Code blocks: their colours, their headers and their copy buttons.
 *
 * Colours: each <pre class="highlight" data-lang="cpp"> is tokenised once on load
 * and wrapped in spans of Tabler's highlight classes (preview/scss/_highlight.scss):
 * .c a comment, .k a keyword or built-in type, .nc a type's name, .nf a
 * function's name, .s a string, .mi a number, .cp a preprocessor line. Tabler
 * colours at build time with Shiki; Almanac's scripts have no build, and a C++ excerpt
 * needs only these. C is read as C++, and CMake has its own few. A language it
 * does not know is left plain.
 *
 * Header: a block quoting the source, <div class="code-block"><pre class="highlight"
 * data-lang="cpp"><code data-source="source/…/file.hpp" data-lines="54-68">, gets a
 * header naming the file and its lines, and a copy button. The quoted lines are
 * written into the page by the project, which rereads them from the source, so
 * a page is refreshed when the code moves.
 *
 * Every other block, as pymdownx.highlight writes it (<div class="highlight">),
 * gets a copy button too, over its corner. A block given a title on its fence,
 * ```python title="tools/build.py", gets the quote's header instead, with the
 * button in it; pymdownx.highlight's auto_title gives every block one, naming
 * its language.
 *
 * Copy: Tabler's clipboard contract (core/js/src/clipboard.ts): a button with
 * data-copy naming what to copy by selector, holding a .clipboard-label and a
 * .clipboard-feedback, carries .copied for two seconds after. settings.js does the
 * copying, from file:// too.
 */
(function () {
  'use strict';

  var KEYWORDS = ('alignas auto break case catch class const constexpr continue default delete do else enum ' +
    'explicit extern false for friend if inline namespace new noexcept nullptr operator private protected ' +
    'public return sizeof static static_cast struct switch template this throw true try typedef typename ' +
    'union using virtual void volatile while bool char double float int long short signed unsigned ' +
    'size_t uint8_t uint16_t uint32_t uint64_t int8_t int16_t int32_t int64_t std').split(' ');
  var IS_KEYWORD = {};
  KEYWORDS.forEach(function (word) { IS_KEYWORD[word] = true; });

  var TOKEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])')|(^[ \t]*#[^\n]*)|\b(0x[0-9a-fA-F]+|\d+(?:\.\d+)?)\b|([A-Za-z_]\w*)/gm;

  function escape(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function span(kind, text) {
    return '<span class="' + kind + '">' + escape(text) + '</span>';
  }

  function cpp(source) {
    var out = '';
    var last = 0;
    var previous = '';
    var match;
    TOKEN.lastIndex = 0;
    while ((match = TOKEN.exec(source))) {
      out += escape(source.slice(last, match.index));
      last = TOKEN.lastIndex;
      if (match[1]) out += span('c', match[1]);
      else if (match[2]) out += span('s', match[2]);
      else if (match[3]) out += span('cp', match[3]);
      else if (match[4]) out += span('mi', match[4]);
      else {
        var word = match[5];
        var after = source.slice(last).match(/^\s*(.)/);
        if (IS_KEYWORD[word]) out += span('k', word);
        else if (/^(struct|class|enum|namespace)$/.test(previous) || /^[A-Z][a-z]/.test(word)) out += span('nc', word);
        else if (after && after[1] === '(') out += span('nf', word);
        else out += escape(word);
        previous = word;
      }
    }
    return out + escape(source.slice(last));
  }

  /* CMake: a comment, a string, a variable, a command before its bracket, and the
     upper-case words its commands take. */
  var CMAKE_TOKEN = /(#[^\n]*)|("(?:\\.|[^"\\])*")|(\$\{[^}]*\}|\$<[^>]*>)|([A-Za-z_]\w*)(?=\s*\()|\b([A-Z][A-Z0-9_]+)\b/g;

  function cmake(source) {
    var out = '';
    var last = 0;
    var match;
    CMAKE_TOKEN.lastIndex = 0;
    while ((match = CMAKE_TOKEN.exec(source))) {
      out += escape(source.slice(last, match.index));
      last = CMAKE_TOKEN.lastIndex;
      if (match[1]) out += span('c', match[1]);
      else if (match[2]) out += span('s', match[2]);
      else if (match[3]) out += span('mi', match[3]);
      else if (match[4]) out += span('nf', match[4]);
      else out += span('k', match[5]);
    }
    return out + escape(source.slice(last));
  }

  var LANGUAGES = { cpp: cpp, c: cpp, cmake: cmake };

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('pre.highlight[data-lang]'), function (pre) {
      var colour = LANGUAGES[pre.getAttribute('data-lang')];
      var code = pre.querySelector('code') || pre;
      if (colour) code.innerHTML = colour(code.textContent);
    });

    var copyIcon = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"/>' +
      '<path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"/></svg>';

    function copyButton(code) {
      var button = document.createElement('button');
      button.className = 'btn btn-sm';
      button.type = 'button';
      button.setAttribute('data-copy', '#' + code.id);
      button.innerHTML = copyIcon + '<span class="clipboard-label">Copy</span><span class="clipboard-feedback">Copied</span>';
      return button;
    }

    function header(path, lines, code) {
      var row = document.createElement('div');
      row.className = 'code-block-header';
      row.innerHTML = '<span class="code-block-path"></span><span class="code-block-lines"></span>';
      row.querySelector('.code-block-path').textContent = path;
      row.querySelector('.code-block-lines').textContent = lines ? 'lines ' + lines : '';
      row.appendChild(copyButton(code));
      return row;
    }

    Array.prototype.forEach.call(document.querySelectorAll('.code-block code[data-source]'), function (code, n) {
      var block = code.closest('.code-block');
      if (!code.id) code.id = 'code-' + (n + 1);
      var lines = (code.getAttribute('data-lines') || '').replace('-', '–');
      block.insertBefore(header(code.getAttribute('data-source'), lines, code), block.firstChild);
    });

    Array.prototype.forEach.call(document.querySelectorAll('div.highlight'), function (block, n) {
      var code = block.querySelector('pre > code');
      if (!code) return;
      if (!code.id) code.id = 'highlight-' + (n + 1);
      var title = block.querySelector(':scope > .filename');
      if (title) {
        block.classList.add('code-block');
        block.replaceChild(header(title.textContent, '', code), title);
      } else {
        var button = copyButton(code);
        button.classList.add('code-copy');
        block.classList.add('code-copyable');
        block.insertBefore(button, block.firstChild);
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (button) {
      button.addEventListener('click', function () {
        var source = document.querySelector(button.getAttribute('data-copy'));
        if (!source || !window.Almanac) return;
        window.Almanac.copyText(source.textContent, function () {
          button.classList.add('copied');
          setTimeout(function () { button.classList.remove('copied'); }, 2000);
        });
      });
    });
  });
})();
