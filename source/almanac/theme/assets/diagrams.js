/*
 * Mermaid diagrams, drawn in the browser from the page's own text, in the
 * theme's own colours and face, and again whenever the reader changes them.
 * Mermaid ships with the theme, so a site opened from disk draws them with no
 * server.
 *
 * Mermaid's "base" theme is the one it lets a page recolour, but it works its
 * shades out from the colours it is given and reads only plain ones: no var(),
 * no color-mix(). So each token is resolved on a hidden probe, painted onto a
 * one-pixel canvas, and read back as hex; a tint is the token painted at an
 * alpha over the surface, as the -lt tokens are.
 */
(function () {
  'use strict';

  var blocks = Array.prototype.slice.call(document.querySelectorAll('.mermaid'));
  var sources = blocks.map(function (block) { return block.textContent; });
  /* After the primary, the palette's hues in the order a series takes them. */
  var HUES = ['--azure', '--green', '--orange', '--purple', '--teal', '--red',
    '--yellow', '--indigo', '--pink', '--lime', '--cyan', '--blue'];

  var probe = document.createElement('span');
  probe.hidden = true;
  document.body.appendChild(probe);
  var context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });

  function resolve(token) {
    probe.style.color = 'var(' + token + ')';
    return getComputedStyle(probe).color;
  }

  /* Each layer a [token, alpha], painted bottom first; the pixel as #rrggbb. */
  function paint(layers) {
    context.clearRect(0, 0, 1, 1);
    layers.forEach(function (layer) {
      context.globalAlpha = layer[1];
      context.fillStyle = resolve(layer[0]);
      context.fillRect(0, 0, 1, 1);
    });
    var pixel = context.getImageData(0, 0, 1, 1).data;
    return '#' + [pixel[0], pixel[1], pixel[2]].map(function (channel) {
      return (channel < 16 ? '0' : '') + channel.toString(16);
    }).join('');
  }

  function solid(token) { return paint([[token, 1]]); }
  function tint(token, alpha) { return paint([['--bg-surface', 1], [token, alpha]]); }

  /* The primary first, then the palette's hues that are not the primary: the
     twelve a Mermaid series takes. */
  function series() {
    var primary = solid('--primary');
    return ['--primary'].concat(HUES.filter(function (token) { return solid(token) !== primary; })).slice(0, 12);
  }

  /* Black or white, whichever reads on the colour (WCAG relative luminance). */
  function ink(hex) {
    var linear = [1, 3, 5].map(function (at) {
      var channel = parseInt(hex.slice(at, at + 2), 16) / 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    var luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    return luminance > 0.179 ? '#000000' : '#ffffff';
  }

  function variables() {
    var surface = solid('--bg-surface');
    var text = solid('--body-color');
    var line = solid('--secondary');
    var border = solid('--border-color');
    var hues = series();
    var primary = solid(hues[0]);
    var node = tint(hues[0], 0.1);
    var group = solid('--bg-surface-secondary');
    var vars = {
      darkMode: document.documentElement.getAttribute('data-theme') === 'dark',
      fontFamily: getComputedStyle(document.body).fontFamily,
      fontSize: '14px',
      background: surface,
      textColor: text,
      lineColor: line,
      primaryColor: node,
      primaryTextColor: text,
      primaryBorderColor: primary,
      secondaryColor: tint(hues[1], 0.1),
      secondaryTextColor: text,
      secondaryBorderColor: solid(hues[1]),
      tertiaryColor: tint(hues[2], 0.1),
      tertiaryTextColor: text,
      tertiaryBorderColor: solid(hues[2]),
      mainBkg: node,
      nodeBorder: primary,
      nodeTextColor: text,
      clusterBkg: group,
      clusterBorder: border,
      titleColor: text,
      edgeLabelBackground: surface,
      noteBkgColor: tint('--warning', 0.15),
      noteBorderColor: solid('--warning'),
      noteTextColor: text,
      actorBkg: node,
      actorBorder: primary,
      actorTextColor: text,
      actorLineColor: line,
      signalColor: line,
      signalTextColor: text,
      labelBoxBkgColor: group,
      labelBoxBorderColor: border,
      labelTextColor: text,
      loopTextColor: text,
      activationBkgColor: group,
      activationBorderColor: line,
      sequenceNumberColor: solid('--primary-fg'),
      errorBkgColor: tint('--danger', 0.1),
      errorTextColor: solid('--danger')
    };
    var palette = hues.map(solid);
    palette.forEach(function (hex, index) {
      vars['pie' + (index + 1)] = hex;
      vars['cScale' + index] = hex;
      vars['cScaleLabel' + index] = ink(hex);
      if (index < 8) {
        vars['git' + index] = hex;
        vars['gitInv' + index] = ink(hex);
        vars['gitBranchLabel' + index] = ink(hex);
        vars['fillType' + index] = tint(hues[index], 0.1);
      }
    });
    vars.pieOpacity = '1';
    vars.pieStrokeColor = surface;
    vars.pieOuterStrokeColor = border;
    vars.xyChart = { plotColorPalette: palette.join(', ') };
    return vars;
  }

  function draw() {
    window.mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: variables() });
    blocks.forEach(function (block, index) {
      block.removeAttribute('data-processed');
      block.textContent = sources[index];
    });
    return window.mermaid.run({ nodes: blocks });
  }

  /* One drawing at a time: a change made while Mermaid is still drawing waits for it. */
  var drawing = Promise.resolve();
  function redraw() {
    drawing = drawing.then(draw, draw);
  }

  /* Mermaid measures its labels in the face it is given, so it waits for the fonts. */
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(redraw);
  new MutationObserver(redraw).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-theme-base', 'data-theme-primary', 'data-theme-font']
  });
})();
