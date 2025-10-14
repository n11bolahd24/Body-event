// --- isi asli Matchxsofascore13.js ---
// (biarkan semua fungsi loadSofaScore dan utility-nya tetap ada di sini)

function loadSofaScore(matchId, matchKey) {
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}



// --- fungsi renderMatch dengan countdown aman untuk Blogger ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvStartTime = null) {
  const wrapper = document.createElement("div");
  wrapper.className = boxClass;
  wrapper.id = "match" + matchKey;

  wrapper.innerHTML = `
    <div class="countdown" id="countdown${matchKey}" style="text-align:center; color:yellow; font-weight:bold; margin-bottom:5px;"></div>
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
        <div id="liveScore${matchKey}" style="position:relative; top:0px; left:0px; font-size:20px; font-family:'Arial', sans-serif; font-weight:bold; color:orange; text-align:center;"></div>  
        <div id="matchStatus${matchKey}" style="font-family:'Courier New', monospace; font-size:10px; font-weight:bold; color:orange; text-align:center; margin:-1px 1px;"></div>   
        <font id="teams${matchKey}" style="font-size:15px; font-weight:bold;">NAMA CLUB VS NAMA CLUB</font><br>
        <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;"></div>
      </center>
    </div>
    <img id="logoHome${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; left:10%; border-radius:5px;">
    <img id="logoAway${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; right:10%; border-radius:5px;">
    <center>
      <span id="tvContainer${matchKey}" style="font-size: large; display:none;">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();" style="display:inline-block;">
            <b><span>SERVER ${i+1}</span></b>
          </a>
        `).join(" ")}
      </span>
    </center><br>
  `;

  document.body.appendChild(wrapper);

  // load sofascore setelah box muncul
  loadSofaScore(matchId, matchKey);

  // countdown handling
  if (tvStartTime) {
    setupCountdown(matchKey, tvStartTime);
  } else {
    const tvContainer = document.getElementById("tvContainer" + matchKey);
    if (tvContainer) tvContainer.style.display = "inline-block";
  }
}



// --- fungsi countdown ---
function setupCountdown(matchKey, tvStartTime) {
  const countdownEl = document.getElementById("countdown" + matchKey);
  const tvContainer = document.getElementById("tvContainer" + matchKey);
  if (!countdownEl || !tvContainer) return;

  const targetTime = new Date(tvStartTime).getTime();

  const timer = setInterval(() => {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff <= 0) {
      clearInterval(timer);
      countdownEl.textContent = "";
      tvContainer.style.display = "inline-block";
      return;
    }

    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    countdownEl.textContent = `Server aktif dalam ${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
  }, 1000);
}
