// --- fungsi load SofaScore tetap ---
function loadSofaScore(matchId, matchKey) {
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}


// --- fungsi tambahan: render match + countdown TV server ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvStartTime = null) {
  const html = `
  <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox">
    <div class="countdown" id="countdown${matchKey}"></div>
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
      <span style="font-size: large;" id="tvContainer${matchKey}">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();" style="display:inline-block;"><b><span>SERVER ${i+1}</span></b></a>
        `).join(" ")}
      </span>
    </center><br>
  </div>
  <script>loadSofaScore(${matchId}, "${matchKey}");<\/script>
  `;

  document.write(html);

  // --- aktifkan countdown TV server bila ada waktu start ---
  if (tvStartTime) {
    const target = new Date(tvStartTime).getTime();

    function setupCountdown() {
      const container = document.getElementById(`tvContainer${matchKey}`);
      if (!container) {
        setTimeout(setupCountdown, 300);
        return;
      }

      const innerHTML = container.innerHTML;
      container.innerHTML = `
        <div id="tvCountdown${matchKey}" style="font-size:12px; color:yellow; margin-bottom:5px;"></div>
        <div id="tvButtons${matchKey}" style="display:none;">${innerHTML}</div>
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

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        countdownEl.innerHTML = `Server aktif dalam ${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
      }

      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
    }

    setupCountdown();
  }
}
