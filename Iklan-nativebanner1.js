/* ===== CSS IKLAN ===== */
(function () {
  if (document.getElementById("css-iklan")) return;
  const s = document.createElement("style");
  s.id = "css-iklan";
  s.innerHTML = `
    .iklan-box {
      width: 97%;
      margin: 15px auto;
      border: 1px dashed #ff4d4d;
      border-radius: 7px;
      background: #0f0f0f;
    }
    .iklan-head {
      padding: 6px 10px;
      font-size: 11px;
      color: #aaa;
      display: flex;
      justify-content: space-between;
    }
    .iklan-body {
      padding: 6px;
    }
  `;
  document.head.appendChild(s);
})();

/* ===== FUNCTION IKLAN ===== */
function iklan(targetId = "kotak1") {
  const target = document.getElementById(targetId);
  if (!target) return;

  const adId = "84e3a92942e7d61e095dc4bd45e4830a";

  const box = document.createElement("div");
  box.className = "iklan-box";

  // HTML iklan (TETAP PERSIS)
  box.innerHTML = `
    <div class="iklan-head">
      <span>Sponsored</span>
      <span>Ad</span>
    </div>
    <div class="iklan-body">
      <div id="container-${adId}"></div>
    </div>
  `;

  target.appendChild(box);

  // 🔥 INI KUNCI SUPAYA IKLAN MUNCUL
  const script = document.createElement("script");
  script.async = true;
  script.setAttribute("data-cfasync", "false");
  script.src = `https://furtivelywhipped.com/${adId}/invoke.js`;

  box.querySelector(".iklan-body").appendChild(script);
}
