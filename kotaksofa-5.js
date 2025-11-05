function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvServerTime = null) {
  const html = `
  <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox">
    
    <div class="countdown" id="countdown${matchKey}" style="margin-bottom:10px;"></div>

    <div class="live-container" id="liveContainer${matchKey}" style="text-align:center; height:20px;">
      <span id="liveStatus${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
    </div>

    <div class="club1" style="position: relative; z-index: 1;">
      <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
        <strong id="formattedTime${matchKey}" style="color: red;"></strong>
      </div>
    </div>

    <div class="club">
      <center>
        <span id="league${matchKey}" 
              style="position:relative; top:5px; font-weight:bold; font-size:12px; color:white;">
              Refresh Or Setting Your DNS
        </span>

        <!-- 🔹 Bagian Tengah: Logo dan Nama Tim terkunci di tengah -->
        <div style="
          display:flex;
          justify-content:center;
          align-items:center;
          width:100%;
          max-width:450px;
          margin:8px auto 0 auto;
          gap:40px; /* jarak antar tim */
        ">
          <!-- Tim Home -->
          <div style="display:flex; align-items:center; gap:6px; text-align:right;">
            <span id="teamshome${matchKey}" 
                  style="font-weight:bold; color:white; font-size:14px; white-space:nowrap;"></span>
            <img id="logoHome${matchKey}" 
                 style="height:45px; width:45px; border-radius:5px; object-fit:contain;">
          </div>

          <!-- Tengah (Skor dan Status) -->
          <div style="text-align:center; min-width:60px;">
            <div id="liveScore${matchKey}" 
                 style="font-size:20px; font-weight:bold; color:orange;"></div>
            <br>
            <div id="matchStatus${matchKey}" 
                 style="font-family:'Courier New', monospace; font-size:10px; font-weight:bold; color:orange;">
            </div>
          </div>

          <!-- Tim Away -->
          <div style="display:flex; align-items:center; gap:6px; text-align:left;">
            <img id="logoAway${matchKey}" 
                 style="height:45px; width:45px; border-radius:5px; object-fit:contain;">
            <span id="teamsaway${matchKey}" 
                  style="font-weight:bold; color:white; font-size:14px; white-space:nowrap;"></span>
          </div>
        </div>

        <div id="kickoff${matchKey}" 
             style="font-size:12px; color:white; text-align:center; margin:5px 0; font-style:italic;">
        </div>

        <div id="tvCountdown${matchKey}" 
             style="margin-top:0px; margin-bottom:4px; color: yellow; font-weight:bold; font-style:italic"></div>

        <!-- Tombol SERVER (tidak diubah) -->
        <span style="font-size: large;">
          ${serverFuncs.map((fn, i) => `
            <a class="tv" id="tvServer${matchKey}_${i}" href="javascript:${fn}();">
              <b><span>SERVER ${i+1}</span></b>
            </a>
          `).join(" ")}
        </span>

      </center>
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
          tvServers.forEach(s => { s.style.pointerEvents = "none"; s.style.opacity = "0.5"; });
        } else {
          tvCountdownEl.innerHTML = "✅ Server Is Ready!";
          tvServers.forEach(s => { s.style.pointerEvents = "auto"; s.style.opacity = "1"; });
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
