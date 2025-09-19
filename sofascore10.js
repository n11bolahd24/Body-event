// --- CSS untuk blink LIVE NOW ---
const style = document.createElement("style");
style.innerHTML = `
.blink {
  animation: blink-animation 1s steps(2, start) infinite;
  color: red;
  font-weight: bold;
}
@keyframes blink-animation {
  to { visibility: hidden; }
}
.hidden { display: none; }
`;
document.head.appendChild(style);

// --- Fungsi utama Load Sofascore + Countdown + Match Ended ---
function loadSofaScore(matchId, boxId, region = "Asia/Jakarta") {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const timelineUrl = `https://api.sofascore.com/api/v1/event/${matchId}/timeline`;

  // Ambil detail pertandingan
  fetch(eventUrl)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      const home = event.homeTeam;
      const away = event.awayTeam;

      // Pastikan matchBox ada
      let matchBox = document.getElementById("matchBox" + boxId);
      if (!matchBox) {
        matchBox = document.createElement("div");
        matchBox.id = "matchBox" + boxId;
        matchBox.style.border = "1px solid #ccc";
        matchBox.style.padding = "5px";
        matchBox.style.margin = "5px 0";
        matchBox.innerHTML = `
          <div id="league${boxId}"></div>
          <div id="teams${boxId}"></div>
          <img id="logoHome${boxId}" width="50">
          <img id="logoAway${boxId}" width="50">
          <div id="kickoff${boxId}"></div>
          <div id="countdown${boxId}"></div>
          <div id="status${boxId}">Status: Upcoming</div>
          <div id="liveContainer${boxId}" class="hidden">
            <div id="liveScore${boxId}"></div>
          </div>
        `;
        document.getElementById("upcomingMatches").appendChild(matchBox);
      }

      // Nama liga
      document.getElementById("league" + boxId).innerText = event.tournament.name;

      // Jadwal kickoff regional
      let kickoffDate = new Date(event.startTimestamp * 1000);
      let options = { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: region };
      let kickoffString = new Intl.DateTimeFormat("id-ID", options).format(kickoffDate);

      let regionAbbr = "WIB";
      if (region === "Asia/Makassar") regionAbbr = "WITA";
      if (region === "Asia/Jayapura") regionAbbr = "WIT";

      document.getElementById("kickoff" + boxId).innerText = kickoffString + " " + regionAbbr;
      document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;

      document.getElementById("logoHome" + boxId).src = "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
      document.getElementById("logoAway" + boxId).src = "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

      // Mulai countdown
      startCountdown(kickoffDate.getTime(), boxId);

      // Update live score tiap 20 detik
      setInterval(() => updateLive(matchId, boxId), 20000);
      updateLive(matchId, boxId); // pertama kali
    });
}

// --- Fungsi Update Live Score & pindah Match Ended ---
function updateLive(matchId, boxId) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const timelineUrl = `https://api.sofascore.com/api/v1/event/${matchId}/timeline`;

  fetch(eventUrl)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      const matchBox = document.getElementById("matchBox" + boxId);

      if (!matchBox) return;

      if (event.status.type === "inprogress") {
        document.getElementById("liveContainer" + boxId).classList.remove("hidden");
        const countdownEl = document.getElementById("countdown" + boxId);
        countdownEl.innerText = "🔴 LIVE NOW";
        countdownEl.classList.add("blink");

        fetch(timelineUrl)
          .then(res => res.json())
          .then(timeline => {
            let minute = "";
            if (timeline.incidents && timeline.incidents.length > 0) {
              let latest = timeline.incidents.find(i => i.time && i.time.minute);
              if (latest) minute = latest.time.minute + "'";
            }
            if (!minute && event.status.description) minute = event.status.description;
            document.getElementById("liveScore" + boxId).innerHTML =
              `${event.homeScore.current} - ${event.awayScore.current} <span style="color:#ffcc00;">(${minute})</span>`;
          });
      } else if (event.status.type === "finished") {
        // Pindahkan ke container Match Ended
        const endedContainer = document.getElementById("endedMatches");
        if (endedContainer && matchBox.parentNode.id !== "endedMatches") {
          endedContainer.appendChild(matchBox);
          document.getElementById("status" + boxId).innerText = "Match Ended";
          document.getElementById("countdown" + boxId).innerText = "";
          document.getElementById("liveContainer" + boxId).classList.add("hidden");
          document.getElementById("countdown" + boxId).classList.remove("blink");
        }
      }
    });
}

// --- Fungsi Countdown Hari/Jam/Menit/Detik + LIVE NOW ---
function startCountdown(targetTime, boxId) {
  var countdownId = "countdown" + boxId;
  var statusId = "status" + boxId;

  var countdown = setInterval(function () {
    var now = new Date().getTime();
    var distance = targetTime - now;

    if (distance < 0) {
      clearInterval(countdown);
      var liveEl = document.getElementById(countdownId);
      liveEl.innerText = "🔴 LIVE NOW";
      liveEl.classList.add("blink");
      document.getElementById(statusId).innerText = "Kick Off";
      return;
    }

    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById(countdownId).innerText =
      (days > 0 ? days + " D -" : "") +
      hours + " H -" +
      minutes + " M -" +
      seconds + " S ";
  }, 1000);
}
