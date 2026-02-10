/* =========================================================
   SOFASCORE CONFIG (ANTI BLOCK)
========================================================= */
const SOFA_PROXY = "https://cors.isomorphic-git.org/";
const SOFA_API   = "https://api.sofascore.app/api/v1/event/";

/* =========================================================
   LOAD SOFASCORE DATA
========================================================= */
function loadSofaScore(matchId, boxId) {
  const eventUrl = SOFA_PROXY + SOFA_API + matchId;

  fetch(eventUrl, {
    cache: "no-store",
    headers: { accept: "application/json" }
  })
  .then(r => {
    if (!r.ok) throw "blocked";
    return r.json();
  })
  .then(data => {
    const e = data.event;
    if (!e) throw "no event";

    // league
    const leagueEl = document.getElementById("league" + boxId);
    if (leagueEl && e.tournament?.uniqueTournament) {
      leagueEl.innerHTML = `
        <span style="display:inline-flex;align-items:center;">
          <img src="https://api.sofascore.app/api/v1/unique-tournament/${e.tournament.uniqueTournament.id}/image/dark"
               style="height:18px;width:18px;margin-right:4px;">
          <span>${e.tournament.name}</span>
        </span>`;
    }

    // kickoff
    const ko = new Date(e.startTimestamp * 1000);
    document.getElementById("kickoff" + boxId).innerHTML =
      ko.toLocaleDateString(undefined,{day:"2-digit",month:"long",year:"numeric"}) +
      " | K.O " +
      ko.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit",hour12:false});

    // team + logo
    document.getElementById("teamshome" + boxId).innerText = e.homeTeam.name;
    document.getElementById("teamsaway" + boxId).innerText = e.awayTeam.name;

    document.getElementById("logoHome" + boxId).src =
      "https://api.sofascore.app/api/v1/team/" + e.homeTeam.id + "/image";
    document.getElementById("logoAway" + boxId).src =
      "https://api.sofascore.app/api/v1/team/" + e.awayTeam.id + "/image";

    startCountdown(ko.getTime(), boxId);
    monitorMatchStatus(matchId, boxId);
  })
  .catch(() => {
    console.warn("SofaScore fallback aktif");
  });
}

/* =========================================================
   LIVE MONITOR
========================================================= */
function monitorMatchStatus(matchId, boxId) {
  const eventUrl = SOFA_PROXY + SOFA_API + matchId;

  const liveBox   = document.getElementById("liveContainer" + boxId);
  const scoreEl  = document.getElementById("liveScore" + boxId);
  const statusEl = document.getElementById("matchStatus" + boxId);
  const cdEl     = document.getElementById("countdown" + boxId);

  let finished = false;

  const interval = setInterval(async () => {
    if (finished) return;

    try {
      const r = await fetch(eventUrl,{cache:"no-store"});
      if (!r.ok) return;
      const e = (await r.json()).event;
      if (!e) return;

      const st = e.status.type;

      if (st === "upcoming") {
        scoreEl.innerHTML = "VS";
        statusEl.innerHTML = "UP COMING";
        liveBox.classList.add("hidden");
      }

      else if (st === "inprogress" || st === "penalties") {
        clearInterval(window["countdown_" + boxId]);
        cdEl.innerHTML = "";

        liveBox.classList.remove("hidden","blink");
        void liveBox.offsetWidth;
        liveBox.classList.add("blink");
        liveBox.innerHTML = "<b style='color:white'>🔴 LIVE</b>";

        let sc = `${e.homeScore.current} - ${e.awayScore.current}`;
        if (e.homeScore.penalties !== undefined)
          sc += ` <span style="font-size:12px">(P ${e.homeScore.penalties}-${e.awayScore.penalties})</span>`;
        scoreEl.innerHTML = sc;

        statusEl.innerHTML = e.status.description || "LIVE";
      }

      else if (st === "finished") {
        finished = true;
        clearInterval(interval);

        liveBox.classList.remove("blink","hidden");
        liveBox.innerHTML = "<b style='color:white'>⛔ MATCH ENDED</b>";

        let fs = `${e.homeScore.current} - ${e.awayScore.current}`;
        scoreEl.innerHTML = fs;
        statusEl.innerHTML = "Full Time";
      }

    } catch {}
  }, 10000); // aman
}

/* =========================================================
   COUNTDOWN
========================================================= */
function startCountdown(target, boxId) {
  window["countdown_" + boxId] = setInterval(() => {
    const d = target - Date.now();
    if (d <= 0) {
      clearInterval(window["countdown_" + boxId]);
      document.getElementById("countdown" + boxId).innerHTML = "";
      return;
    }
    document.getElementById("countdown" + boxId).innerText =
      `${Math.floor(d/3600000)}H - ${Math.floor(d/60000)%60}M - ${Math.floor(d/1000)%60}S`;
  },1000);
}

/* =========================================================
   RENDER MATCH BOX
========================================================= */
function renderMatch(matchId, matchKey, serverFuncs, boxClass="kotak", tvServerTime=null, fallbackTeams=null) {

  document.write(`
<div class="${boxClass}" id="match${matchKey}">
  <div id="countdown${matchKey}"></div>
  <div id="liveContainer${matchKey}" class="hidden"></div>

  <div id="league${matchKey}">
    Data live sedang dimuat…
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;">
    <span id="teamshome${matchKey}">${fallbackTeams?.home||""}</span>
    <div id="liveScore${matchKey}">VS</div>
    <span id="teamsaway${matchKey}">${fallbackTeams?.away||""}</span>
  </div>

  <div id="matchStatus${matchKey}">UP COMING</div>
  <div id="kickoff${matchKey}"></div>

  <div>
    ${serverFuncs.map((fn,i)=>`
      <a class="tv" id="tvServer${matchKey}_${i}" href="javascript:${fn}();">
        SERVER ${i+1}
      </a>
    `).join("")}
  </div>

  <script>
    loadSofaScore(${matchId},"${matchKey}");
  <\/script>
</div>
`);
}
