// --- fungsi tambahan untuk generate box ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvServerTime = null) {
  const html = `
  <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox">
    <!-- Countdown Kickoff dari SofaScore -->
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

    <!-- Countdown 2 khusus TV Server -->
    <center>
      <div id="tvCountdown${matchKey}" style="font-size:13px; color:yellow; margin:5px;"></div>
      <span id="tvServerContainer${matchKey}" style="font-size: large;">
        ${serverFuncs.map((fn, i) => `
          <a class="tv tv-disabled" id="tv${matchKey}_${i}" href="javascript:void(0)" style="pointer-events:none; opacity:0.5;">
            <b><span>SERVER ${i+1}</span></b>
          </a>
        `).join(" ")}
      </span>
    </center><br>
  </div>

  <!-- Script SofaScore + countdown TV -->
  <script>
    // Load SofaScore countdown (kickoff)
    loadSofaScore(${matchId}, "${matchKey}");

    // --- Countdown TV berdasarkan waktu tertentu ---
    if (${tvServerTime ? `"${tvServerTime}"` : null}) {
      const targetTime = new Date("${tvServerTime.replace("T"," ")}").getTime();
      const countdownEl = document.getElementById("tvCountdown${matchKey}");
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const diff = targetTime - now;

        if (diff <= 0) {
          clearInterval(interval);
          countdownEl.innerText = "TV Server Aktif!";
          const links = document.querySelectorAll("#tvServerContainer${matchKey} .tv");
          links.forEach((link, i) => {
            link.href = "javascript:${serverFuncs[i]}()";
            link.style.pointerEvents = "auto";
            link.style.opacity = "1";
            link.classList.remove("tv-disabled");
          });
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownEl.innerText =
          "TV Server aktif dalam: " +
          (hours > 0 ? hours.toString().padStart(2, "0") + ":" : "") +
          minutes.toString().padStart(2, "0") + ":" +
          seconds.toString().padStart(2, "0");
      }, 1000);
    } else {
      document.getElementById("tvCountdown${matchKey}").style.display = "none";
      const links = document.querySelectorAll("#tvServerContainer${matchKey} .tv");
      links.forEach((link, i) => {
        link.href = "javascript:${serverFuncs[i]}()";
        link.style.pointerEvents = "auto";
        link.style.opacity = "1";
      });
    }
  <\/script>
  `;

  document.write(html);
}
