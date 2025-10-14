// --- fungsi tambahan: countdown manual untuk TV Server ---
function activateTVServerAt(matchKey, targetTime) {
  function tryActivate() {
    const matchBox = document.getElementById(`match${matchKey}`);
    if (!matchBox) {
      // tunggu sampai elemen match muncul di DOM
      setTimeout(tryActivate, 300);
      return;
    }

    const tvSpan = matchBox.querySelector("center span");
    if (!tvSpan) return;

    // simpan HTML tombol TV
    const tvHTML = tvSpan.innerHTML;
    tvSpan.innerHTML = `
      <div id="tvCountdown${matchKey}" style="font-size:12px; color:yellow; margin-bottom:5px;"></div>
      <div id="tvButtons${matchKey}" style="display:none;">${tvHTML}</div>
    `;

    const countdownEl = document.getElementById(`tvCountdown${matchKey}`);
    const buttonsEl = document.getElementById(`tvButtons${matchKey}`);
    const target = new Date(targetTime).getTime();

    function updateCountdown() {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        countdownEl.innerHTML = "<span style='color:red;font-weight:bold;'>SERVER AKTIF 🔴</span>";
        buttonsEl.style.display = "inline";
        clearInterval(timer);
        return;
      }

      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      countdownEl.innerHTML = `Server aktif dalam ${h.toString().padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
  }

  tryActivate();
}
