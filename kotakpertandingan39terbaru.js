// --- Tambahkan CSS otomatis agar tampil rapi di Blogger ---
(function injectCSS() {
  const css = `
  .post-body img, .post-body .tr-caption-container {
    padding: 0;
    width:auto;
    max-width:100%;
    height:auto;
  }
  .tv {
    background-image: linear-gradient(to right top, #000000, #000000, #00ccff);
    color: white;
    border: none;
    padding: 5px 6px;
    border-radius: 5px;
    font-size: 10px;
    cursor: pointer;
    margin: 2px;
    white-space: nowrap;
    display: inline-block;
    transition: background-color 0.3s;
  }
  .tv:hover {
    background-image: linear-gradient(to right, #ff0000, #00d0ff);
  }
  .countdown {
    font-weight: bold;
    color: orange;
    -webkit-text-stroke: 0.3px black;
    position: absolute;
    font-size: 13px;
    right: 50%;
    top: 5%;
    transform: translateX(50%);
    background-color: #00000020;
    padding: 4px;
    border-radius: 5px;
  }
  [id^="tvCountdown"] {
    font-size: 12px;
    color: yellow;
    text-align: center;
    margin-top: 5px;
  }
  `;
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);
})();

// --- Fungsi Dummy SofaScore (biarkan diisi fungsi asli kamu nanti) ---
function loadSofaScore(matchId, matchKey) {
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}

// --- Fungsi utama renderMatch (AMAN di Blogger) ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvStartTime = null) {
  const wrapper = document.createElement("div");
  wrapper.className = boxClass;
  wrapper.id = "match" + matchKey;

  wrapper.innerHTML = `
    <div class="countdown" id="countdown${matchKey}"></div>
    <div class="live-container" id="liveContainer${matchKey}" style="text-align:center; height:20px;">
      <span id="liveStatus${matchKey}" style="font-weight:bold;"></span>
    </div>
    <center>
      <font id="teams${matchKey}" style="font-size:15px; font-weight:bold;">NAMA CLUB VS NAMA CLUB</font><br>
      <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:3px 0;"></div>
      <span id="tvContainer${matchKey}" style="font-size: large; display:none;">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();"><b>SERVER ${i+1}</b></a>
        `).join("")}
      </span>
      <div id="tvCountdown${matchKey}"></div>
    </center>
  `;

  // Masukkan ke dalam post-body Blogger, atau body kalau tidak ada
  function safeAppend() {
    const target = document.querySelector(".post-body") || document.body;
    if (!target) return setTimeout(safeAppend, 200);
    target.appendChild(wrapper);
    loadSofaScore(matchId, matchKey);
    if (tvStartTime) setupTVCountdown();
  }
  safeAppend();

  function setupTVCountdown() {
    const targetTime = new Date(tvStartTime).getTime();
    const tvContainer = wrapper.querySelector(`#tvContainer${matchKey}`);
    const countdownEl = wrapper.querySelector(`#tvCountdown${matchKey}`);
    if (!tvContainer || !countdownEl) return;

    function updateCountdown() {
      const now = Date.now();
      const diff = targetTime - now;
      if (diff <= 0) {
        countdownEl.innerHTML = "";
        tvContainer.style.display = "inline";
        clearInterval(timer);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      countdownEl.innerHTML = `Server aktif dalam ${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
  }
}

// --- Fungsi opsional kalau mau pakai aktivasi terpisah ---
function activateTVServerAt(matchKey, targetTime) {
  const box = document.getElementById(`match${matchKey}`);
  if (!box) return setTimeout(() => activateTVServerAt(matchKey, targetTime), 300);

  const tvContainer = box.querySelector(`#tvContainer${matchKey}`);
  const countdownEl = box.querySelector(`#tvCountdown${matchKey}`);
  if (!tvContainer || !countdownEl) return;

  const target = new Date(targetTime).getTime();

  function updateCountdown() {
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) {
      countdownEl.innerHTML = "";
      tvContainer.style.display = "inline";
      clearInterval(timer);
      return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    countdownEl.innerHTML = `Server aktif dalam ${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
  }

  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
}
