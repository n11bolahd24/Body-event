// --- isi asli Matchxsofascore13.js ---
// (biarkan semua fungsi loadSofaScore dan utility-nya tetap ada di sini)

function loadSofaScore(matchId, matchKey) {
  // ... isi asli dari script Anda ...
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}

// --- fungsi tambahan untuk generate box ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvServerTime = null) {
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
        <span id="league${matchKey}" style="position:relative; top:5px; left:-11px; font-weight:bold; font-size:12px; color:white;">Refresh Or Setting Your DNS</span>
        <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      width:100%;
      max-width:420px;
      margin-top:5px;
      margin-bottom:0px;
    ">
     
      <!-- Tim Home -->
      <div style="flex:1; display:flex; justify-content:flex-end; align-items:center; gap:6px;">
        <span id="teamshome${matchKey}" style="font-weight:bold; color:white; font-size:14px; text-align:right; white-space:nowrap;"></span>
        <img id="logoHome${matchKey}" style="height:45px; width:45px; border-radius:5px;">
      </div>

      
      <div id="liveScore${matchKey}" style="font-size:20px; font-weight:bold; color:orange;"></div>

      <!-- Tim Away -->
      <div style="flex:1; display:flex; justify-content:flex-start; align-items:center; gap:6px;">
        <img id="logoAway${matchKey}" style="height:45px; width:45px; border-radius:5px;">
        <span id="teamsaway${matchKey}" style="font-weight:bold; color:white; font-size:14px; text-align:left; white-space:nowrap;"></span>
      </div>
      <div id="matchStatus${matchKey}" style="font-family:'Courier New', monospace; font-size:10px; font-weight:bold; color:orange; text-align:center; margin:-1px 1px;"></div>   
        <font id="teams${matchKey}" style="font-size:15px; font-weight:bold">Failed To Load !</font><br>
        <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;"></div>

        <!-- Countdown TV server langsung di bawah kickoff -->
        <div id="tvCountdown${matchKey}" style="margin-top:0px; margin-bottom:0px; color: yellow; font-weight:bold; font-style:italic"></div>

        <!-- Tombol TV server -->
        <span style="font-size: large;">
          ${serverFuncs.map((fn, i) => `
            <a class="tv" id="tvServer${matchKey}_${i}" href="javascript:${fn}();"><b><span>SERVER ${i+1}</span></b></a>
          `).join(" ")}
        </span>
      </center>
    </div>
    
    </div>
  </div>

  <script>
    loadSofaScore(${matchId}, "${matchKey}");

    ${tvServerTime ? `
    (function(){
      const tvCountdownEl = document.getElementById("tvCountdown${matchKey}");
      const tvServers = [${serverFuncs.map((_, i) => `"tvServer${matchKey}_${i}"`).join(",")}].map(id => document.getElementById(id));
      const targetTime = new Date("${tvServerTime}").getTime();

      function updateTvCountdown() {
        const now = new Date().getTime();
        const distance = targetTime - now;
        if(distance > 0){
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          tvCountdownEl.innerHTML = "⏳ Waiting for server : "+ days + "d " + hours + "h " + minutes + "m " + seconds + "s";
          // Nonaktifkan klik & transparan
          tvServers.forEach(s => {
            s.style.pointerEvents = "none";
            s.style.opacity = "0.5";
          });
        } else {
          tvCountdownEl.innerHTML = "✅ Server Is Ready!";
          tvServers.forEach(s => {
            s.style.pointerEvents = "auto";
            s.style.opacity = "1";
          });
          clearInterval(interval);
        }
      }

      const interval = setInterval(updateTvCountdown, 1000);
      updateTvCountdown();
    })();
    ` : ""}
  <\/script>
  `;

  document.write(html);
}
