/*
 * Popovers: a bubble with an arrow opened from a button, holding a title and a
 * few lines. app.css draws it. Two ways to write one:
 *
 *   <button class="btn" type="button" data-popover="why-red">Why red?</button>
 *   <div class="popover" id="why-red" role="dialog" aria-label="Why red" hidden>
 *     <div class="popover-header">Over budget</div>
 *     <div class="popover-body">Eating out is $20 over for November.</div>
 *   </div>
 *
 * or, for words alone, on the button itself:
 *
 *   <button class="btn" type="button" data-popover-title="Over budget"
 *     data-popover-content="Eating out is $20 over for November.">Why red?</button>
 *
 * data-placement is top, bottom, left or right, top unless given; the bubble
 * moves to the opposite side when the window has no room on that one, and
 * along the edge to stay inside the window. data-popover-trigger="hover" opens
 * it while the pointer or the focus is on the button. One is open at a time; a
 * click elsewhere, Escape or the button again closes it. The words given in
 * attributes are set as text, never as HTML.
 */
(function () {
  'use strict';

  var GAP = 8;
  var open = null; /* { button, pop } */
  var made = 0;

  function popoverOf(button) {
    var id = button.getAttribute('data-popover');
    if (id) return document.getElementById(id);
    if (!button._almanacPopover) {
      var pop = document.createElement('div');
      pop.className = 'popover';
      pop.id = 'almanac-popover-' + (++made);
      pop.setAttribute('role', 'dialog');
      pop.hidden = true;
      var title = button.getAttribute('data-popover-title');
      if (title) {
        var head = document.createElement('div');
        head.className = 'popover-header';
        head.textContent = title;
        pop.appendChild(head);
        pop.setAttribute('aria-label', title);
      }
      var body = document.createElement('div');
      body.className = 'popover-body';
      body.textContent = button.getAttribute('data-popover-content') || '';
      pop.appendChild(body);
      document.body.appendChild(pop);
      button._almanacPopover = pop;
      button.setAttribute('aria-controls', pop.id);
    }
    return button._almanacPopover;
  }

  function place() {
    if (!open) return;
    var pop = open.pop;
    var at = open.button.getBoundingClientRect();
    var want = open.button.getAttribute('data-placement') || 'top';
    pop.style.top = '0px';
    pop.style.left = '0px';
    var w = pop.offsetWidth;
    var h = pop.offsetHeight;
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    var room = {
      top: at.top - GAP - h,
      bottom: vh - at.bottom - GAP - h,
      left: at.left - GAP - w,
      right: vw - at.right - GAP - w
    };
    var opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    var side = room[want] >= 0 || room[want] >= room[opposite[want]] ? want : opposite[want];
    var top, left;
    if (side === 'top' || side === 'bottom') {
      top = side === 'top' ? at.top - GAP - h : at.bottom + GAP;
      left = Math.max(GAP, Math.min(at.left + at.width / 2 - w / 2, vw - w - GAP));
      pop.style.setProperty('--arrow', (at.left + at.width / 2 - left) + 'px');
    } else {
      left = side === 'left' ? at.left - GAP - w : at.right + GAP;
      top = Math.max(GAP, Math.min(at.top + at.height / 2 - h / 2, vh - h - GAP));
      pop.style.setProperty('--arrow', (at.top + at.height / 2 - top) + 'px');
    }
    pop.setAttribute('data-side', side);
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
  }

  function close() {
    if (!open) return;
    open.pop.hidden = true;
    open.button.setAttribute('aria-expanded', 'false');
    open = null;
  }

  function show(button) {
    var pop = popoverOf(button);
    if (!pop) return;
    close();
    open = { button: button, pop: pop };
    pop.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    place();
  }

  function hover(button) {
    return button.getAttribute('data-popover-trigger') === 'hover';
  }

  function trigger(target) {
    return target && target.closest && target.closest('[data-popover], [data-popover-content]');
  }

  document.addEventListener('click', function (event) {
    var button = trigger(event.target);
    if (button && !hover(button)) {
      if (open && open.button === button) close();
      else show(button);
      return;
    }
    if (open && !open.pop.contains(event.target)) close();
  });

  ['mouseover', 'focusin'].forEach(function (type) {
    document.addEventListener(type, function (event) {
      var button = trigger(event.target);
      if (button && hover(button) && !(open && open.button === button)) show(button);
    });
  });

  ['mouseout', 'focusout'].forEach(function (type) {
    document.addEventListener(type, function (event) {
      var button = trigger(event.target);
      if (button && hover(button) && open && open.button === button && !button.contains(event.relatedTarget)) close();
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !open) return;
    var button = open.button;
    close();
    button.focus();
  });

  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, true);

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-popover], [data-popover-content]').forEach(function (button) {
      button.setAttribute('aria-expanded', 'false');
      if (button.getAttribute('data-popover')) button.setAttribute('aria-controls', button.getAttribute('data-popover'));
    });
  });

  window.Almanac = window.Almanac || {};
  window.Almanac.popover = { close: close };
})();
