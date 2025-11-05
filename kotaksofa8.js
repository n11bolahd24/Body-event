// --- Fungsi ambil data dari API SofaScore ---
function loadSofaScore(matchId, matchKey) {
  const url = `https://api.sofascore.com/api/v1/event/${matchId}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const event = data.event;
      const home = event.homeTeam;
      const away = event.awayTeam;

      // --- Logo tim ---
      document.getElementById("logoHome" + matchKey).src = `https://api.sofascore.app/api/v1/team/${home.id}/image`;
      document.getElementById("logoAway" + matchKey).src = `https://api.sofascore.app/api/v1/team/${away.id}/image`;

      // --- Nama tim ---
      document.getElementById("homeName" + matchKey).textContent = home.name;
      document.getElementById("awayName" + matchKey).textContent = away.name;

      // --- Nama liga ---
      document.getElementById("league" + matchKey).textContent = event.tournament.name;

      // --- Waktu kickoff ---
      const date = new Date(event.startTimestamp * 1000);
      document.getElementById("kickoff" + matchKey).textContent =
        date.toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

      // --- Debug ---
      console.log("Loaded:", home.name, "vs", away.name);
    })
    .catch(err => {
      console.error("Gagal ambil data:", err);
      document.getElementById("league" + matchKey).textContent = "❌ Gagal memuat data!";
    });
}

// --- Fungsi untuk generate box pertandingan ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvServerTime = null) {
  const html = `
  <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox">
    <div class="countdown" id="countdown${matchKey}"></div>
    <div class="live-container" id="liveContainer${matchKey}" style="text-align:center; height:20px;">
      <span id="liveStatus${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
    </div>

    <!-- Tengah -->
    <div class="club1" style="position: relative; z-index: 1;">
      <br/>
      <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
        <br/><br/>
        <strong id="formattedTime${matchKey}" style="color: red;"></strong>
      </div>
    </div>

    <!-- Info Pertandingan -->
    <div class="club">
      <center>
        <span id="league${matchKey}" style="position:relative; top:5px; left:-11px; font-weight:bold; font-size:12px; color:white;">Loading league...</span>
        <div id="liveScore${matchKey}" style="font-size:20px; font-weight:bold; color:orange; text-align:center;"></div>  
        <div id="matchStatus${matchKey}" style="font-size:10px; font-weight:bold; color:orange; text-align:center; margin:-1px 1px;"></div>   
        <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;"></div>

        <!-- Countdown TV server -->
        <div id="tvCountdown${matchKey}" style="margin-top:2px; color: yellow; font-weight:bold; font-style:italic"></div>

        <!-- Tombol TV server -->
        <span style="font-size: large;">
          ${serverFuncs.map((fn, i) => `
            <a class="tv" id="tvServer${matchKey}_${i}" href="javascript:${fn}();" 
               style="display:inline-block; margin:2px; padding:3px 10px; background:#001d3d; color:white; border-radius:6px; text-decoration:none;">
               SERVER ${i+1}
            </a>
          `).join(" ")}
        </span>
      </center>
    </div>

    <!-- Logo + Nama Tim -->
    <div style="position:absolute; top:20%; left:8%; display:flex; align-items:center; gap:8px;">
      <img id="logoHome${matchKey}" style="height:55px; width:55px; border-radius:5px; background:#111;">
      <span id="homeName${matchKey}" style="font-weight:bold; color:white; font-size:14px; white-space:nowrap;"></span>
    </div>

    <div style="position:absolute; top:20%; right:8%; display:flex; align-items:center; gap:8px; flex-direction:row-reverse;">
      <img id="logoAway${matchKey}" style="height:55px; width:55px; border-radius:5px; background:#111;">
      <span id="awayName${matchKey}" style="font-weight:bold; color:white; font-size:14px; white-space:nowrap; text-align:right;"></span>
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
