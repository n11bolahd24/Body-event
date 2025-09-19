<!-- ====================== KOTAK PERTANDINGAN ====================== -->
<div class="kotak2" id="match7" style="text-align:center; position:relative; margin-bottom:20px;">
  <div class="countdown" id="countdown7"></div>
  <div class="live-container hidden" id="liveContainer7" style="text-align:center; margin:5px 0;"></div>

  <!-- Logo + Nama Home -->
  <div style="display:inline-block; text-align:center; margin-right:50px;">
    <img id="logoHome7" style="height:50px; width:50px; border-radius:5px;">
    <div id="teamNameHome7" style="font-size:12px; font-weight:bold; margin-top:2px;">HOME TEAM</div>
  </div>

  <!-- Logo + Nama Away -->
  <div style="display:inline-block; text-align:center; margin-left:50px;">
    <img id="logoAway7" style="height:50px; width:50px; border-radius:5px;">
    <div id="teamNameAway7" style="font-size:12px; font-weight:bold; margin-top:2px;">AWAY TEAM</div>
  </div>

  <div class="club" style="text-align:center; margin-top:10px;">
    <div id="status7">Status : Upcoming</div>  
    <div id="liveScore7" style="font-size:14px; font-weight:bold; color:orange; margin:5px 0;"></div>  
    <font id="league7" style="font-weight:bold">NAMA LIGA</font><br>
    <div id="kickoff7"></div>
    <font id="teams7" style="font-weight:bold">NAMA CLUB VS NAMA CLUB</font><br>
  </div>
</div>

<!-- Container untuk Match Ended -->
<div id="finishedMatches" style="padding-top:10px;">
  <button style="height:35px; background:#fff; color:#000; width:100%; font-size:20px; font-family:courier,arial,helvetica;">⦿ MATCH ENDED ⦿</button>
</div>

<!-- ====================== SCRIPT ====================== -->
<script>
function loadSofaScore(matchId, boxId, region = "Asia/Jakarta") {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;

  fetch(eventUrl)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      const home = event.homeTeam;
      const away = event.awayTeam;

      // Nama liga
      document.getElementById("league" + boxId).innerText = event.tournament.name;

      // Tanggal & kickoff
      let kickoffDate = new Date(event.startTimestamp * 1000);
      let options = { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit", hour12:false, timeZone: region };
      let kickoffString = new Intl.DateTimeFormat("id-ID", options).format(kickoffDate);
      let regionAbbr = region==="Asia/Makassar"?"WITA":region==="Asia/Jayapura"?"WIT":"WIB";
      document.getElementById("kickoff" + boxId).innerText = kickoffString + " " + regionAbbr;

      // Nama tim
      document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;
      document.getElementById("teamNameHome" + boxId).innerText = home.name;
      document.getElementById("teamNameAway" + boxId).innerText = away.name;

      // Logo tim
      document.getElementById("logoHome" + boxId).src = "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
      document.getElementById("logoAway" + boxId).src = "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

      // Mulai countdown & monitor match
      startCountdown(kickoffDate.getTime(), boxId);
      monitorMatchStatus(matchId, boxId);
    });
}

// Monitor live & match ended
function monitorMatchStatus(matchId, boxId) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const interval = setInterval(async () => {
    const res = await fetch(eventUrl);
    const data = await res.json();
    const event = data.event;

    const liveContainer = document.getElementById("liveContainer" + boxId);
    const statusEl = document.getElementById("status" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchBox = document.getElementById("match" + boxId);
    const finishedContainer = document.getElementById("finishedMatches");
    if (!event || !matchBox || !finishedContainer) return;

    if (event.status.type === "inprogress") {
      liveContainer.classList.remove("hidden");
      liveContainer.classList.add("blink");
      liveContainer.innerHTML = "<strong style='color:red;'>🔴 LIVE NOW</strong>";
      countdownEl.innerText = "";

      // Update skor + babak
      let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
      if (event.status.description) scoreText += ` <span style="font-size:12px; color:#ffcc00;">(${event.status.description})</span>`;
      liveScoreEl.innerHTML = scoreText;
    }

    if (event.status.type === "finished") {
      clearInterval(interval);
      liveContainer.classList.remove("blink");
      liveContainer.innerHTML = "<strong style='color:gray;'>⛔ MATCH ENDED ⛔</strong>";
      statusEl.innerText = "Match Ended";
      countdownEl.innerText = "";

      // Skor tetap tampil
      let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
      if (event.status.description) scoreText += ` <span style="font-size:12px; color:#ffcc00;">(${event.status.description})</span>`;
      liveScoreEl.innerHTML = scoreText;

      if (matchBox.parentNode.id !== "finishedMatches") finishedContainer.appendChild(matchBox);
    }
  }, 3000);
}

// Countdown
function startCountdown(targetTime, boxId) {
  const countdownId = "countdown" + boxId;
  const statusId = "status" + boxId;

  const countdown = setInterval(() => {
    const now = new Date().getTime();
    const distance = targetTime - now;
    if (distance < 0) {
      clearInterval(countdown);
      const liveEl = document.getElementById(countdownId);
      liveEl.innerText = "🔴 LIVE NOW";
      liveEl.classList.add("blink");
      document.getElementById(statusId).innerText = "";
      return;
    }
    const days = Math.floor(distance / (1000*60*60*24));
    const hours = Math.floor((distance % (1000*60*60*24)) / (1000*60*60));
    const minutes = Math.floor((distance % (1000*60*60)) / (1000*60));
    const seconds = Math.floor((distance % (1000*60)) / 1000);
    document.getElementById(countdownId).innerText = (days>0?days+"D ":"") + hours+"H - "+minutes+"M - "+seconds+"S";
  }, 1000);
}
