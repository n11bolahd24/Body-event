<div class="kotak" id="match1">
  <div class="countdown" id="countdown1"></div>

  <!-- Live Status -->
  <div class="live-container" id="liveContainer1" style="text-align:center; height:20px;">
    <span id="liveStatus1" style="display:inline-block; width:150px; font-weight:bold;"></span>
  </div>

  <div class="club">
    <center>
      <!-- Nama Liga + Logo -->
      <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
        <img id="leagueLogo1" style="height:18px; width:18px; border-radius:3px;">
        <font id="league1" style="font-weight:bold">NAMA LIGA</font>
      </div>

      <!-- Skor & Status -->
      <div id="liveScore1" style="font-size:10px; font-weight:bold; color:orange; text-align:center; margin:1px 0;"></div>  
      <div id="matchStatus1" style="font-size:10px; font-weight:bold; color:orange; text-align:center; margin:1px 0;"></div>   

      <!-- Nama tim -->
      <font id="teams1" style="font-weight:bold">NAMA CLUB VS NAMA CLUB</font><br>

      <!-- Kickoff -->
      <div id="kickoff1" style="font-size:12px; color:white; text-align:center; margin:1px 0;"></div>
    </center>
  </div>

  <!-- Logo tim -->
  <img id="logoHome1" style="position:absolute; height:50px; width:50px; top:25%; left:10%; border-radius:5px;">
  <img id="logoAway1" style="position:absolute; height:50px; width:50px; top:25%; right:10%; border-radius:5px;">

  <!-- Tombol server -->
  <center>
    <span style="font-size: large;">
      <a class="tv" href="javascript:skylaliga();"><b><span>SERVER1</span></b></a>
      <a class="tv" href="javascript:SERVER2();"><b><span>SERVER2</span></b></a>
      <a class="tv" href="javascript:SERVER3();"><b><span>SERVER3</span></b></a>
      <a class="tv" href="javascript:SERVER4();"><b><span>SERVER4</span></b></a>
    </span>
  </center><br>
</div>

<script>
// --- Fungsi Utama Load Sofascore ---
function loadSofaScore(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;

    fetch(eventUrl)
        .then(res => res.json())
        .then(data => {
            const event = data.event;
            const home = event.homeTeam;
            const away = event.awayTeam;

            // Nama liga + logo liga
            document.getElementById("league" + boxId).innerText = event.tournament.name;
            document.getElementById("leagueLogo" + boxId).src =
                "https://api.sofascore.app/api/v1/unique-tournament/" + event.tournament.uniqueTournament.id + "/image";

            // Kickoff otomatis sesuai zona waktu browser
            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            let kickoffDate = new Date(event.startTimestamp * 1000);
            let options = {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: userTimeZone,
                timeZoneName: "short"
            };
            let kickoffString = new Intl.DateTimeFormat("id-ID", options).format(kickoffDate);
            document.getElementById("kickoff" + boxId).innerText = kickoffString;

            // Nama tim
            document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;

            // Logo tim
            document.getElementById("logoHome" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
            document.getElementById("logoAway" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

            // Mulai countdown & monitor status
            startCountdown(kickoffDate.getTime(), boxId);
            monitorMatchStatus(matchId, boxId);
        });
}

// --- Fungsi Update Status Pertandingan ---
function monitorMatchStatus(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchStatusEl = document.getElementById("matchStatus" + boxId);

    const interval = setInterval(async () => {
        const res = await fetch(eventUrl);
        const data = await res.json();
        const event = data.event;
        if (!event) return;

        // Sebelum kickoff
        if (event.status.type === "upcoming") {
            liveScoreEl.style.display = "none";
            matchStatusEl.style.display = "none";
            liveContainer.classList.add('hidden');
        }

        // Saat pertandingan berlangsung
        if (event.status.type === "inprogress") {
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('hidden');
            liveContainer.classList.add('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW</strong>";

            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";

            matchStatusEl.innerHTML = event.status.description || "1st Half";
            matchStatusEl.style.display = "block";
        }

        // Pertandingan selesai
        if (event.status.type === "finished") {
            clearInterval(interval);
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";

            matchStatusEl.innerHTML = "Full Time";
            matchStatusEl.style.display = "block";
        }
    }, 3000);
}

// --- Fungsi Countdown ---
function startCountdown(targetTime, boxId) {
    const countdownId = "countdown" + boxId;
    window["countdown_" + boxId] = setInterval(function () {
        const now = new Date().getTime();
        const distance = targetTime - now;

        if (distance < 0) {
            clearInterval(window["countdown_" + boxId]);
            document.getElementById(countdownId).innerHTML = "";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById(countdownId).innerText =
            (days > 0 ? days + "D - " : "") +
            hours + "H - " +
            minutes + "M - " +
            seconds + "S";
    }, 1000);
}


</script>
    
