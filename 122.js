// --- isi asli Matchxsofascore13.js ---
// (biarkan semua fungsi loadSofaScore dan utility-nya tetap ada di sini)

function loadSofaScore(matchId, matchKey) {
  // ... isi asli dari script Anda ...
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}

// --- fungsi tambahan untuk generate box ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvActiveTime = null) {
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

    <!-- Countdown khusus TV Server -->
    <div id="tvCountdown${matchKey}" style="text-align:center; font-weight:bold; color:yellow; font-size:14px; margin-top:10px;"></div>

    <center>
      <span style="font-size: large;" id="tvButtons${matchKey}">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();" id="tvBtn${matchKey}_${i}" 
             style="pointer-events:none; opacity:0.5;">
             <b><span>SERVER ${i+1}</span></b>
          </a>
        `).join(" ")}
      </span>
    </center><br>
  </div>

  <script>
    loadSofaScore(${matchId}, "${matchKey}");

    // === Countdown TV berdasarkan waktu aktif ===
    (function(){
      const targetTime = new Date("${tvActiveTime.replace(/-/g, '/')}").getTime(); // pastikan format JS kompatibel
      const countdownEl = document.getElementById("tvCountdown${matchKey}");
      const tvButtons = document.querySelectorAll("#tvButtons${matchKey} a");

      function updateCountdown() {
        const now = new Date().getTime();
        const diff = targetTime - now;

        if (diff > 0) {
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          const timeStr = 
            (hours > 0 ? hours + "j " : "") + 
            (minutes > 0 ? minutes + "m " : "") + 
            seconds + "d";

          countdownEl.textContent = "TV Server aktif dalam " + timeStr + " ...";
          setTimeout(updateCountdown, 1000);
        } else {
          countdownEl.textContent = "✅ TV Server sudah bisa diakses!";
          tvButtons.forEach(btn => {
            btn.style.pointerEvents = "auto";
            btn.style.opacity = "1";
          });
        }
      }

      updateCountdown();
    })();
  <\/script>
  `;

  document.write(html);
}
