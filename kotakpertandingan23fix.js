// --- isi asli Matchxsofascore13.js ---
// (biarkan semua fungsi loadSofaScore dan utility-nya tetap ada di sini)

function loadSofaScore(matchId, matchKey) {
  // ... isi asli dari script Anda ...
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}



// --- fungsi renderMatch dengan waktu muncul server ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", kickoffTime = null) {

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
      <span id="serverButtons${matchKey}" style="font-size: large; display:none;">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();"><b><span>SERVER ${i+1}</span></b></a>
        `).join(" ")}
      </span>
      <div id="serverCountdown${matchKey}" style="color:yellow; font-size:13px; margin-top:5px;"></div>
    </center><br>
  </div>
  <script>loadSofaScore(${matchId}, "${matchKey}");<\/script>
  `;

  // Tunggu DOM siap
  function insertWhenReady() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", insertHTML);
    } else {
      insertHTML();
    }
  }

  function insertHTML() {
    document.body.insertAdjacentHTML("beforeend", html);
    initServerTimer();
  }

  function initServerTimer() {
    if (!kickoffTime) return;

    const [hour, minute] = kickoffTime.split(":").map(Number);
    const now = new Date();

    // Buat waktu kickoff (anggap input dalam WIB)
    const kickoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
    const offsetWIB = 7 * 60;
    const localOffset = now.getTimezoneOffset();
    kickoff.setMinutes(kickoff.getMinutes() + (offsetWIB + localOffset));

    const showTime = new Date(kickoff.getTime() - 15 * 60 * 1000);

    const serverEl = document.getElementById("serverButtons" + matchKey);
    const countdownEl = document.getElementById("serverCountdown" + matchKey);
    if (!serverEl || !countdownEl) return;

    function updateVisibility() {
      const now = new Date();
      if (now >= showTime) {
        serverEl.style.display = "inline";
        countdownEl.innerHTML = "";
      } else {
        serverEl.style.display = "none";
        const diff = Math.floor((showTime - now) / 1000);
        if (diff > 0) {
          const mins = Math.floor(diff / 60);
          const secs = diff % 60;
          countdownEl.innerHTML = `Server aktif dalam ${mins}:${secs.toString().padStart(2, "0")}`;
        }
      }
    }

    updateVisibility();
    setInterval(updateVisibility, 1000);
  }

  insertWhenReady();
}
