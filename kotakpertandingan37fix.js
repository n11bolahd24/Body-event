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

    <!-- Countdown SofaScore (asli, jangan diubah) -->
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

    <!-- Countdown & link server -->
    <center>
      <div id="countdownServer${matchKey}" style="color:yellow; font-weight:bold; margin-top:5px; display:none;"></div>
      <span id="serverLinks${matchKey}" style="font-size: large; display:none;">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();"><b><span>SERVER ${i+1}</span></b></a>
        `).join(" ")}
      </span>
    </center><br>
  </div>

  <script>
    loadSofaScore(${matchId}, "${matchKey}");

    (function() {
      const kickoff = new Date("${kickoffTime}").getTime();
      const showServerAt = kickoff - (15 * 60 * 1000); // 15 menit sebelum kickoff
      const serverEl = document.getElementById("serverLinks${matchKey}");
      const countdownServerEl = document.getElementById("countdownServer${matchKey}");

      function updateServerCountdown() {
        const now = Date.now();
        const diffToShow = showServerAt - now;
        const diffToKickoff = kickoff - now;

        // Belum masuk 15 menit terakhir → countdown server belum tampil
        if (diffToShow > 0) {
          countdownServerEl.style.display = "none";
          serverEl.style.display = "none";
          return;
        }

        // Sudah masuk 15 menit terakhir tapi belum kickoff → tampilkan countdown server
        if (diffToKickoff > 0) {
          countdownServerEl.style.display = "block";
          const minutes = Math.floor(diffToKickoff / 60000);
          const seconds = Math.floor((diffToKickoff % 60000) / 1000);
          countdownServerEl.textContent = "Server aktif dalam " + minutes + "m " + seconds + "s";
          serverEl.style.display = "none";
        } 
        // Setelah kickoff → countdown hilang, server muncul
        else {
          countdownServerEl.style.display = "none";
          serverEl.style.display = "inline-block";
          clearInterval(timerServer);
        }
      }

      updateServerCountdown();
      const timerServer = setInterval(updateServerCountdown, 1000);
    })();
  <\/script>
  `;

  document.write(html);
}
