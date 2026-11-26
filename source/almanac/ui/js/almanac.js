/*
 * The docs layout's contents: the column beside the article marks the section
 * being read, and on a narrower window the floating button opens the same list
 * in the side panel.
 */
(function () {
  'use strict';

  var column = document.querySelector('[data-almanac-toc]');
  if (!column) return;
  var links = Array.prototype.slice.call(column.querySelectorAll('.nav-link'));
  var targets = links.map(function (link) { return document.getElementById(decodeURIComponent(link.hash.slice(1))); });
  var pending = false;

  /* "You are here": the last heading whose top has passed the upper third of
     the window, or the first, above them all; the last of all once the page is
     scrolled to its foot, where a short last section never reaches the line.
     A list longer than its column is scrolled to keep the mark in sight. */
  function locate() {
    pending = false;
    var line = window.innerHeight / 3;
    var here = 0;
    targets.forEach(function (target, index) {
      if (target && target.getBoundingClientRect().top <= line) here = index;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) here = links.length - 1;
    links.forEach(function (link, index) { link.classList.toggle('active', index === here); });
    var mark = links[here];
    var top = mark.offsetTop - column.offsetTop;
    if (top < column.scrollTop) column.scrollTop = top;
    else if (top + mark.offsetHeight > column.scrollTop + column.clientHeight) column.scrollTop = top + mark.offsetHeight - column.clientHeight;
  }

  window.addEventListener('scroll', function () {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(locate);
  }, { passive: true });
  locate();

  /* The side panel holds a copy of the column's list. */
  var toggle = document.getElementById('toc-toggle');
  var panel = document.getElementById('toc');
  if (!toggle || !panel) return;
  var list = panel.querySelector('[data-toc-list]');
  list.innerHTML = column.innerHTML;
  toggle.hidden = false;

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', function () { setOpen(panel.hidden); });
  panel.querySelector('.btn-close').addEventListener('click', function () { setOpen(false); toggle.focus(); });
  list.addEventListener('click', function (event) { if (event.target.closest('.nav-link')) setOpen(false); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !panel.hidden) { setOpen(false); toggle.focus(); }
  });
})();
