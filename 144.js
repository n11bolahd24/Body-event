// --- Matchxsofascore13-multi.js ---
// Kompatibel multi event tab (event1, event2, dst.)
// renderMatch(eventID, matchId, matchKey, serverFuncs, boxClass, tvServerTime)

function renderMatch(eventID, matchId, matchKey, serverFuncs, boxClass = "kotak", tvServerTime = null) {
  const prefix = `e${eventID}_`;

  const html = `
  <div class="${boxClass}" id="${prefix}match${matchKey}">
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

        <div id="${prefix}tvCountdown${matchKey}" style="margin-top:0px; color: yellow; font-weight:bold; font-style:italic;"></div>

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
    loadSofaScore(${matchId}, "${prefix}${matchKey}", ${eventID});

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

// --- Fungsi Utama Load SofaScore + Countdown ---
function loadSofaScore(matchId, boxId, eventID) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;

  fetch(eventUrl)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      const home = event.homeTeam;
      const away = event.awayTeam;

      const leagueEl = document.getElementById(`league${boxId}`);
      if (leagueEl) {
        leagueEl.innerHTML = `
        <span style="display:inline-flex;align-items:center;">
          <img src="https://api.sofascore.app/api/v1/unique-tournament/${event.tournament.uniqueTournament.id}/image/dark"
               alt="${event.tournament.name}"
               style="height:18px;width:18px;margin-right:4px;">
          <span>${event.tournament.name}</span>
        </span>`;
      }

      const kickoffDate = new Date(event.startTimestamp * 1000);
      const tanggal = kickoffDate.toLocaleDateString(undefined, {
        day: '2-digit', month: 'long', year: 'numeric'
      });
      const jam = kickoffDate.toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short'
      });

      document.getElementById(`kickoff${boxId}`).innerHTML = `${tanggal} | K.O ${jam}`;
      document.getElementById(`teams${boxId}`).innerText = `${home.name} VS ${away.name}`;
      document.getElementById(`logoHome${boxId}`).src = `https://api.sofascore.app/api/v1/team/${home.id}/image`;
      document.getElementById(`logoAway${boxId}`).src = `https://api.sofascore.app/api/v1/team/${away.id}/image`;

      startCountdown(kickoffDate.getTime(), boxId);
      monitorMatchStatus(matchId, boxId, eventID);
    });
}

// --- Fungsi Update Live Score & Match Status ---
function monitorMatchStatus(matchId, boxId, eventID) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const matchBox = document.getElementById(`match${boxId}`);
  const liveContainer = document.getElementById(`liveContainer${boxId}`);
  const countdownEl = document.getElementById(`countdown${boxId}`);
  const liveScoreEl = document.getElementById(`liveScore${boxId}`);
  const matchStatusEl = document.getElementById(`matchStatus${boxId}`);
  const finishedContainer = document.getElementById(`finishedMatches${eventID}`);

  const interval = setInterval(async () => {
    const res = await fetch(eventUrl);
    const data = await res.json();
    const event = data.event;
    if (!event || !matchBox) return;

    if (event.status.type === "upcoming") {
      liveScoreEl.style.display = "none";
      matchStatusEl.style.display = "none";
      liveContainer.classList.add('hidden');
    }

    if (event.status.type === "inprogress" || event.status.type === "penalties") {
      if (window[`countdown_${boxId}`]) clearInterval(window[`countdown_${boxId}`]);
      countdownEl.innerHTML = "";

      liveContainer.classList.remove('hidden');
      liveContainer.classList.add('blink');
      liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";

      let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
      if (event.homeScore.penalties !== undefined && event.awayScore.penalties !== undefined) {
        scoreText += ` <span style="font-size:12px;">(P: ${event.homeScore.penalties} - ${event.awayScore.penalties})</span>`;
      }
      liveScoreEl.innerHTML = scoreText;
      liveScoreEl.style.display = "block";

      let statusText = "";
      if (event.status.type === "penalties") {
        statusText = "PENALTIES";
      } else if (event.time && event.time.currentPeriodStartTimestamp) {
        const startTs = event.time.currentPeriodStartTimestamp * 1000;
        const elapsed = Math.floor((Date.now() - startTs) / 60000);
        switch (event.status.description) {
          case "1st half": statusText = elapsed >= 45 ? "45+'" : `${elapsed}'`; break;
          case "2nd half": statusText = 45 + elapsed >= 90 ? "90+'" : `${45 + elapsed}'`; break;
          case "1st extra": statusText = 90 + elapsed >= 105 ? "105+'" : `${90 + elapsed}'`; break;
          case "2nd extra": statusText = 105 + elapsed >= 120 ? "120+'" : `${105 + elapsed}'`; break;
          default: statusText = event.status.description || "LIVE";
        }
      } else {
        statusText = event.status.description || "LIVE";
      }
      matchStatusEl.innerHTML = statusText;
      matchStatusEl.style.display = "block";
    }

    if (event.status.type === "finished") {
      clearInterval(interval);
      if (window[`countdown_${boxId}`]) clearInterval(window[`countdown_${boxId}`]);
      countdownEl.innerHTML = "";
      liveContainer.classList.remove('blink');
      liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

      let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
      if (event.homeScore.penalties !== undefined && event.awayScore.penalties !== undefined) {
        scoreText += ` <span style="font-size:12px;">(P: ${event.homeScore.penalties} - ${event.awayScore.penalties})</span>`;
      }
      liveScoreEl.innerHTML = scoreText;
      liveScoreEl.style.display = "block";

      matchStatusEl.innerHTML = "Full Time";
      matchStatusEl.style.display = "block";

      if (finishedContainer && matchBox.parentNode !== finishedContainer) {
        finishedContainer.appendChild(matchBox);
      }
    }
  }, 3000);
}

// --- Fungsi Countdown ---
function startCountdown(targetTime, boxId) {
  const countdownId = `countdown${boxId}`;
  window[`countdown_${boxId}`] = setInterval(() => {
    const now = Date.now();
    const distance = targetTime - now;
    const el = document.getElementById(countdownId);
    if (!el) return;

    if (distance < 0) {
      clearInterval(window[`countdown_${boxId}`]);
      el.innerHTML = "";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    el.innerText = (days > 0 ? `${days}D - ` : "") + `${hours}H - ${minutes}M - ${seconds}S`;
  }, 1000);
}
