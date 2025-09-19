// Fungsi untuk memindahkan kotak pertandingan ke bawah
function moveToFinished(matchId, boxId) {
  const matchBox = document.getElementById("match" + boxId);
  const finishedContainer = document.getElementById("finishedMatches");
  finishedContainer.appendChild(matchBox);
  const liveContainer = document.getElementById("liveContainer" + boxId);
  const statusEl = document.getElementById("status" + boxId);
  const countdownEl = document.getElementById("countdown" + boxId);

  liveContainer.innerHTML = "<strong style='color:gray;'>⛔ MATCH ENDED ⛛</strong>";
  countdownEl.innerText = "";
  statusEl.innerText = "Match Ended";
}

// Fungsi untuk memulai countdown
function startCountdownForMatch(targetTime, boxId) {
  const countdownId = "countdown" + boxId;
  const statusId = "status" + boxId;

  const countdownInterval = setInterval(() => {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance < 0) {
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

// Fungsi untuk memulai live update
function startLiveUpdate(matchId, boxId) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const timelineUrl = `https://api.sofascore.com/api/v1/event/${matchId}/timeline`;
  const matchBox = document.getElementById("match" + boxId);
  const finishedContainer = document.getElementById("finishedMatches");

  setInterval(() => {
    fetch(eventUrl)
      .then(res => res.json())
      .then(data => {
        const event = data.event;
        if (!event) return;

        const liveContainer = document.getElementById("liveContainer" + boxId);
        const statusEl = document.getElementById("status" + boxId);
        const countdownEl = document.getElementById("countdown" + boxId);

        if (event.status.type === "finished") {
          // Pindahkan ke finishedMatches saat selesai
          finishedContainer.appendChild(matchBox);
          liveContainer.innerHTML = "<strong style='color:gray;'>⛔ MATCH ENDED ⛛</strong>";
          countdownEl.innerText = "";
          statusEl.innerText = "Match Ended";
          return;
        }

        // Update live score jika in progress
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
  }, 1000); // cek setiap 1 detik
}

// Fungsi utama untuk load SofaScore
function loadSofaScore(matchId, boxId, region = "Asia/Jakarta") {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const timelineUrl = `https://api.sofascore.com/api/v1/event/${matchId}/timeline`;
  const matchBox = document.getElementById("match" + boxId);
  const finishedContainer = document.getElementById("finishedMatches");

  // Fetch status match saat page load
  fetch(eventUrl)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      if (!event) return;

      const liveContainer = document.getElementById("liveContainer" + boxId);
      const statusEl = document.getElementById("status" + boxId);
      const countdownEl = document.getElementById("countdown" + boxId);

      if (event.status.type === "finished") {
        // Langsung pindah ke finishedMatches
        finishedContainer.appendChild(matchBox);
        liveContainer.innerHTML = "<strong style='color:gray;'>⛔ MATCH ENDED ⛛</strong>";
        countdownEl.innerText = "";
        statusEl.innerText = "Match Ended";
        return;
      }

      // Nama liga
      document.getElementById("league" + boxId).innerText = event.tournament.name;

      // Jadwal kickoff dengan regional
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

      let regionAbbr = "WIB"; // default Asia/Jakarta
      if (region === "Asia/Makassar") regionAbbr = "WITA";
      if (region === "Asia/Jayapura") regionAbbr = "WIT";

      document.getElementById("kickoff" + boxId).innerText =
        kickoffString + " " + regionAbbr;

      // Nama tim
      document.getElementById("teams" + boxId).innerText =
        event.homeTeam.name + " VS " + event.awayTeam.name;

      // Logo tim
      document.getElementById("logoHome" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + event.homeTeam.id + "/image";
      document.getElementById("logoAway" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + event.awayTeam.id + "/image";

      // Mulai countdown & live update
      startCountdownForMatch(event.startTimestamp * 1000, boxId);
      startLiveUpdate(matchId, boxId);
    });
}

// Contoh pemanggilan fungsi
loadSofaScore(14566664, "7");
