(function () {
  var pill = document.getElementById("searchPill");
  if (!pill) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var pops = ["popWhere", "popWhen", "popWho"].map(function (id) { return document.getElementById(id); });
  var btns = {
    popWhere: document.getElementById("segWhere"),
    popWhen: document.getElementById("segWhen"),
    popWho: document.getElementById("segWho")
  };
  var searchInput = document.getElementById("searchInput");
  var suggestList = document.getElementById("suggestList");
  var timer;

  function setExpanded(id, on) {
    var b = id === "popWhere" ? searchInput : btns[id];
    if (b) b.setAttribute("aria-expanded", on ? "true" : "false");
  }
  function closeAll() {
    pops.forEach(function (p) {
      if (!p) return;
      p.hidden = true;
      setExpanded(p.id, false);
    });
  }
  function openPop(id) {
    pops.forEach(function (p) {
      if (!p) return;
      var on = p.id === id;
      p.hidden = !on;
      setExpanded(p.id, on);
    });
  }

  // "When" and "Who" toggle their popovers.
  ["popWhen", "popWho"].forEach(function (id) {
    var b = btns[id];
    if (!b) return;
    b.addEventListener("click", function (e) {
      e.preventDefault();
      var p = document.getElementById(id);
      if (p && !p.hidden) closeAll();
      else openPop(id);
    });
  });
  // "Where" is a text field: clicking anywhere on the segment focuses it and opens suggestions.
  if (btns.popWhere) {
    btns.popWhere.addEventListener("click", function () {
      if (searchInput && document.activeElement !== searchInput) searchInput.focus();
      else openPop("popWhere");
    });
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search-pill, #mobileSearchBtn")) closeAll();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeAll(); closeSheet(); }
  });

  if (searchInput) {
    searchInput.addEventListener("focus", function () { openPop("popWhere"); });
    searchInput.addEventListener("input", function () {
      clearTimeout(timer);
      var q = searchInput.value.trim();
      timer = setTimeout(function () {
        fetch("/listings/suggest?q=" + encodeURIComponent(q))
          .then(function (r) { return r.json(); })
          .then(function (rows) {
            suggestList.innerHTML = "";
            if (q && !rows.length) {
              var none = document.createElement("li");
              none.className = "pop-title";
              none.textContent = "No matching destinations";
              suggestList.appendChild(none);
            }
            rows.forEach(function (label) {
              var li = document.createElement("li");
              var btn = document.createElement("button");
              btn.type = "button";
              btn.textContent = label;
              btn.addEventListener("click", function () {
                searchInput.value = label;
                closeAll();
              });
              li.appendChild(btn);
              suggestList.appendChild(li);
            });
          })
          .catch(function () {});
      }, 200);
    });
  }

  var whoLabel = document.getElementById("whoLabel");
  var guestsInput = document.getElementById("guestsInput");
  var steps = Array.prototype.slice.call(document.querySelectorAll("[data-hg]"));
  var whoTouched = false;
  (function restoreGuests() {
    var saved = guestsInput ? parseInt(guestsInput.value, 10) : 0;
    if (saved > 1 && steps[0]) { steps[0].dataset.val = String(saved); whoTouched = true; }
  })();
  function whoVal() {
    var n = 0;
    steps.forEach(function (s) { n += Number(s.dataset.val) || 0; });
    if (whoLabel) whoLabel.textContent = (n > 1 || whoTouched) ? (n + (n === 1 ? " guest" : " guests")) : "Add guests";
    if (guestsInput) guestsInput.value = n > 1 ? String(n) : "";
    steps.forEach(function (s) {
      s.querySelector("span").textContent = s.dataset.val;
      s.children[0].disabled = Number(s.dataset.val) <= Number(s.dataset.min);
    });
  }
  document.getElementById("popWho") && document.getElementById("popWho").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-d]"); if (!b) return;
    var s = b.parentNode;
    whoTouched = true;
    s.dataset.val = Math.max(Number(s.dataset.min), Number(s.dataset.val) + Number(b.dataset.d));
    whoVal();
  });
  whoVal();

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var start = null, end = null, view = new Date(today.getFullYear(), today.getMonth(), 1);
  var cal = document.getElementById("headerCal");
  var whenLabel = document.getElementById("whenLabel");
  var checkinInput = document.getElementById("checkinInput");
  var checkoutInput = document.getElementById("checkoutInput");
  function parseISO(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
    if (!m) return null;
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  (function restoreDates() {
    var a = parseISO(checkinInput && checkinInput.value), b = parseISO(checkoutInput && checkoutInput.value);
    if (a && b && b > a) { start = a; end = b; view = new Date(a.getFullYear(), a.getMonth(), 1); if (view < new Date(today.getFullYear(), today.getMonth(), 1)) view = new Date(today.getFullYear(), today.getMonth(), 1); }
  })();
  function rangeLabel(a, b) {
    var left = SHORT[a.getMonth()] + " " + a.getDate();
    var right = (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) ? String(b.getDate()) : SHORT[b.getMonth()] + " " + b.getDate();
    return left + " \u2013 " + right;
  }
  function same(a, b) { return a && b && a.getTime() === b.getTime(); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function monthHTML(first, idx) {
    var y = first.getFullYear(), m = first.getMonth();
    var lead = first.getDay(), days = new Date(y, m + 1, 0).getDate();
    var h = '<div class="cal-month"><div class="cal-head">';
    if (idx === 0) h += '<button type="button" class="cal-nav prev" data-hnav="-1" aria-label="Previous month"><i class="fa-solid fa-chevron-left"></i></button>';
    h += MONTHS[m] + " " + y;
    if (idx === 1) h += '<button type="button" class="cal-nav next" data-hnav="1" aria-label="Next month"><i class="fa-solid fa-chevron-right"></i></button>';
    h += '</div><div class="cal-grid">';
    "SMTWTFS".split("").forEach(function (d) { h += '<div class="cal-dow">' + d + "</div>"; });
    for (var i = 0; i < lead; i++) h += '<div class="cal-cell"></div>';
    for (var d = 1; d <= days; d++) {
      var dt = new Date(y, m, d), past = dt < today, cls = "cal-cell";
      if (same(dt, start)) cls += " is-start" + (end ? " has-end" : "");
      else if (same(dt, end)) cls += " is-end";
      else if (start && end && dt > start && dt < end) cls += " in-range";
      h += '<div class="' + cls + '"><button type="button" data-hdate="' + y + "-" + m + "-" + d + '"' + (past ? " disabled" : "") + ">" + d + "</button></div>";
    }
    return h + "</div></div>";
  }
  function renderHeaderCal() {
    if (!cal) return;
    var second = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    cal.innerHTML = '<div class="cal-months">' + monthHTML(view, 0) + monthHTML(second, 1) + "</div>";
    if (start && end) {
      whenLabel.textContent = rangeLabel(start, end);
      checkinInput.value = iso(start);
      checkoutInput.value = iso(end);
    } else {
      whenLabel.textContent = "Anytime";
      checkinInput.value = "";
      checkoutInput.value = "";
    }
  }
  if (cal) {
    cal.addEventListener("click", function (e) {
      var nav = e.target.closest("[data-hnav]");
      if (nav) { view = new Date(view.getFullYear(), view.getMonth() + Number(nav.dataset.hnav), 1); renderHeaderCal(); return; }
      var b = e.target.closest("[data-hdate]"); if (!b || b.disabled) return;
      var p = b.dataset.hdate.split("-"), d = new Date(Number(p[0]), Number(p[1]), Number(p[2]));
      if (!start || (start && end)) { start = d; end = null; }
      else if (d > start) { end = d; }
      else { start = d; end = null; }
      renderHeaderCal();
    });
    var clear = document.getElementById("headerClearDates");
    if (clear) clear.addEventListener("click", function () { start = null; end = null; renderHeaderCal(); });
    renderHeaderCal();
  }

  var header = document.getElementById("siteHeader");
  var mobile = document.getElementById("mobileSearchBtn");
  var backdrop = document.getElementById("sheetBackdrop");
  var sheetClose = document.getElementById("sheetClose");
  function openSheet() {
    if (!header) return;
    header.classList.add("is-search-open");
    if (backdrop) backdrop.hidden = false;
    if (mobile) mobile.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    if (searchInput) searchInput.focus();
  }
  function closeSheet() {
    if (!header || !header.classList.contains("is-search-open")) return;
    header.classList.remove("is-search-open");
    if (backdrop) backdrop.hidden = true;
    if (mobile) mobile.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    closeAll();
  }
  if (mobile) mobile.addEventListener("click", openSheet);
  if (sheetClose) sheetClose.addEventListener("click", closeSheet);
  if (backdrop) backdrop.addEventListener("click", closeSheet);
  window.addEventListener("resize", function () { if (window.innerWidth > 743) closeSheet(); });
})();
