// --- CSS bawaan Blogger (otomatis disuntik lewat JS) ---
(function injectCSS() {
  const css = `
  .post-body img, .post-body .tr-caption-container {
    padding: 0;
    width:auto;
    max-width:100%;
    height:auto;
  }
  .tomboltv {
    background: #fff;
    border: 1px solid #d0cbcb;
    border-radius: .5em;
    color: #ff0000;
    display: inline-block;
    font: bold 17px Arial, sans-serif;
    margin: 0px;
    min-width:50px;
    padding: 2px 1px;
    text-align: center;
    text-decoration: none;
  }
  .tomboltv:hover {
    border-color: #fff;
    box-shadow: 0 1px 3px rgba(215, 56, 56, 0.6);
    color: #066496;
  }
  .tomboltvmob { display: none; }

  .club1 {
    display: block;
    margin: 5px 0;
    text-align: center;
    font-size: 15px;
    color: white;
  }

  .tv1 {
    display: flex;
    justify-content: center;
    gap: 1px;
    margin-top: 10px;
  }

  .tv {
    background-image: linear-gradient(to right top, #000000, #000000, #00ccff);
    color: white;
    border: none;
    padding: 5px 6px;
    border-radius: 5px;
    font-size: 10px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin-left: 3px;
    margin-bottom: 2px;
    white-space: nowrap;
    display: inline-block;
  }

  .tv:hover {
    background-image: linear-gradient(to right, #ff0000, #00d0ff);
    color: white;
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

// --- fungsi load SofaScore (placeholder) ---
function loadSofaScore(matchId, matchKey) {
  // fungsi asli SofaScore bisa ditaruh di sini
}

// --- fungsi utama renderMatch ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvStartTime = null) {
  const html = `
  <div class="${boxClass}" id="match${matchKey}">
    <div class="club1">
      <strong id="formattedTime${matchKey}" style="color: red;"></strong>
    </div>
    <center>
      <span style="font-size: large; display:none;" id="tvContainer${matchKey}">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();" style="display:inline-block;">
            <b><span>SERVER ${i+1}</span></b>
          </a>
        `).join(" ")}
      </span>
      <div id="tvCountdown${matchKey}"></div>
    </center>
  </div>
  <script>loadSofaScore(${matchId}, "${matchKey}");<\/script>
  `;
  document.write(html);

  if (tvStartTime) setupTVCountdown(matchKey, tvStartTime);
}

// --- fungsi countdown TV Server ---
function setupTVCountdown(matchKey, tvStartTime) {
  const target = new Date(tvStartTime).getTime();

  function waitForElements() {
    const container = document.getElementById(`tvContainer${matchKey}`);
    const countdownEl = document.getElementById(`tvCountdown${matchKey}`);
    if (!container || !countdownEl) return setTimeout(waitForElements, 300);
    startCountdown(container, countdownEl);
  }

  function startCountdown(container, countdownEl) {
    container.style.display = "none";

    function updateCountdown() {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        countdownEl.innerHTML = "";
        container.style.display = "inline";
        clearInterval(timer);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      countdownEl.innerHTML =
        `Server aktif dalam ${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
  }

  waitForElements();
}
