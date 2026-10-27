(function () {
  "use strict";

  var forms = document.querySelectorAll(".needs-validation");
  Array.prototype.slice.call(forms).forEach(function (form) {
    form.addEventListener("submit", function (event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add("was-validated");
    }, false);
  });

  document.querySelectorAll(".char-count").forEach(function (el) {
    var id = el.getAttribute("data-for");
    var max = Number(el.getAttribute("data-max")) || 0;
    var input = document.getElementById(id);
    if (!input) return;
    function upd() { el.textContent = (input.value || "").length + " / " + max; }
    input.addEventListener("input", upd);
    upd();
  });

  document.querySelectorAll("[data-eye]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = document.querySelector(btn.getAttribute("data-eye"));
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      btn.querySelector("i").className = input.type === "password" ? "fa-regular fa-eye" : "fa-regular fa-eye-slash";
    });
  });

  document.querySelectorAll("[data-toast]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (window.showToast) window.showToast(btn.getAttribute("data-toast"));
    });
  });

  var previews = document.getElementById("imgPreviews");
  var images = document.getElementById("images");
  if (previews && images) {
    images.addEventListener("change", function () {
      previews.innerHTML = "";
      Array.prototype.slice.call(images.files).slice(0, 5).forEach(function (file) {
        var url = URL.createObjectURL(file);
        var img = document.createElement("img");
        img.src = url;
        img.alt = "Preview";
        previews.appendChild(img);
      });
    });
  }
})();
