// CountdownTV.js — Versi stabil untuk Blogger & CDN
(function() {
  // --- Inject CSS ---
  const css = `
  .tv {
    background-image: linear-gradient(to right top, #000000, #000000, #00ccff);
    color: white;
    border: none;
    padding: 5px 6px;
    border-radius: 5px;
    font-size: 10px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin: 3px;
    white-space: nowrap;
    display: inline-block;
  }
  .tv:hover {
    background-image: linear-gradient(to right, #ff0000, #00d0ff);
  }
  .countdown {
    font-weight: bold;
    color: orange;
    text-align: center;
    font-size: 13px;
    margin-top: 5px;
  }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // --- Dummy load SofaScore (isi sesuai versi aslimu jika perlu) ---
  window.loadSofaScore = window.loadSofaScore || function(matchId, matchKey) {
    console.log("Load SofaScore untuk match:", matchId, matchKey);
  };

  // --- Fungsi utama renderMatch ---
  window.renderMatch = function(matchId, matchKey, serverFuncs, boxClass = "kotak", tvStartTime = null) {
    const container = document.createElement("div");
    container.className = boxClass;
    container.id = `match${matchKey}`;

    container.innerHTML = `
      <div id="teams${matchKey}" style="font-size:14px;font-weight:bold;text-align:center;color:white;">
        NAMA CLUB VS NAMA CLUB
      </div>
      <div id="tvContainer${matchKey}" style="margin-top:8px;text-align:center;">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();" id="tvBtn${matchKey}_${i}">SERVER ${i + 1}</a>
        `).join("")}
      </div>
      <div class="countdown" id="tvCountdown${matchKey}"></div>
    `;

    document.body.appendChild(container);
    loadSofaScore(matchId, matchKey);

    if (tvStartTime) setupCountdown(matchKey, tvStartTime);
  };

  // --- Fungsi countdown ---
  function setupCountdown(matchKey, tvStartTime) {
    const target = new Date(tvStartTime).getTime();

    function updateCountdown() {
      const now = Date.now();
      const diff = target - now;
      const container = document.getElementById(`tvContainer${matchKey}`);
      const countdownEl = document.getElementById(`tvCountdown${matchKey}`);
      if (!container || !countdownEl) return;

      if (diff <= 0) {
        countdownEl.textContent = "";
        container.querySelectorAll('.tv').forEach(btn => btn.style.display = "inline-block");
        clearInterval(timer);
        return;
      }

      container.querySelectorAll('.tv').forEach(btn => btn.style.display = "none");

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      countdownEl.textContent = `Server aktif dalam ${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
  }
})();
