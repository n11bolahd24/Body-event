// --- isi asli Matchxsofascore13.js ---
// (biarkan semua fungsi loadSofaScore dan utility-nya tetap ada di sini)
function loadSofaScore(matchId, matchKey) {
  // ... isi asli dari script Anda ...
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}



// --- fungsi tambahan untuk generate box + countdown TV server ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", startTime = null) {
  const html = `
  <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox">
    <div class="countdown" id="countdown${matchKey}" style="font-size:16px; color:yellow; text-align:center; margin-bottom:5px;"></div>
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
    <center>
      <span id="tvContainer${matchKey}" style="font-size: large; display:none;">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();" style="margin:0 4px;"><b><span>SERVER ${i+1}</span></b></a>
        `).join(" ")}
      </span>
    </center><br>
  </div>
  <script>loadSofaScore(${matchId}, "${matchKey}");<\/script>
  `;

  document.write(html);

  // kalau ada waktu start, jalankan countdown
  if (startTime) {
    startCountdown(matchKey, startTime);
  } else {
    // kalau tidak ada waktu start, langsung tampilkan TV server
    const tvContainer = document.getElementById(`tvContainer${matchKey}`);
    if (tvContainer) tvContainer.style.display = "inline-block";
  }
}



// --- fungsi countdown untuk munculkan TV server ---
function startCountdown(matchKey, startTime) {
  const countdownEl = document.getElementById(`countdown${matchKey}`);
  const tvContainer = document.getElementById(`tvContainer${matchKey}`);
  if (!countdownEl || !tvContainer) return;

  const targetTime = new Date(startTime).getTime();

  const timer = setInterval(() => {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance <= 0) {
      clearInterval(timer);
      countdownEl.style.display = "none";
      tvContainer.style.display = "inline-block";
      return;
    }

    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);
    countdownEl.textContent =
      (hours > 0 ? hours.toString().padStart(2, "0") + ":" : "") +
      minutes.toString().padStart(2, "0") + ":" +
      seconds.toString().padStart(2, "0");
  }, 1000);
}
