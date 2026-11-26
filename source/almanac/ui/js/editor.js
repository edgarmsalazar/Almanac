/*
 * Rich-text editors: a <textarea data-editor> becomes a HugeRTE editor in the
 * theme's look, light or dark as the page is, and again in the other when the
 * reader switches. Load vendor/hugerte/hugerte.min.js before it, and
 * css/vendors.css.
 *
 *   <textarea class="form-control" data-editor name="note">Notes on <b>November</b>.</textarea>
 *
 * The toolbar has undo, bold, italic, lists and a link; data-editor-toolbar
 * replaces it with HugeRTE's own toolbar string. The textarea keeps the HTML,
 * so a form sends it as it would the plain field; Almanac.editor.value(textarea)
 * reads it at any moment, and the textarea fires "input" as the text changes.
 *
 * Almanac.editor(textarea, options) makes one by hand, options passed on to
 * hugerte.init. The editor's text takes the page's face and colours.
 */
(function () {
  'use strict';

  var TOOLBAR = 'undo redo | bold italic | bullist numlist | link';

  function dark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  /* The frame the editor writes in is a document of its own: it gets the page's
     face, size and colours written in, since it cannot read the page's CSS. */
  function contentStyle() {
    var style = getComputedStyle(document.body);
    return 'body { font-family: ' + style.fontFamily + '; font-size: ' + style.fontSize +
      '; line-height: 1.5; color: ' + style.color + '; background: ' +
      getComputedStyle(document.documentElement).getPropertyValue('--bg-surface') + '; margin: 0.75rem 1rem; }' +
      ' a { color: ' + getComputedStyle(document.documentElement).getPropertyValue('--primary') + '; }';
  }

  function make(area, options) {
    if (!window.hugerte) return null;
    if (!area.id) area.id = 'almanac-editor-' + Math.random().toString(36).slice(2, 9);
    var settings = {
      target: area,
      menubar: false,
      statusbar: false,
      branding: false,
      promotion: false,
      plugins: 'lists link autolink',
      toolbar: area.getAttribute('data-editor-toolbar') || TOOLBAR,
      skin: dark() ? 'oxide-dark' : 'oxide',
      content_css: dark() ? 'dark' : 'default',
      content_style: contentStyle(),
      height: Math.max(area.offsetHeight, 192),
      setup: function (editor) {
        editor.on('input change undo redo', function () {
          editor.save();
          area.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
    };
    Object.keys(options || {}).forEach(function (key) { settings[key] = options[key]; });
    area._almanacEditor = settings;
    return hugerte.init(settings);
  }

  function value(area) {
    var editor = window.hugerte && hugerte.get(area.id);
    return editor ? editor.getContent() : area.value;
  }

  /* On a change of theme, each editor is made again in the other skin, its text
     kept. */
  var lastDark = dark();
  new MutationObserver(function () {
    if (dark() === lastDark || !window.hugerte) return;
    lastDark = dark();
    document.querySelectorAll('textarea[data-editor]').forEach(function (area) {
      var editor = hugerte.get(area.id);
      if (!editor) return;
      editor.save();
      editor.remove();
      var settings = area._almanacEditor;
      settings.skin = dark() ? 'oxide-dark' : 'oxide';
      settings.content_css = dark() ? 'dark' : 'default';
      settings.content_style = contentStyle();
      hugerte.init(settings);
    });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('textarea[data-editor]').forEach(function (area) { make(area); });
  });

  window.Almanac = window.Almanac || {};
  window.Almanac.editor = make;
  window.Almanac.editor.value = value;
})();
