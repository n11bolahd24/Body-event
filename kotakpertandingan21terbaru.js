// --- isi asli Matchxsofascore13.js ---
// (biarkan semua fungsi loadSofaScore dan utility-nya tetap ada di sini)

// contoh placeholder (punya Anda pasti lebih panjang)
function loadSofaScore(matchId, matchKey) {
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
  // kode asli fetch / API SofaScore kamu di sini
}


// --- fungsi tambahan untuk generate box + countdown server (otomatis zona waktu lokal) ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", showTime) {
  // showTime = waktu (format "YYYY-MM-DD HH:mm:ss") dalam zona WIB atau lokal server Anda

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
      <div id="serverContainer${matchKey}" style="margin-top:10px;">
        <span id="serverCountdown${matchKey}" style="color:yellow; font-weight:bold; font-size:14px;"></span>
        <div id="serverButtons${matchKey}" style="display:none; font-size:large;">
          ${serverFuncs.map((fn, i) => `
            <a class="tv" href="javascript:${fn}();"><b><span>SERVER ${i + 1}</span></b></a>
          `).join(" ")}
        </div>
      </div>
    </center><br>
  </div>
  <script>
    loadSofaScore(${matchId}, "${matchKey}");
    (function() {
      // parsing waktu showTime sesuai lokal pengguna
      const localShowTime = new Date("${showTime}".replace(" ", "T")); 
      const countdownEl = document.getElementById("serverCountdown${matchKey}");
      const serverEl = document.getElementById("serverButtons${matchKey}");

      function updateCountdown() {
        const now = new Date();
        const diff = localShowTime - now;

        if (diff <= 0) {
          countdownEl.style.display = "none";
          serverEl.style.display = "block";
          clearInterval(timer);
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          let text = "Server aktif dalam ";
          if (days > 0) text += days + "h ";
          if (hours > 0) text += hours + "j ";
          text += minutes + "m " + seconds + "d";

          countdownEl.textContent = text + " (waktu lokal)";
        }
      }

      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
    })();
  <\/script>
  `;

  document.write(html);
}
