<script>
// --- isi asli Matchxsofascore13.js ---
// (biarkan semua fungsi loadSofaScore dan utility-nya tetap ada di sini)

function loadSofaScore(matchId, matchKey) {
  // ... isi asli dari script Anda ...
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}



// --- fungsi tambahan untuk generate box ---
// tambahkan parameter kickoffTime
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", kickoffTime) {
  const html = `
  <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox">
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
    <center>
      <!-- link server disembunyikan dulu -->
      <span id="serverContainer${matchKey}" style="font-size: large; display:none;">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();"><b><span>SERVER ${i+1}</span></b></a>
        `).join(" ")}
      </span>
    </center><br>
  </div>
  <script>loadSofaScore(${matchId}, "${matchKey}");<\/script>
  `;

  document.write(html);

  // setelah ditulis ke halaman, aktifkan countdown & kontrol tampilan server
  setTimeout(function() {
    if (kickoffTime) setupKickoffDisplay(matchKey, kickoffTime);
  }, 500);
}



// --- fungsi tambahan: tampilkan link saat kickoff ---
function setupKickoffDisplay(matchKey, kickoffTime) {
  const countdownEl = document.getElementById("countdown" + matchKey);
  const serverContainer = document.getElementById("serverContainer" + matchKey);
  const kickoff = new Date(kickoffTime).getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const selisih = kickoff - now;

    if (selisih <= 0) {
      // Sudah kickoff, tampilkan link
      countdownEl.innerText = "KICKOFF!";
      serverContainer.style.display = "inline-block";
      clearInterval(timer);
    } else {
      // Belum kickoff, tampilkan hitung mundur
      const menit = Math.floor(selisih / 60000);
      const detik = Math.floor((selisih % 60000) / 1000);
      countdownEl.innerText = `Kickoff dalam ${menit}m ${detik}s`;
    }
  }

  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
}
</script>
