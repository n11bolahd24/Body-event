// --- Fungsi untuk memindahkan kotak ke Finished Matches ---
function moveToFinished(boxId) {
  const matchBox = document.getElementById("match" + boxId);
  const finishedContainer = document.getElementById("finishedMatches");
  if (!matchBox || !finishedContainer) return;

  finishedContainer.appendChild(matchBox);

  const liveContainer = document.getElementById("liveContainer" + boxId);
  const countdownEl = document.getElementById("countdown" + boxId);
  const statusEl = document.getElementById("status" + boxId);

  countdownEl.innerText = "";
  liveContainer.innerHTML = "<strong style='color:gray;'>⛔ MATCH ENDED ⛛</strong>";
  statusEl.innerText = "Match Ended";
}

// --- Fungsi Countdown ---
function startCountdown(targetTime, boxId) {
  const countdownId = "countdown" + boxId;
  const statusId = "status" + boxId;

  const countdownInterval = setInterval(() => {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance <= 0) {
      clearInterval(countdownInterval);
      const liveEl = document.getElementById(countdownId);
      liveEl.innerText = "🔴 LIVE NOW";
      liveEl.classList.add("blink");
      document.getElementById(statusId).innerText = "Kick Off";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById(countdownId).innerText =
      (days > 0 ? days + "D " : "") +
      hours + "H - " +
      minutes + "M - " +
      seconds + "S";
  }, 1000);
}

// --- Fungsi Live Update + pindah jika match selesai ---
function startLiveUpdate(matchId, boxId) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const timelineUrl = `https://api.sofascore.com/api/v1/event/${matchId}/timeline`;

  // Cek setiap 10 detik
  setInterval(() => {
    fetch(eventUrl)
      .then(res => res.json())
      .then(data => {
        const event = data.event;
        if (!event) return;

        const liveContainer = document.getElementById("liveContainer" + boxId);
        const statusEl = document.getElementById("status" + boxId);
        const countdownEl = document.getElementById("countdown" + boxId);

        // Jika match selesai langsung pindah ke finished
        if (event.status.type === "finished") {
          moveToFinished(boxId);
          return;
        }

        // Jika live, update score
        if (event.status.type === "inprogress") {
          liveContainer.classList.remove("hidden");
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
        }
      });
  }, 10000);
}

// --- Fungsi utama loadSofaScore ---
function loadSofaScore(matchId, boxId, region = "Asia/Jakarta") {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;

  fetch(eventUrl)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      if (!event) return;

      // Jika sudah selesai → langsung pindah
      if (event.status.type === "finished") {
        moveToFinished(boxId);
        return;
      }

      // Nama liga
      document.getElementById("league" + boxId).innerText = event.tournament.name;

      // Jadwal kickoff
      let kickoffDate = new Date(event.startTimestamp * 1000);
      let options = {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: region
      };
      let kickoffString = new Intl.DateTimeFormat("id-ID", options).format(kickoffDate);

      let regionAbbr = "WIB";
      if (region === "Asia/Makassar") regionAbbr = "WITA";
      if (region === "Asia/Jayapura") regionAbbr = "WIT";

      document.getElementById("kickoff" + boxId).innerText = kickoffString + " " + regionAbbr;

      // Nama tim
      document.getElementById("teams" + boxId).innerText =
        event.homeTeam.name + " VS " + event.awayTeam.name;

      // Logo tim
      document.getElementById("logoHome" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + event.homeTeam.id + "/image";
      document.getElementById("logoAway" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + event.awayTeam.id + "/image";

      // Mulai countdown dan live update
      startCountdown(event.startTimestamp * 1000, boxId);
      startLiveUpdate(matchId, boxId);
    });
}

// --- Contoh panggil fungsi ---
window.addEventListener("DOMContentLoaded", function() {
  loadSofaScore(14566664, "7"); // ganti ID sesuai pertandingan
});
