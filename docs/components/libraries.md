---
title: Libraries
layout: cards
description: "Three libraries the kit carries in vendor/, in the theme's look: a drop zone for files, a month of events, and a rich-text field. Each loads only on a page that uses it."
---

## Drop zone

*Drag a file in, or click to choose one: a bank statement to import. Dropzone draws the box and a card for each file; the page reads the files itself, so nothing leaves the computer.*

```example
<div class="dropzone dz-local" id="statement-drop">
  <div class="dz-message">
    <h3 class="dropzone-msg-title">Drop a statement here</h3>
    <span class="dropzone-msg-desc">A CSV from the bank, or click to choose one.</span>
  </div>
</div>
<p class="text-secondary mt-3 mb-0" id="statement-read">No file read yet.</p>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    var zone = new Dropzone('#statement-drop', {
      url: '#', autoProcessQueue: false, acceptedFiles: '.csv,text/csv', maxFilesize: 5
    });
    zone.on('addedfile', function (file) {
      file.text().then(function (text) {
        var rows = text.trim().split(/\r?\n/).length - 1;
        document.getElementById('statement-read').textContent =
          file.name + ': ' + rows + ' transactions read.';
        Almanac.toast({ title: 'Read', text: rows + ' transactions from ' + file.name + '.', color: 'success' });
      });
    });
  });
</script>
```

`url: '#'` and `autoProcessQueue: false` keep Dropzone from sending anything: a page with no server reads each file as it is added, with `file.text()`. `.dz-local` hides the upload bar it would otherwise draw. Load `vendor/dropzone/dropzone.css`, `css/vendors.css` and `vendor/dropzone/dropzone-min.js`, then set `Dropzone.autoDiscover = false` so the page makes its own.

## Calendar

*A month of events, with a list to switch to: bills and paydays. FullCalendar draws it, in the theme's colours.*

```example
<div id="bills-calendar"></div>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    new FullCalendar.Calendar(document.getElementById('bills-calendar'), {
      initialView: 'dayGridMonth',
      initialDate: '2026-11-01',
      firstDay: 1,
      height: 'auto',
      headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' },
      events: [
        { title: 'Rent', start: '2026-11-01', color: 'var(--red)' },
        { title: 'Payday', start: '2026-11-15', color: 'var(--green)' },
        { title: 'Phone', start: '2026-11-18' },
        { title: 'Insurance', start: '2026-11-22' },
        { title: 'Payday', start: '2026-11-28', color: 'var(--green)' },
        { title: 'Budget review', start: '2026-11-30T18:00' }
      ]
    }).render();
  });
</script>
```

Load `css/vendors.css` and `vendor/fullcalendar/fullcalendar.min.js`, which carries its own stylesheet; the page makes the calendar with `new FullCalendar.Calendar(element, options).render()` once the page has loaded. Events take a token for their colour, as here. FullCalendar's own documentation lists every option; its standard bundle, the one carried, has the month, week, day and list views. For a small month to pick a day from, the [mini calendar](forms.md#mini-calendar) needs no library.

## Rich-text field

*A note with bold, lists and links. HugeRTE draws the editor; `editor.js` makes one of each `<textarea data-editor>`, light or dark as the page is.*

```example
<label class="form-label" for="month-notes">Notes on the month</label>
<textarea class="form-control" id="month-notes" data-editor name="notes">Notes on <b>November</b>: the car insurance renews next month.<ul><li>Cancel the old phone plan</li><li>Move $200 to savings</li></ul></textarea>
```

Load `css/vendors.css`, `vendor/hugerte/hugerte.min.js` and `js/editor.js`. The textarea keeps the HTML, so a form sends it as it would a plain field, and fires `input` as it changes; `Almanac.editor.value(textarea)` reads it at any moment. The toolbar has undo, bold, italic, lists and a link; `data-editor-toolbar` changes it. The kit carries the lists, link and autolink plugins and the light and dark skins; the rest of HugeRTE's plugins are left out.
