// --- Matchxsofascore13.js ---
// versi fix layout Ball Possession (rapi, tidak bentrok)

function loadSofaScore(matchId, matchKey) {
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);

  fetch(`https://api.sofascore.com/api/v1/event/${matchId}/statistics`)
    .then(res => res.json())
    .then(data => {
      const possessionEl = document.getElementById(`possession${matchKey}`);
      if (!possessionEl) return;

      let home = null, away = null;

      // cari kategori 'Ball possession'
      data.statistics?.forEach(group => {
        group.groups?.forEach(g => {
          g.statisticsItems?.forEach(item => {
            if (item.name.toLowerCase().includes("possession")) {
              home = item.home;
              away = item.away;
            }
          });
        });
      });

      if (home && away) {
        possessionEl.innerHTML = `⚽ Ball Possession: <b style="color:#fff;">${home}% - ${away}%</b>`;
      } else {
        possessionEl.innerHTML = `⏳ Ball Possession: <span style="color:gray;">waiting</span>`;
      }
    })
    .catch(err => {
      console.error(err);
      const possessionEl = document.getElementById(`possession${matchKey}`);
      if (possessionEl) possessionEl.innerHTML = "⚠️ Ball Possession: <span style='color:red'>error</span>";
    });
}

// --- render box pertandingan ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvServerTime = null) {
  const html = `
  <div class="${boxClass}" id="match${matchKey}" 
     style="position:relative; display:flex; flex-direction:column; align-items:center; text-align:center; padding-top:25px;">

    <!-- 🔹 Ball Possession (atas kiri tapi tidak menabrak LIVE) -->
    <div id="possession${matchKey}" 
         style="position:absolute; top:3px; left:8px; font-size:12px; font-weight:bold; color:cyan; text-align:left;">
      ⚽ Ball Possession: <span style="color:#aaa;">⏳</span>
    </div>

    <!-- Countdown / Live -->
    <div class="countdown" id="countdown${matchKey}" style="position:absolute; top:8px; text-align:center;"></div>

    <div class="live-container" id="liveContainer${matchKey}" 
         style="position:absolute; top:8px; text-align:center;">
      <div id="liveStatus${matchKey}" 
           style="display:inline-block; font-weight:bold; color:red; font-size:16px;">
      </div>
    </div>

    <div class="club1" style="position: relative; z-index: 1;">
      <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
        <strong id="formattedTime${matchKey}" style="color: red;"></strong>
      </div>
    </div>
    
    <div class="club">
      <center>
        <div id="league${matchKey}" 
             style="position:relative; top:15px; font-weight:bold; font-size:12px; color:white; text-align:center;">
          Refresh Or Setting Your DNS
        </div>
      </center>
    </div>

    <!-- 🔹 Tim & Skor -->
    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      width:100%;
      max-width:420px;
      margin-top:5px;
      margin-bottom:0px;
    ">
      <!-- Home -->
      <div style="flex:1; display:flex; justify-content:flex-end; align-items:center; gap:8px;">
        <span id="teamshome${matchKey}" 
              style="font-weight:bold; color:white; font-size:14px; text-align:right; white-space:normal; max-width:105px; display:inline-block; line-height:1.2;">
        </span>
        <img id="logoHome${matchKey}" style="height:45px; width:45px; border-radius:5px; margin-right:15px;">
      </div>

      <!-- Skor -->
      <div id="liveScore${matchKey}" 
           style="min-width:30px; text-align:center; font-size:20px; font-weight:bold; color:orange;">VS</div>

      <!-- Away -->
      <div style="flex:1; display:flex; justify-content:flex-start; align-items:center; gap:8px;">
        <img id="logoAway${matchKey}" style="height:45px; width:45px; border-radius:5px; margin-left:15px;">
        <span id="teamsaway${matchKey}" 
              style="font-weight:bold; color:white; font-size:14px; text-align:left; white-space:normal; max-width:105px; display:inline-block; line-height:1.2;">
        </span>
      </div>
    </div>

    <!-- Info lainnya -->
    <div id="matchStatus${matchKey}" style="margin-top:-5px; margin-bottom:0px; text-align:center; font-family:'Courier New', monospace; font-size:10px; font-weight:bold; color:orange;">UP COMING</div>
    <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;"></div>

    <!-- Countdown TV -->
    <div id="tvCountdown${matchKey}" style="margin-top:3px; margin-bottom:3px; color: yellow; font-weight:bold; font-style:italic;"></div>

    <!-- Tombol TV -->
    <div style="font-size: large; margin-top:6px; padding-bottom:8px;">
      ${serverFuncs.map((fn, i) => `
        <a class="tv" id="tvServer${matchKey}_${i}" href="javascript:${fn}();">
          <b><span>SERVER ${i+1}</span></b>
        </a>
      `).join(" ")}
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
  </div>
  `;

  document.write(html);
}
