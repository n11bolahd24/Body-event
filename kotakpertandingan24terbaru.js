// --- isi asli Matchxsofascore13.js ---
// Semua fungsi loadSofaScore dan utility tetap di sini

function loadSofaScore(matchId, matchKey) {
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
  // ... fungsi asli Anda ...
}

// --- fungsi tambahan untuk generate box ---
function renderMatch(matchId, matchKey, serverFuncs, kickoffTime, boxClass = "kotak") {
  const html = `
  <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox">
    <div class="countdown" id="countdown${matchKey}" style="font-size:13px; color:#fff; text-align:center; margin-top:2px;"></div>
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
    <div id="tvServers${matchKey}" style="text-align:center; margin-top:10px;"></div>
  </div>
  <script>
    loadSofaScore(${matchId}, "${matchKey}");
    startCountdown("${kickoffTime}", "countdown${matchKey}");
    renderTVServers("${matchKey}", ${JSON.stringify(serverFuncs)});
  <\/script>
  `;

  document.write(html);
}

// --- countdown function ---
function startCountdown(kickoffTime, countdownId) {
  const kickoff = new Date(kickoffTime).getTime();
  const el = document.getElementById(countdownId);

  if (!el) return;

  const timer = setInterval(() => {
    const now = new Date().getTime();
    const distance = kickoff - now;

    if (distance <= 0) {
      el.innerHTML = "<span style='color:red;font-weight:bold;'>LIVE</span>";
      clearInterval(timer);
      return;
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    el.innerHTML = `Kickoff in ${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

// File ini khusus untuk fungsi TV Server agar terpisah dari SofaScore
function renderTVServers(matchKey, serverFuncs) {
  const container = document.getElementById(`tvServers${matchKey}`);
  if (!container) return;

  container.innerHTML = `
    <center>
      <span style="font-size: large;">
        ${serverFuncs
          .map((fn, i) => `<a class="tv" href="javascript:${fn}();" style="margin:0 5px;">
              <b><span>SERVER ${i + 1}</span></b>
            </a>`)
          .join(" ")}
      </span>
    </center>
  `;
                                          }
      
