// --- Matchxsofascore13-multi.js ---
// Versi universal: renderMatch(eventID, matchId, matchKey, serverFuncs, boxClass, tvServerTime)
// Bisa dipakai di banyak tab tanpa bentrok (e1_, e2_, e3_, dst.)

function loadSofaScore(matchId, matchKey) {
  // Placeholder fungsi SofaScore (jangan hapus jika sudah ada aslinya di file utama)
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}

function renderMatch(eventID, matchId, matchKey, serverFuncs, boxClass = "kotak", tvServerTime = null) {
  const prefix = `e${eventID}_`; // prefix unik per tab/event

  const html = `
  <div class="${boxClass}" id="${prefix}match${matchKey}" class="matchbox">
    <div class="countdown" id="${prefix}countdown${matchKey}"></div>
    <div class="live-container" id="${prefix}liveContainer${matchKey}" style="text-align:center; height:20px;">
      <span id="${prefix}liveStatus${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
    </div>
    <div class="club1" style="position: relative; z-index: 1;">
      <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); font-size: 29px;">
        <br/><br/>
        <strong id="${prefix}formattedTime${matchKey}" style="color: red;"></strong>
      </div>
    </div>
    <div class="club">
      <center>
        <span id="${prefix}league${matchKey}" style="font-weight:bold; font-size:12px; color:white;">Loading...</span>
        <div id="${prefix}liveScore${matchKey}" style="font-size:20px; font-weight:bold; color:orange;"></div>  
        <div id="${prefix}matchStatus${matchKey}" style="font-size:10px; font-weight:bold; color:orange;"></div>   
        <font id="${prefix}teams${matchKey}" style="font-size:15px; font-weight:bold">Failed To Load !</font><br>
        <div id="${prefix}kickoff${matchKey}" style="font-size:12px; color:white; font-style:italic;"></div>

        <div id="${prefix}tvCountdown${matchKey}" style="margin-top:0px; color: yellow; font-weight:bold; font-style:italic"></div>

        <span style="font-size: large;">
          ${serverFuncs.map((fn, i) => `
            <a class="tv" id="${prefix}tvServer${matchKey}_${i}" href="javascript:${fn}();">
              <b><span>SERVER ${i+1}</span></b>
            </a>
          `).join(" ")}
        </span>
      </center>
    </div>

    <img id="${prefix}logoHome${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; left:10%; border-radius:5px;">
    <img id="${prefix}logoAway${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; right:10%; border-radius:5px;">
  </div>

  <script>
    loadSofaScore(${matchId}, "${prefix}${matchKey}");

    ${tvServerTime ? `
    (function(){
      const tvCountdownEl = document.getElementById("${prefix}tvCountdown${matchKey}");
      const tvServers = [${serverFuncs.map((_, i) => `"${prefix}tvServer${matchKey}_${i}"`).join(",")}]
        .map(id => document.getElementById(id));
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
