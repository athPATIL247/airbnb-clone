(function () {
  var tax = document.getElementById("taxSwitch");
  if (tax) tax.addEventListener("change", function () { document.body.classList.toggle("show-tax", tax.checked); });

  var sticky = document.getElementById("homeSticky");
  if (sticky) {
    window.addEventListener("scroll", function () {
      sticky.classList.toggle("is-scrolled", window.scrollY > 10);
    }, { passive: true });
  }

  var strip = document.getElementById("catStrip"), prev = document.getElementById("catPrev"), next = document.getElementById("catNext");
  if (strip && prev && next) {
    function arrows() {
      prev.classList.toggle("show", strip.scrollLeft > 4);
      next.classList.toggle("show", strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 4);
    }
    prev.addEventListener("click", function () { strip.scrollBy({ left: -300, behavior: "smooth" }); });
    next.addEventListener("click", function () { strip.scrollBy({ left: 300, behavior: "smooth" }); });
    strip.addEventListener("scroll", arrows, { passive: true });
    window.addEventListener("resize", arrows);
    arrows();
  }

  function toggleHeart(btn) {
    var id = btn.getAttribute("data-id");
    fetch("/wishlist/" + id, { method: "POST", headers: { Accept: "application/json" } })
      .then(function (r) {
        if (r.status === 401) { location.href = "/login"; return null; }
        return r.json();
      })
      .then(function (data) {
        if (!data) return;
        btn.classList.toggle("is-on", data.saved);
        btn.setAttribute("aria-pressed", data.saved);
        var icon = btn.querySelector("i");
        if (icon) icon.className = data.saved ? "fa-solid fa-heart" : "fa-regular fa-heart";
      })
      .catch(function () {});
  }

  document.addEventListener("click", function (e) {
    var h = e.target.closest(".l-card__heart");
    if (h) { e.preventDefault(); e.stopPropagation(); toggleHeart(h); return; }
    var nav = e.target.closest(".img-nav");
    if (!nav) return;
    e.preventDefault(); e.stopPropagation();
    var card = nav.closest(".l-card");
    var photos = (card.getAttribute("data-photos") || "").split("|").filter(Boolean);
    if (photos.length < 2) return;
    var img = card.querySelector(".l-card__img img");
    var i = photos.indexOf(img.getAttribute("src"));
    if (i < 0) i = 0;
    i = nav.classList.contains("next") ? (i + 1) % photos.length : (i - 1 + photos.length) % photos.length;
    img.setAttribute("src", photos[i]);
    var dots = card.querySelectorAll(".img-dots i");
    dots.forEach(function (d, di) { d.classList.toggle("on", di === i); });
  });

  var form = document.getElementById("filtersForm");
  var btn = document.getElementById("showPlacesBtn");
  function liveCount() {
    if (!form || !btn) return;
    var q = new URLSearchParams(new FormData(form)).toString();
    fetch("/listings/count?" + q).then(function (r) { return r.json(); }).then(function (d) {
      btn.textContent = "Show " + d.count + " places";
    }).catch(function () {});
  }
  if (form) form.addEventListener("input", liveCount);

  var mapBtn = document.getElementById("showMapBtn");
  var split = document.getElementById("mapSplit");
  var listingGrid = document.querySelector(".listing-grid");
  var gridHome = listingGrid && listingGrid.parentElement;
  var gridNext = listingGrid && listingGrid.nextElementSibling;
  var splitList = split && split.querySelector(".map-split__list");
  var mapShown = false;
  var map;
  if (mapBtn && split) {
    mapBtn.addEventListener("click", function () {
      var on = split.hasAttribute("hidden");
      if (on) {
        if (listingGrid && splitList) splitList.appendChild(listingGrid);
        split.removeAttribute("hidden");
        document.body.classList.add("home-map-open");
      } else {
        if (listingGrid && gridHome) gridHome.insertBefore(listingGrid, gridNext);
        split.setAttribute("hidden", "");
        document.body.classList.remove("home-map-open");
      }
      mapBtn.setAttribute("aria-expanded", on);
      mapBtn.innerHTML = on ? '<i class="fa-solid fa-list"></i> Show list' : '<i class="fa-solid fa-map"></i> Show map';
      if (on && !mapShown) {
        var indexMap = document.getElementById("indexMap");
        var mapStatus = document.getElementById("indexMapStatus");
        if (typeof mapboxgl === "undefined" || !window.__MAP_TOKEN__) {
          if (mapStatus) {
            mapStatus.textContent = "The map is unavailable right now. Listings are still available in list view.";
            mapStatus.hidden = false;
          }
          mapShown = true;
          return;
        }

        mapShown = true;
        mapboxgl.accessToken = window.__MAP_TOKEN__;
        map = new mapboxgl.Map({
          container: "indexMap",
          style: "mapbox://styles/mapbox/light-v11",
          center: [0, 20],
          zoom: 1.5,
          projection: { name: "mercator" },
          attributionControl: false,
          transformRequest: function (url) {
            return { url: url.replace(/^http:\/\//i, "https://") };
          }
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

        var bounds = new mapboxgl.LngLatBounds();
        var markerCount = 0;
        var mapLoadTimer = setTimeout(function () {
          if (mapStatus && !mapStatus.hidden) {
            mapStatus.textContent = "The map is taking too long to load. Switch to list view to keep browsing.";
          }
        }, 10000);
        (window.__LISTING_MARKERS__ || []).forEach(function (listing) {
          var coords = listing.coords;
          if (!Array.isArray(coords) || coords.length < 2 || !Number.isFinite(Number(coords[0])) || !Number.isFinite(Number(coords[1]))) return;
          var longitude = Number(coords[0]), latitude = Number(coords[1]);
          if (Math.abs(longitude) > 180 || Math.abs(latitude) > 90) return;

          var marker = document.createElement("a");
          marker.href = "/listings/" + listing.id;
          marker.className = "price-marker";
          marker.textContent = "₹" + Number(listing.price).toLocaleString("en-IN");
          marker.setAttribute("aria-label", listing.title + ", ₹" + Number(listing.price).toLocaleString("en-IN") + " per night");
          marker.title = listing.title;
          new mapboxgl.Marker({ element: marker, anchor: "bottom" }).setLngLat([longitude, latitude]).addTo(map);
          bounds.extend([longitude, latitude]);
          markerCount += 1;
        });

        var styleLoaded = false;
        map.once("load", function () {
          styleLoaded = true;
          clearTimeout(mapLoadTimer);
          map.resize();
          if (mapStatus) mapStatus.hidden = true;
          if (markerCount > 1) map.fitBounds(bounds, { padding: 72, maxZoom: 8, duration: 500 });
          else if (markerCount === 1) map.setZoom(11);
        });
        map.on("idle", function () {
          clearTimeout(mapLoadTimer);
          if (mapStatus) mapStatus.hidden = true;
        });
        var errorTimer;
        map.on("error", function () {
          if (!mapStatus) return;
          clearTimeout(errorTimer);
          errorTimer = setTimeout(function () {
            mapStatus.textContent = "Map details could not be loaded. Switch to list view to keep browsing.";
            mapStatus.hidden = false;
          }, styleLoaded ? 500 : 2000);
        });
      }
      if (on && map) requestAnimationFrame(function () { map.resize(); });
    });
  }
})();
