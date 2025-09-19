// --- Fungsi Utama Load Sofascore + Countdown ---
function loadSofaScore(matchId, boxId, region = "Asia/Jakarta") {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const timelineUrl = `https://api.sofascore.com/api/v1/event/${matchId}/timeline`;

  // --- Ambil detail pertandingan ---
  fetch(eventUrl)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      const home = event.homeTeam;
      const away = event.awayTeam;

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

      // Tambahkan kode zona waktu (contoh WIB/WITA/WIT)
      let regionAbbr = "WIB"; // default Asia/Jakarta
      if (region === "Asia/Makassar") regionAbbr = "WITA";
      if (region === "Asia/Jayapura") regionAbbr = "WIT";

      document.getElementById("kickoff" + boxId).innerText =
        kickoffString + " " + regionAbbr;

      // Nama tim
      document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;

      // Logo tim
      document.getElementById("logoHome" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
      document.getElementById("logoAway" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

      // Mulai countdown
      startCountdown(kickoffDate.getTime(), boxId);
    });

  // --- Fungsi Update Live Score ---
  function updateLive() {
    fetch(eventUrl)
      .then(res => res.json())
      .then(data => {
        const event = data.event;

        if (event.status.type === "inprogress") {
          document.getElementById("liveContainer" + boxId).classList.remove("hidden");

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
  }

  updateLive();
  setInterval(updateLive, 20000);
}

// --- Fungsi Countdown dengan Hari/Jam/Menit/Detik ---
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
    liveEl.classList.add("blink"); // tambahkan class blink
    document.getElementById(statusId).innerText = "Kick Off";
    return;
  }

    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById(countdownId).innerText =
      (days > 0 ? days + "D " : "") +
      hours + "H - " +
      minutes + "M - " +
      seconds + "S";
  }, 1000);
}
