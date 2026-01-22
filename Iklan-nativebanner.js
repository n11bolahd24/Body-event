/* =========================
   CSS IKLAN (TERPISAH)
========================= */
(function () {
  if (document.getElementById("css-iklan-native")) return;

  const style = document.createElement("style");
  style.id = "css-iklan-native";
  style.innerHTML = `
    .iklan-box {
      width: 97%;
      margin: 14px auto;
      border: 1px dashed #ff4d4d;
      border-radius: 7px;
      background: rgba(12,12,12,.9);
      overflow: hidden;
    }
    .iklan-head {
      display: flex;
      justify-content: space-between;
      padding: 6px 10px;
      font-size: 11px;
      color: #fff;
      opacity: .7;
    }
    .iklan-body {
      padding: 6px;
    }
  `;
  document.head.appendChild(style);
})();

/* =========================
   FUNCTION PANGGIL IKLAN
========================= */
function iklan(targetId = "kotak1") {
  const target = document.getElementById(targetId);
  if (!target) return;

  const box = document.createElement("div");
  box.className = "iklan-box";

  // ⚠️ KODE IKLAN TETAP PERSIS
  box.innerHTML = `
    <div class="iklan-head">
      <span>Sponsored</span>
      <span>Ad</span>
    </div>
    <div class="iklan-body">
      <script async="async" data-cfasync="false"
        src="https://furtivelywhipped.com/84e3a92942e7d61e095dc4bd45e4830a/invoke.js">
      </script>
      <div id="container-84e3a92942e7d61e095dc4bd45e4830a"></div>
    </div>
  `;

  target.appendChild(box);
}
