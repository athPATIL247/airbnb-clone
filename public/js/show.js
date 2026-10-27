(function () {
  "use strict";
  var root = document.querySelector(".listing-detail");
  if (!root) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var toast = function (m, isError) { (window.showToast || function () {})(m, isError); };

  var PRICE = Number(root.dataset.price) || 0;
  var PLACE = root.dataset.place || "";
  var MAXG = Number(root.dataset.maxGuests) || 3;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAY = 864e5;
  var inr = function (n) { return "\u20B9" + Number(n).toLocaleString("en-IN"); };
  var booked = [];
  try { booked = JSON.parse(root.dataset.booked || "[]"); } catch (e) { booked = []; }

  document.addEventListener("click", function (e) {
    var d = e.target.closest("[data-demo]");
    if (d) { e.preventDefault(); toast(d.getAttribute("data-demo")); }
    var g = e.target.closest("[data-goto]");
    if (g) { var t = $(g.getAttribute("data-goto")); if (t) t.scrollIntoView({ behavior: "smooth", block: "center" }); }
  });

  function share() {
    var url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { toast("Link copied"); }, function () { toast(url); });
    } else toast(url);
  }
  function saveHeart(btn) {
    var id = btn.getAttribute("data-id") || root.dataset.id;
    btn.disabled = true;
    fetch("/wishlist/" + id, { method: "POST", headers: { Accept: "application/json" } })
      .then(function (r) {
        if (r.status === 401) { location.href = "/login"; return null; }
        if (!r.ok) throw new Error("Wishlist request failed");
        return r.json();
      })
      .then(function (data) {
        if (!data) return;
        $$("[data-id='" + id + "'], #saveBtn, #heroSave").forEach(function (el) {
          el.classList.toggle("is-saved", data.saved);
          el.classList.toggle("is-on", data.saved);
          el.setAttribute("aria-pressed", data.saved);
          var icon = el.querySelector("i");
          if (icon) icon.className = data.saved ? "fa-solid fa-heart" : "fa-regular fa-heart";
        });
        toast(data.saved ? "Saved to your wishlist" : "Removed from your wishlist");
      })
      .catch(function () { toast("Couldn't update your wishlist. Please try again.", true); })
      .finally(function () { btn.disabled = false; });
  }
  var shareBtn = $("#shareBtn"); if (shareBtn) shareBtn.addEventListener("click", share);
  var saveBtn = $("#saveBtn"); if (saveBtn) saveBtn.addEventListener("click", function () { saveHeart(saveBtn); });
  var heroShare = $("#heroShare"); if (heroShare) heroShare.addEventListener("click", share);
  var heroSave = $("#heroSave"); if (heroSave) heroSave.addEventListener("click", function () { saveHeart(heroSave); });
  var heroBack = $("#heroBack");
  if (heroBack) heroBack.addEventListener("click", function () {
    location.href = "/";
  });

  function checkClamp(btn) {
    var sel = btn.getAttribute("data-more");
    if (!sel) {
      var target = btn.previousElementSibling;
      if (target && target.classList.contains("clamp") && target.scrollHeight > target.clientHeight + 1) btn.classList.add("show");
      return;
    }
    var el = sel === "prev" ? btn.previousElementSibling : $(sel);
    var cls = btn.getAttribute("data-class");
    if (!el || el.offsetParent === null) return;
    if (el.classList.contains(cls) && el.scrollHeight > el.clientHeight + 1) btn.classList.add("show");
  }
  $$(".more-btn[data-more]").forEach(function (btn) {
    var sel = btn.getAttribute("data-more");
    var el = sel === "prev" ? btn.previousElementSibling : $(sel);
    var cls = btn.getAttribute("data-class");
    btn.addEventListener("click", function () {
      if (!el) return;
      var open = el.classList.toggle(cls);
      btn.firstChild.textContent = (open ? "Show more" : "Show less") + " ";
    });
    checkClamp(btn);
  });
  var descBtn = $("#desc") && $("#desc").nextElementSibling;
  if (descBtn && descBtn.classList.contains("more-btn")) checkClamp(descBtn);
  window.addEventListener("load", function () { $$(".more-btn[data-more]").forEach(checkClamp); if (descBtn) checkClamp(descBtn); });

  var tabbar = $("#tabbar"), grid = $("#photos");
  var spyIds = ["photos", "amenities", "reviews", "location"];
  var tabs = $$(".tabs a");
  function setActive(id) { tabs.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("data-spy") === id); }); }
  if (grid && tabbar && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      var gone = !entries[0].isIntersecting && entries[0].boundingClientRect.bottom < 0;
      tabbar.classList.toggle("is-on", gone);
      tabbar.setAttribute("aria-hidden", gone ? "false" : "true");
    }, { threshold: 0 }).observe(grid);
  }
  var ticking = false;
  function spy() {
    ticking = false;
    var cur = "photos";
    spyIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 140) cur = id;
    });
    if (grid && grid.getBoundingClientRect().bottom > 0) cur = "photos";
    setActive(cur);
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  tabs.forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (a.getAttribute("data-spy") === "photos") { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    });
  });

  var gBox = $("#guestBox"), gBtn = $("#guestBtn"), gPop = $("#guestPop"), gLabel = $("#guestLabel"), bookCard = $("#bookCard");
  var steps = $$(".g-step[data-g]");
  function val(k) { var s = steps.filter(function (x) { return x.dataset.g === k; })[0]; return s ? Number(s.dataset.val) : 0; }
  function renderGuests() {
    var adults = steps.filter(function (x) { return x.dataset.g === "adults"; })[0];
    var children = steps.filter(function (x) { return x.dataset.g === "children"; })[0];
    adults.dataset.val = Math.max(1, Math.min(MAXG, Number(adults.dataset.val) || 1));
    children.dataset.val = Math.max(0, Math.min(MAXG - Number(adults.dataset.val), Number(children.dataset.val) || 0));
    var guests = val("adults") + val("children");
    var txt = guests + (guests === 1 ? " guest" : " guests");
    if (val("infants")) txt += ", " + val("infants") + (val("infants") === 1 ? " infant" : " infants");
    if (val("pets")) txt += ", " + val("pets") + (val("pets") === 1 ? " pet" : " pets");
    if (gLabel) gLabel.textContent = txt;
    steps.forEach(function (s) {
      var k = s.dataset.g, v = Number(s.dataset.val), min = Number(s.dataset.min);
      var source = steps.filter(function (x) { return x.dataset.g === k; })[0];
      if (s !== source) { s.dataset.val = source.dataset.val; v = Number(s.dataset.val); }
      var max = s.dataset.max ? Number(s.dataset.max) : MAXG;
      s.querySelector("span").textContent = v;
      s.children[0].disabled = v <= min;
      s.children[2].disabled = (k === "adults" || k === "children") ? guests >= MAXG : v >= max;
    });
    var mobileLabel = $("#mobileGuestLabel");
    if (mobileLabel) mobileLabel.textContent = txt;
  }
  function toggleGuests(open) {
    if (!gPop) return;
    gPop.classList.toggle("open", open);
    gBox.classList.toggle("open", open);
    if (bookCard) bookCard.classList.toggle("is-guests-open", open);
    gBtn.setAttribute("aria-expanded", open);
  }
  if (gBtn) {
    gBtn.addEventListener("click", function () { toggleGuests(!gPop.classList.contains("open")); });
    $("#guestClose").addEventListener("click", function () { toggleGuests(false); });
    gPop.addEventListener("click", stepGuests);
    document.addEventListener("click", function (e) { if (!e.target.closest(".book-fields")) toggleGuests(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") toggleGuests(false); });
    renderGuests();
  }
  function stepGuests(e) {
    var b = e.target.closest("button[data-d]"); if (!b || b.disabled) return;
    var s = b.parentNode, group = steps.filter(function (x) { return x.dataset.g === s.dataset.g; });
    var next = Number(group[0].dataset.val) + Number(b.dataset.d);
    group.forEach(function (x) { x.dataset.val = next; });
    renderGuests();
  }
  var mobileGuestBtn = $("#mobileGuestBtn"), mobileGuestPop = $("#mobileGuestPop");
  if (mobileGuestBtn && mobileGuestPop) {
    mobileGuestBtn.addEventListener("click", function () {
      var open = mobileGuestPop.hidden;
      mobileGuestPop.hidden = !open;
      mobileGuestBtn.setAttribute("aria-expanded", open);
    });
    mobileGuestPop.addEventListener("click", stepGuests);
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".mobile-guests")) {
        mobileGuestPop.hidden = true;
        mobileGuestBtn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        mobileGuestPop.hidden = true;
        mobileGuestBtn.setAttribute("aria-expanded", "false");
      }
    });
    renderGuests();
  }

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var addDays = function (d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
  var same = function (a, b) { return a && b && a.getTime() === b.getTime(); };
  var us = function (d) { return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear(); };
  var shortLong = function (d) { return d.getDate() + " " + MONTHS[d.getMonth()].slice(0, 3) + " " + d.getFullYear(); };
  var iso = function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

  var start = addDays(today, 7), end = addDays(start, 5);
  var view = new Date(start.getFullYear(), start.getMonth(), 1);
  var cal = $("#cal");

  function blocked(dt) {
    return booked.some(function (b) {
      var a = new Date(b.in), c = new Date(b.out);
      return dt >= a && dt < c;
    });
  }
  function rangeBlocked(from, to) {
    return booked.some(function (b) {
      var a = new Date(b.in), c = new Date(b.out);
      return a < to && c > from;
    });
  }
  function setAll(role, text) { $$('[data-role="' + role + '"]').forEach(function (el) { el.textContent = text; }); }
  function updateSummary() {
    var nights = (start && end) ? Math.round((end - start) / DAY) : 0;
    if (nights > 0) {
      setAll("amt", inr(PRICE * nights));
      setAll("per", "for " + nights + (nights === 1 ? " night" : " nights"));
      $("#calTitle").textContent = nights + (nights === 1 ? " night" : " nights") + " in " + PLACE;
      $("#calSub").textContent = shortLong(start) + " - " + shortLong(end);
      setAll("range", shortLong(start) + " - " + shortLong(end));
    } else {
      setAll("amt", inr(PRICE));
      setAll("per", "night");
      $("#calTitle").textContent = start ? "Select checkout date" : "Select check-in date";
      $("#calSub").textContent = "Add your travel dates for exact pricing";
      setAll("range", "Add dates");
    }
    $$('[data-role="in"]').forEach(function (el) { el.textContent = start ? us(start) : "Add date"; el.classList.toggle("is-empty", !start); });
    $$('[data-role="out"]').forEach(function (el) { el.textContent = end ? us(end) : "Add date"; el.classList.toggle("is-empty", !end); });
    var fc = $("#freeCancel");
    if (start) { var c = addDays(start, -1); setAll("cancel", c.getDate() + " " + MONTHS[c.getMonth()]); fc.style.display = ""; }
    else fc.style.display = "none";
  }
  function monthHTML(first, idx) {
    var y = first.getFullYear(), m = first.getMonth();
    var lead = first.getDay(), days = new Date(y, m + 1, 0).getDate();
    var canPrev = idx === 0 && (y > today.getFullYear() || m > today.getMonth());
    var h = '<div class="cal-month"><div class="cal-head">';
    if (idx === 0) h += '<button type="button" class="cal-nav prev" data-nav="-1" aria-label="Previous month"' + (canPrev ? "" : " disabled") + '><i class="fa-solid fa-chevron-left"></i></button>';
    h += MONTHS[m] + " " + y;
    if (idx === 1) h += '<button type="button" class="cal-nav next" data-nav="1" aria-label="Next month"><i class="fa-solid fa-chevron-right"></i></button>';
    h += '</div><div class="cal-grid">';
    "SMTWTFS".split("").forEach(function (d) { h += '<div class="cal-dow">' + d + "</div>"; });
    for (var i = 0; i < lead; i++) h += '<div class="cal-cell"></div>';
    for (var d = 1; d <= days; d++) {
      var dt = new Date(y, m, d), past = dt < today || blocked(dt), cls = "cal-cell";
      if (same(dt, start)) cls += " is-start" + (end ? " has-end" : "");
      else if (same(dt, end)) cls += " is-end";
      else if (start && end && dt > start && dt < end) cls += " in-range";
      h += '<div class="' + cls + '"><button type="button" data-date="' + y + "-" + m + "-" + d + '"' + (past ? " disabled" : "") +
        ' aria-label="' + d + " " + MONTHS[m] + " " + y + '">' + d + "</button></div>";
    }
    return h + "</div></div>";
  }
  function renderCal() {
    var second = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    cal.innerHTML = '<div class="cal-months">' + monthHTML(view, 0) + monthHTML(second, 1) + "</div>";
  }
  function refresh() { updateSummary(); renderCal(); }
  if (cal) {
    cal.addEventListener("click", function (e) {
      var nav = e.target.closest("[data-nav]");
      if (nav) { view = new Date(view.getFullYear(), view.getMonth() + Number(nav.dataset.nav), 1); renderCal(); return; }
      var b = e.target.closest("[data-date]"); if (!b || b.disabled) return;
      var p = b.dataset.date.split("-"), d = new Date(Number(p[0]), Number(p[1]), Number(p[2]));
      if (!start || (start && end)) { start = d; end = null; }
      else if (d > start) {
        if (rangeBlocked(start, d)) { toast("Those dates include unavailable nights", true); return; }
        end = d;
      }
      else { start = d; end = null; }
      refresh();
    });
    $("#clearDates").addEventListener("click", function () { start = null; end = null; refresh(); });
    refresh();
  }

  var chips = $$("#topicChips .chip");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var on = chip.classList.toggle("is-on");
      chip.setAttribute("aria-pressed", on);
      var active = chips.filter(function (c) { return c.classList.contains("is-on"); }).map(function (c) { return c.dataset.chip; });
      $$("#revGrid .rev").forEach(function (rev) {
        if (!active.length) { rev.style.display = ""; return; }
        var topics = (rev.getAttribute("data-topics") || "").split(" ");
        rev.style.display = active.every(function (a) { return topics.indexOf(a) >= 0; }) ? "" : "none";
      });
    });
  });

  var sort = $("#revSort"), list = $("#revModalList");
  if (sort && list) {
    sort.addEventListener("change", function () {
      var items = $$("#revModalList .rev");
      items.sort(function (a, b) {
        if (sort.value === "high") return Number(b.dataset.rating) - Number(a.dataset.rating);
        if (sort.value === "low") return Number(a.dataset.rating) - Number(b.dataset.rating);
        return Number(b.dataset.date) - Number(a.dataset.date);
      });
      items.forEach(function (el) { list.appendChild(el); });
    });
  }

  var track = $("#nearTrack"), page = 0;
  function pageSize() { return window.innerWidth < 744 ? 1 : window.innerWidth < 1128 ? 3 : 5; }
  function updateNear() {
    if (!track) return;
    var cards = track.children.length;
    var ps = pageSize();
    var pages = Math.max(1, Math.ceil(cards / ps));
    if (page >= pages) page = pages - 1;
    var w = track.parentElement.clientWidth;
    track.style.transform = "translateX(" + (-page * w) + "px)";
    var lab = $("#nearPageLabel"); if (lab) lab.textContent = (page + 1) + " / " + pages;
  }
  if (track) {
    $("#nearPrev").addEventListener("click", function () { page = Math.max(0, page - 1); updateNear(); });
    $("#nearNext").addEventListener("click", function () { page += 1; updateNear(); });
    window.addEventListener("resize", updateNear);
    updateNear();
  }

  var viewerIdx = 0;
  var imgs = $$("#pvBody img");
  function showPv(i) {
    if (!imgs.length) return;
    viewerIdx = (i + imgs.length) % imgs.length;
    imgs.forEach(function (im, n) { im.classList.toggle("is-on", n === viewerIdx); });
    var c = $("#pvCounter"); if (c) c.textContent = (viewerIdx + 1) + " / " + imgs.length;
  }
  document.addEventListener("click", function (e) {
    var open = e.target.closest("[data-open-viewer]");
    if (!open) return;
    viewerIdx = Number(open.getAttribute("data-open-viewer")) || 0;
    var modal = bootstrap.Modal.getOrCreateInstance($("#photosModal"));
    modal.show();
    showPv(viewerIdx);
  });
  document.addEventListener("keydown", function (e) {
    if (!$("#photosModal") || !$("#photosModal").classList.contains("show")) return;
    if (e.key === "ArrowRight") showPv(viewerIdx + 1);
    if (e.key === "ArrowLeft") showPv(viewerIdx - 1);
  });
  var pvShare = $("#pvShare"); if (pvShare) pvShare.addEventListener("click", share);
  var pvSave = $("#pvSave"); if (pvSave) pvSave.addEventListener("click", function () { if (saveBtn) saveHeart(saveBtn); });

  var reviewForm = $("#reviewForm");
  if (reviewForm) {
    reviewForm.addEventListener("submit", function (e) {
      var checked = reviewForm.querySelector('input[name="review[rating]"]:checked:not(:disabled)');
      var msg = $("#ratingMsg");
      if (!checked || !checked.value) {
        e.preventDefault();
        if (msg) msg.hidden = false;
      } else if (msg) msg.hidden = true;
    });
  }

  $$("[data-open-book]").forEach(function (b) {
    b.addEventListener("click", function () {
      var nights = (start && end) ? Math.round((end - start) / DAY) : 0;
      if (nights <= 0) { toast("Choose check-in and checkout dates first", true); return; }
      var gst = Math.round(PRICE * nights * 0.18);
      var total = PRICE * nights + gst;
      $("#bookBreakdown").textContent = inr(PRICE) + " × " + nights + " nights + 18% GST (" + inr(gst) + ") = " + inr(total);
      $("#bookIn").value = iso(start);
      $("#bookOut").value = iso(end);
      $("#bookGuests").value = val("adults") + val("children");
      bootstrap.Modal.getOrCreateInstance($("#bookModal")).show();
    });
  });
})();
