// --- isi asli Matchxsofascore13.js ---
// (biarkan semua fungsi loadSofaScore dan utility-nya tetap ada di sini)
function loadSofaScore(matchId, matchKey) {
  // ... isi asli dari script Anda ...
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}



// --- fungsi tambahan untuk generate box ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak") {
  const html = `
  <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox">
    
    <!-- Live status -->
    <div class="live-container" id="liveContainer${matchKey}" style="text-align:center; height:20px;">
      <span id="liveStatus${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
    </div>

    <!-- Countdown SofaScore -->
    <div class="countdown" id="countdown${matchKey}" 
         style="font-size:14px; color:red; text-align:center; margin-bottom:4px;">
    </div>

    <!-- Bagian Tengah (Team, Score, Waktu, dll) -->
    <div class="club1" style="position: relative; z-index: 1;">
      <br/>
      <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
        <br/><br/>
        <strong id="formattedTime${matchKey}" style="color: red;"></strong>
      </div>
    </div>

    <div class="club">
      <center>
        <span id="league${matchKey}" 
              style="position:relative; top:5px; left:-11px; font-weight:bold; font-size:12px; color:white;">
              NAMA LIGA</span>
        <div id="liveScore${matchKey}" 
             style="position:relative; top:0px; left:0px;font-size:20px; font-family:'Arial', sans-serif; 
                    font-weight:bold; color:orange; text-align:center;"></div>  
        <div id="matchStatus${matchKey}" 
             style="font-family:'Courier New', monospace; font-size:10px; font-weight:bold; color:orange; 
                    text-align:center; margin:-1px 1px;"></div>   
        <font id="teams${matchKey}" 
              style="font-size:15px; font-weight:bold">NAMA CLUB VS NAMA CLUB</font><br>
        <div id="kickoff${matchKey}" 
             style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;">
        </div>
      </center>
    </div>

    <img id="logoHome${matchKey}" 
         style="position:absolute; height:55px; width:55px; top:20%; left:10%; border-radius:5px;">
    <img id="logoAway${matchKey}" 
         style="position:absolute; height:55px; width:55px; top:20%; right:10%; border-radius:5px;">

    <!-- Countdown untuk TV Server -->
    <center>
      <div id="countdownTV${matchKey}" 
           style="font-size:13px; color:orange; font-weight:bold; margin:6px 0;">
      </div>

      <!-- Tombol TV Server -->
      <span id="tvContainer${matchKey}" style="font-size: large; pointer-events:none; opacity:0.5;">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();" style="pointer-events:none;">
            <b><span>SERVER ${i+1}</span></b>
          </a>
        `).join(" ")}
      </span>
    </center><br>

  </div>
  <script>loadSofaScore(${matchId}, "${matchKey}");<\/script>
  `;

  document.write(html);
}



// --- Countdown khusus untuk TV Server ---
function activateTVServerAt(matchKey, targetTimeString) {
  const targetTime = new Date(targetTimeString).getTime();
  const countdownEl = document.getElementById("countdownTV" + matchKey);
  const tvContainer = document.getElementById("tvContainer" + matchKey);

  if (!countdownEl || !tvContainer) return;

  function updateCountdown() {
    const now = new Date().getTime();
    const diff = targetTime - now;

    if (diff <= 0) {
      countdownEl.innerHTML = "🎬 Server aktif!";
      tvContainer.style.pointerEvents = "auto";
      tvContainer.style.opacity = "1";
      tvContainer.querySelectorAll("a.tv").forEach(a => a.style.pointerEvents = "auto");
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    countdownEl.innerHTML =
      `Server on progress... ${days}D - ${hours}H - ${mins}M - ${secs}S`;

    requestAnimationFrame(updateCountdown);
  }

  tvContainer.style.pointerEvents = "none";
  tvContainer.style.opacity = "0.5";
  updateCountdown();
}
