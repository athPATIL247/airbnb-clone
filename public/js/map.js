(function () {
  const status = document.getElementById("mapStatus");
  const statusText = document.getElementById("mapStatusText");
  const fallback = document.getElementById("mapFallbackLink");
  const recenter = document.getElementById("mapRecenter");

  function showStatus(message, coordinates) {
    if (!status || !statusText) return;
    statusText.textContent = message;
    if (coordinates && fallback) {
      fallback.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(coordinates[1] + "," + coordinates[0]);
      fallback.hidden = false;
    }
    status.classList.add("is-visible");
  }

  const coordinates = typeof listing !== "undefined" && listing.geometry && listing.geometry.coordinates;
  const validCoordinates = Array.isArray(coordinates) && coordinates.length >= 2 &&
    Number.isFinite(Number(coordinates[0])) && Number.isFinite(Number(coordinates[1])) &&
    Math.abs(Number(coordinates[0])) <= 180 && Math.abs(Number(coordinates[1])) <= 90;

  if (!validCoordinates) {
    showStatus("Map location is not available for this listing.");
    return;
  }
  if (typeof mapToken === "undefined" || !mapToken) {
    showStatus("The interactive map is unavailable because its access token is missing.", coordinates);
    return;
  }
  if (typeof mapboxgl === "undefined") {
    showStatus("The interactive map could not be loaded. You can still open this location in Google Maps.", coordinates);
    return;
  }

  mapboxgl.accessToken = mapToken;

  let map;
  try {
    map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/light-v11",
      center: coordinates,
      zoom: 13,
      cooperativeGestures: true,
      transformRequest: function (url) {
        return { url: url.replace(/^http:\/\//i, "https://") };
      }
    });
  } catch (error) {
    showStatus("The interactive map could not be initialized. You can still open this location in Google Maps.", coordinates);
    return;
  }

  map.on("load", function () {
    if (status) status.classList.remove("is-visible");
  });
  map.on("error", function (event) {
    showStatus("The interactive map could not load fully. You can still open this location in Google Maps.", coordinates);
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

  const pin = document.createElement("div");
  pin.className = "map-pin";
  pin.innerHTML = '<i class="fa-solid fa-house" aria-hidden="true"></i>';

  const popupBox = document.createElement("div");
  const popupTitle = document.createElement("h6");
  popupTitle.style.cssText = "margin:0 0 4px;font-weight:600";
  popupTitle.textContent = listing.location || "Approximate listing location";
  const popupText = document.createElement("p");
  popupText.style.cssText = "margin:0;font-size:13px;color:#717171";
  popupText.textContent = "Exact location will be provided after booking";
  popupBox.append(popupTitle, popupText);
  const popup = new mapboxgl.Popup({ offset: 36 }).setDOMContent(popupBox);

  new mapboxgl.Marker({ element: pin })
    .setLngLat(coordinates)
    .setPopup(popup)
    .addTo(map);

  if (recenter) {
    recenter.addEventListener("click", function () {
      map.flyTo({ center: coordinates, zoom: 13, essential: true });
    });
  }
})();
