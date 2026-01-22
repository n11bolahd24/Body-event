/* =========================
   LOAD ADSTERRA 1x SAJA
========================= */
(function () {
  if (window.__ADSTERRA_LOADED__) return;
  window.__ADSTERRA_LOADED__ = true;

  const s = document.createElement("script");
  s.async = true;
  s.setAttribute("data-cfasync", "false");
  s.src = "https://furtivelywhipped.com/84e3a92942e7d61e095dc4bd45e4830a/invoke.js";
  document.head.appendChild(s);
})();

/* =========================
   CSS IKLAN
========================= */
(function () {
  if (document.getElementById("css-iklan")) return;
  const c = document.createElement("style");
  c.id = "css-iklan";
  c.innerHTML = `
    .iklan-box {
      width: 97%;
      margin: 15px auto;
      border: 1px dashed #ff4d4d;
      border-radius: 7px;
      background: #0f0f0f;
    }
    .iklan-label {
      font-size: 11px;
      color: #aaa;
      padding: 6px 10px;
    }
  `;
  document.head.appendChild(c);
})();

/* =========================
   FUNCTION IKLAN
========================= */
function iklan(targetId = "kotak1") {
  const adId = "84e3a92942e7d61e095dc4bd45e4830a";
  const target = document.getElementById(targetId);
  if (!target) return;

  // cegah duplikat
  if (document.getElementById("container-" + adId)) return;

  const box = document.createElement("div");
  box.className = "iklan-box";
  box.innerHTML = `
    <div class="iklan-label">Sponsored</div>
    <div id="container-${adId}"></div>
  `;
  target.appendChild(box);
}
