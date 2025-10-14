// --- fungsi tambahan: countdown otomatis untuk TV Server ---
function activateTVServerAt(matchKey, targetTime) {
  const target = new Date(targetTime).getTime();

  // fungsi inti countdown
  function initCountdown() {
    const matchBox = document.getElementById(`match${matchKey}`);
    if (!matchBox) return false;

    const tvSpan = matchBox.querySelector("center span");
    if (!tvSpan) return false;

    // simpan HTML tombol TV server
    const tvHTML = tvSpan.innerHTML;
    tvSpan.innerHTML = `
      <div id="tvCountdown${matchKey}" style="font-size:12px; color:yellow; margin-bottom:5px;"></div>
      <div id="tvButtons${matchKey}" style="display:none;">${tvHTML}</div>
    `;

    const countdownEl = document.getElementById(`tvCountdown${matchKey}`);
    const buttonsEl = document.getElementById(`tvButtons${matchKey}`);

    function updateCountdown() {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        countdownEl.innerHTML = "<span style='color:red;font-weight:bold;'>SERVER AKTIF 🔴</span>";
        buttonsEl.style.display = "inline";
        clearInterval(timer);
        return;
      }

      const h = Math.floor(diff / 1000 / 60 / 60);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      countdownEl.innerHTML = `Server aktif dalam ${h.toString().padStart(2,"0")}:${m
        .toString()
        .padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return true;
  }

  // --- tunggu elemen match muncul di DOM (otomatis retry setiap 500ms) ---
  function waitForMatchBox() {
    if (!initCountdown()) {
      setTimeout(waitForMatchBox, 500);
    }
  }

  waitForMatchBox();
}
