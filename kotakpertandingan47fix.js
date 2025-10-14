// --- isi asli Matchxsofascore13.js ---
// (biarkan semua fungsi loadSofaScore dan utility-nya tetap ada di sini)

function loadSofaScore(matchId, matchKey) {
  // ... isi asli dari script Anda ...
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}

// --- fungsi tambahan untuk generate box ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", kickoffTime = "2025-10-14T18:00:00+07:00") {
  const html = `
    <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox">

      <!-- Countdown SofaScore (tetap seperti semula) -->
      <div class="countdown" id="countdown${matchKey}" style="color:white; font-weight:bold;"></div>

      <div class="live-container" id="liveContainer${matchKey}" style="text-align:center; height:20px;">
        <span id="liveStatus${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
      </div>

      <div class="club1" style="position: relative; z-index: 1;">
        <br/>
        <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
          <br/><br/>
          <strong id="formattedTime${matchKey}" style="color: red;"></strong>
        </div>
      </div>

      <div class="club">
        <center>
          <span id="league${matchKey}" style="position:relative; top:5px; left:-11px; font-weight:bold; font-size:12px; color:white;">NAMA LIGA</span>
          <div id="liveScore${matchKey}" style="position:relative; top:0px; left:0px;font-size:20px; font-family:'Arial', sans-serif; font-weight:bold; color:orange; text-align:center;"></div>  
          <div id="matchStatus${matchKey}" style="font-family:'Courier New', monospace; font-size:10px; font-weight:bold; color:orange; text-align:center; margin:-1px 1px;"></div>   
          <font id="teams${matchKey}" style="font-size:15px; font-weight:bold">NAMA CLUB VS NAMA CLUB</font><br>
          <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;"></div>
        </center>
      </div>

      <img id="logoHome${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; left:10%; border-radius:5px;">
      <img id="logoAway${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; right:10%; border-radius:5px;">

      <!-- Countdown & link server (countdown sendiri) -->
      <center>
        <div id="countdownServer${matchKey}" style="color:yellow; font-weight:bold; margin-top:5px;"></div>
        <span id="serverLinks${matchKey}" style="font-size: large; display:none;">
          ${serverFuncs.map((fn, i) => `
            <a class="tv" href="javascript:${fn}();"><b><span>SERVER ${i+1}</span></b></a>
          `).join(" ")}
        </span>
      </center><br>
    </div>
  `;

  // Sisipkan ke dalam container
  const container = document.getElementById("matches");
  if (container) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    while (wrapper.firstChild) {
      container.appendChild(wrapper.firstChild);
    }
  }

  // Jalankan SofaScore setelah elemen ditambahkan
  loadSofaScore(matchId, matchKey);

  // Jalankan countdown server secara dinamis
  const kickoff = new Date(kickoffTime).getTime();
  const serverEl = document.getElementById(`serverLinks${matchKey}`);
  const countdownServerEl = document.getElementById(`countdownServer${matchKey}`);

  function updateServerCountdown() {
  const now = Date.now();
  const diff = kickoff - now;

  // Deteksi bahasa browser
  const userLang = navigator.language || navigator.userLanguage;
  const isIndonesian = userLang.toLowerCase().startsWith("id");

  if (diff > 0) {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let timeStr = "";
    if (days > 0) timeStr += days + "d ";
    if (hours > 0 || days > 0) timeStr += hours + "h ";
    timeStr += minutes + "m " + seconds + "s";

    const text = isIndonesian
      ? "Server aktif dalam " + timeStr
      : "Server will be active in " + timeStr;

    countdownServerEl.textContent = text;
  } else {
    countdownServerEl.style.display = "none";
    serverEl.style.display = "inline-block";
    clearInterval(timerServer);
  }
}

