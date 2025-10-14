// --- isi asli Matchxsofascore13.js ---
// (biarkan semua fungsi loadSofaScore dan utility-nya tetap ada di sini)

function loadSofaScore(matchId, matchKey) {
  // ... isi asli dari script Anda ...
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}



// --- fungsi tambahan untuk generate box + countdown TV ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak") {
  const html = `
  <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox">

    <!-- Countdown SofaScore -->
    <div class="countdown" id="countdown${matchKey}"></div>

    <!-- Countdown TV Server -->
    <div class="tv-countdown" id="tvCountdown${matchKey}" style="color:yellow; font-weight:bold; text-align:center; margin-top:5px;"></div>

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
      <span id="tvButtons${matchKey}" style="font-size: large;">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" id="tvBtn${matchKey}_${i}" href="javascript:void(0);" style="pointer-events:none; opacity:0.4;"><b><span>SERVER ${i+1}</span></b></a>
        `).join(" ")}
      </span>
    </center><br>
  </div>

  <script>
    // Jalankan SofaScore
    loadSofaScore(${matchId}, "${matchKey}");

    // Countdown untuk TV server (contoh: 15 detik)
    let tvCountdown${matchKey} = 15;
    const tvCountdownEl${matchKey} = document.getElementById("tvCountdown${matchKey}");
    const tvBtns${matchKey} = document.querySelectorAll("#tvButtons${matchKey} a.tv");

    const intervalTV${matchKey} = setInterval(() => {
      if (tvCountdown${matchKey} > 0) {
        tvCountdownEl${matchKey}.innerHTML = "Server aktif dalam: " + tvCountdown${matchKey} + " detik";
        tvCountdown${matchKey}--;
      } else {
        clearInterval(intervalTV${matchKey});
        tvCountdownEl${matchKey}.innerHTML = "Server sudah aktif!";
        tvBtns${matchKey}.forEach((btn, i) => {
          btn.href = "javascript:${serverFuncs[i]}();";
          btn.style.pointerEvents = "auto";
          btn.style.opacity = "1";
        });
      }
    }, 1000);
  <\/script>
  `;

  document.write(html);
}
