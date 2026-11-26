---
title: Forms and actions
layout: cards
description: "What a page that takes input needs: buttons in every colour, groups of them, forms with checkboxes, input groups and validation, modal dialogs, toasts, menus and pagination."
---

## Buttons

*Filled in each colour, outlined, or bare until hovered; three sizes; disabled, or busy while something saves.*

```example
<div class="space-y-3">
  <div class="btn-list">
    <button class="btn" type="button">Plain</button>
    <button class="btn btn-primary" type="button">Primary</button>
    <button class="btn btn-secondary" type="button">Secondary</button>
    <button class="btn btn-success" type="button">Success</button>
    <button class="btn btn-info" type="button">Info</button>
    <button class="btn btn-warning" type="button">Warning</button>
    <button class="btn btn-danger" type="button">Danger</button>
  </div>
  <div class="btn-list">
    <button class="btn btn-outline-primary" type="button">Outline</button>
    <button class="btn btn-outline-success" type="button">Success</button>
    <button class="btn btn-outline-warning" type="button">Warning</button>
    <button class="btn btn-outline-danger" type="button">Danger</button>
    <button class="btn btn-ghost-primary" type="button">Ghost</button>
    <button class="btn btn-ghost-danger" type="button">Danger</button>
    <button class="btn btn-ghost" type="button">Plain ghost</button>
    <button class="btn btn-link" type="button">Link</button>
  </div>
  <div class="btn-list">
    <button class="btn btn-primary btn-sm" type="button">Small</button>
    <button class="btn btn-primary" type="button">Regular</button>
    <button class="btn btn-primary btn-lg" type="button">Large</button>
    <button class="btn btn-pill" type="button">Pill</button>
    <button class="btn" type="button" disabled>Disabled</button>
    <button class="btn btn-primary btn-loading" type="button">Saving</button>
  </div>
</div>
```

`.btn-loading` hides the label behind a turning ring and takes no clicks; the page adds it while it works and takes it off after.

## Groups and lists

*`.btn-list` is a row of separate buttons that wraps; `.btn-group` joins them into one. With radios before each label, a group is a choice.*

```example
<div class="btn-list">
  <div class="btn-group" role="group" aria-label="Kind">
    <input class="btn-check" type="radio" name="kind" id="kind-expense" checked>
    <label class="btn" for="kind-expense">Expense</label>
    <input class="btn-check" type="radio" name="kind" id="kind-income">
    <label class="btn" for="kind-income">Income</label>
    <input class="btn-check" type="radio" name="kind" id="kind-transfer">
    <label class="btn" for="kind-transfer">Transfer</label>
  </div>
  <div class="btn-group" role="group" aria-label="Edit">
    <button class="btn" type="button">Split</button>
    <button class="btn" type="button">Merge</button>
    <button class="btn" type="button">Undo</button>
  </div>
</div>
```

`.btn-action` is a bare icon button for a row or a card, as the menus below use.

## A form

*Labels over fields in the grid, a field joined to its unit, a choice of checkboxes and radios, hints, and the form's buttons at its foot.*

```example
<form class="row g-3" onsubmit="event.preventDefault()">
  <div class="col-sm-6">
    <label class="form-label required" for="tx-payee">Payee</label>
    <input class="form-control" id="tx-payee" type="text" placeholder="Corner grocery" required>
  </div>
  <div class="col-sm-3">
    <label class="form-label" for="tx-date">Date</label>
    <input class="form-control" id="tx-date" type="date" value="2026-11-26">
  </div>
  <div class="col-sm-3">
    <label class="form-label required" for="tx-amount">Amount</label>
    <div class="input-group">
      <span class="input-group-text">$</span>
      <input class="form-control text-end tabular-nums" id="tx-amount" type="number" step="0.01" min="0" placeholder="0.00" required>
    </div>
  </div>
  <div class="col-sm-6">
    <label class="form-label" for="tx-envelope">Envelope</label>
    <select class="form-select w-100" id="tx-envelope">
      <option>Groceries</option><option>Eating out</option><option>Transport</option>
    </select>
    <p class="form-hint">Where the money comes from this month.</p>
  </div>
  <div class="col-sm-6">
    <span class="form-label">State</span>
    <div class="d-flex gap-3 mt-2">
      <label class="form-check"><input class="form-check-input" type="radio" name="tx-state" checked><span class="form-check-label">Cleared</span></label>
      <label class="form-check"><input class="form-check-input" type="radio" name="tx-state"><span class="form-check-label">Pending</span></label>
    </div>
  </div>
  <div class="col-12">
    <label class="form-label" for="tx-note">Note <span class="form-label-description">Optional</span></label>
    <textarea class="form-control" id="tx-note" rows="2"></textarea>
  </div>
  <div class="col-12">
    <label class="form-check">
      <input class="form-check-input" type="checkbox">
      <span><span class="form-check-label">Repeats every month</span>
      <span class="form-check-description">Added again on the same day until it is stopped.</span></span>
    </label>
  </div>
  <div class="col-12 btn-list btn-list-end">
    <button class="btn" type="reset">Clear</button>
    <button class="btn btn-primary" type="submit">Add transaction</button>
  </div>
</form>
```

Input groups take text or a button at either end, or both: `<span class="input-group-text">$</span>` before the field, `<button class="btn">` after it.

## Validation

*`.is-invalid` or `.is-valid` on a field colours it and shows the message after it. A form with `.was-validated` does the same from the browser's own checks: required, type, min and max.*

```example
<div class="row g-3">
  <div class="col-sm-6">
    <label class="form-label" for="v-budget">Monthly budget</label>
    <div class="input-group">
      <span class="input-group-text">$</span>
      <input class="form-control is-invalid" id="v-budget" type="text" value="four hundred" aria-describedby="v-budget-error">
    </div>
    <div class="invalid-feedback" id="v-budget-error">A number, such as 400.</div>
  </div>
  <div class="col-sm-6">
    <label class="form-label" for="v-name">Envelope name</label>
    <input class="form-control is-valid" id="v-name" type="text" value="Groceries">
    <div class="valid-feedback">No other envelope has this name.</div>
  </div>
</div>
<form class="d-flex flex-wrap align-items-start gap-2 mt-4" id="v-form" novalidate>
  <div class="flex-fill">
    <input class="form-control" type="email" placeholder="Where to send the report" aria-label="Email" required>
    <div class="invalid-feedback">An email address.</div>
  </div>
  <button class="btn btn-primary" type="submit">Send</button>
</form>
<script>
  document.getElementById('v-form').addEventListener('submit', function (event) {
    event.preventDefault();
    this.classList.add('was-validated');
  });
</script>
```

The page decides when to check: on submit, as here, or as each field is left. A message names what is wanted, not what went wrong.

## Modal

*A dialog over the page that takes the focus until it closes: Escape, the close button, a click on the backdrop or the form's own buttons.*

```example
<div class="btn-list">
  <button class="btn btn-primary" type="button" data-open="modal-envelope">New envelope</button>
  <button class="btn btn-outline-danger" type="button" data-open="modal-delete">Delete envelope</button>
</div>

<dialog class="modal" id="modal-envelope" aria-labelledby="modal-envelope-title">
  <form method="dialog">
    <div class="modal-header">
      <h2 class="modal-title" id="modal-envelope-title">New envelope</h2>
      <button class="btn-close" type="button" data-close aria-label="Close"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg></button>
    </div>
    <div class="modal-body space-y-3">
      <div>
        <label class="form-label" for="env-name">Name</label>
        <input class="form-control" id="env-name" type="text" placeholder="Gifts">
      </div>
      <div>
        <label class="form-label" for="env-amount">Each month</label>
        <div class="input-group"><span class="input-group-text">$</span><input class="form-control" id="env-amount" type="number" min="0" placeholder="0"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" type="button" data-close>Cancel</button>
      <button class="btn btn-primary" type="submit" value="save">Create</button>
    </div>
  </form>
</dialog>

<dialog class="modal modal-sm" id="modal-delete" aria-labelledby="modal-delete-title">
  <div class="modal-status modal-status-danger"></div>
  <div class="modal-body text-center">
    <h2 class="modal-title" id="modal-delete-title">Delete Eating out?</h2>
    <p class="text-secondary mb-0">Its 14 transactions move to Unsorted.</p>
  </div>
  <div class="modal-footer">
    <button class="btn me-auto" type="button" data-close>Cancel</button>
    <button class="btn btn-danger" type="button" data-close>Delete</button>
  </div>
</dialog>
```

`data-open="id"` on any button opens the dialog with that id. Inside a `<form method="dialog">`, a submit button closes it and leaves its `value` in the dialog's `returnValue`; the page listens for the dialog's `close` event to act on it.

## Toast

*A note in the window's corner saying what just happened, gone after five seconds, or kept while the pointer is over it.*

```example
<div class="btn-list">
  <button class="btn" type="button" id="toast-plain">Saved</button>
  <button class="btn" type="button" id="toast-titled">Imported</button>
  <button class="btn" type="button" id="toast-kept">Over budget</button>
</div>
<script>
  document.getElementById('toast-plain').addEventListener('click', function () {
    Almanac.toast('November is saved.');
  });
  document.getElementById('toast-titled').addEventListener('click', function () {
    Almanac.toast({ title: 'Imported', meta: 'just now', text: '42 transactions from the October statement.', color: 'success' });
  });
  document.getElementById('toast-kept').addEventListener('click', function () {
    Almanac.toast({ title: 'Over budget', text: 'Eating out is $20 over for November.', color: 'danger', delay: 0 });
  });
</script>
```

`Almanac.toast(text)` or `Almanac.toast({ title, text, meta, color, delay })`; `delay: 0` keeps it until it is closed. `toast.js` describes each key.

## Menu

*A menu under a button or a row's "more" icon. It opens above when there is no room below, and is never clipped by a table that scrolls.*

```example
<div class="btn-list mb-3">
  <div class="dropdown">
    <button class="btn dropdown-toggle" type="button" aria-expanded="false" aria-controls="menu-export">Export</button>
    <div class="dropdown-menu" id="menu-export" hidden>
      <div class="dropdown-header">This month</div>
      <button class="dropdown-item" type="button">CSV</button>
      <button class="dropdown-item" type="button">JSON</button>
      <div class="dropdown-divider"></div>
      <button class="dropdown-item" type="button" disabled>PDF</button>
    </div>
  </div>
</div>
<div class="table-responsive">
  <table class="table">
    <thead><tr><th>Payee</th><th class="text-end">Amount</th><th class="w-auto"></th></tr></thead>
    <tbody>
      <tr>
        <td>Corner grocery</td><td class="text-end tabular-nums">42.10</td>
        <td class="text-end">
          <div class="dropdown">
            <button class="btn-action dropdown-toggle" type="button" aria-expanded="false" aria-controls="menu-row-1" aria-label="More for Corner grocery"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/></svg></button>
            <div class="dropdown-menu dropdown-menu-end" id="menu-row-1" hidden>
              <button class="dropdown-item" type="button">Edit</button>
              <button class="dropdown-item" type="button">Split</button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item dropdown-item-danger" type="button">Delete</button>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

The toggle names its menu with `aria-controls`, and the menu starts `hidden`. The arrow keys move through the items; Escape closes the menu and returns to the toggle. Each item's work is the page's own: a click listener, or a link.

## Pagination

*Pages of a long list, the current one filled. `.page-text` puts words between the links; `.pagination-outline` borders each.*

```example
<div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
  <span class="text-secondary">1–20 of 312 transactions</span>
  <ul class="pagination">
    <li class="page-item disabled"><a class="page-link" aria-disabled="true" aria-label="Previous">‹</a></li>
    <li class="page-item active"><a class="page-link" aria-current="page">1</a></li>
    <li class="page-item"><a class="page-link" href="#pagination">2</a></li>
    <li class="page-item"><a class="page-link" href="#pagination">3</a></li>
    <li class="page-item"><span class="page-text">…</span></li>
    <li class="page-item"><a class="page-link" href="#pagination">16</a></li>
    <li class="page-item"><a class="page-link" href="#pagination" aria-label="Next">›</a></li>
  </ul>
</div>
<ul class="pagination pagination-outline pagination-sm mt-3">
  <li class="page-item"><a class="page-link" href="#pagination" aria-label="Previous">‹</a></li>
  <li class="page-item"><a class="page-link" href="#pagination">1</a></li>
  <li class="page-item active"><a class="page-link" aria-current="page">2</a></li>
  <li class="page-item"><a class="page-link" href="#pagination">3</a></li>
  <li class="page-item"><a class="page-link" href="#pagination" aria-label="Next">›</a></li>
</ul>
```

The links are the page's to write: a static page links to its other pages; an app page draws the rows for the page chosen.
