// --- Fungsi Utama Load Sofascore + Countdown ---
function loadSofaScore(matchId, boxId) {
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

      // Jadwal kickoff
      let kickoffDate = new Date(event.startTimestamp * 1000);
      document.getElementById("kickoff" + boxId).innerText =
        kickoffDate.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) +
        " | K.O " + kickoffDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

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
                // Cari incident terbaru yang ada minute
                let latest = timeline.incidents.find(i => i.time && i.time.minute);
                if (latest) {
                  minute = latest.time.minute + "'";
                }
              }

              // Kalau ga ada, fallback ke status description
              if (!minute && event.status.description) {
                minute = event.status.description;
              }

              // Tampilkan skor + menit
              document.getElementById("liveScore" + boxId).innerHTML =
                `${event.homeScore.current} - ${event.awayScore.current} <span style="color:#ffcc00;">(${minute})</span>`;
            });
        }
      });
  }

  updateLive();                  // pertama kali
  setInterval(updateLive, 20000); // refresh tiap 20 detik
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
      document.getElementById(countdownId).innerText = "LIVE!";
      document.getElementById(statusId).innerText = "Status: LIVE";
      return;
    }

    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById(countdownId).innerText =
      (days > 0 ? days + "D " : "") +
      hours + "H " +
      minutes + "M " +
      seconds + "S";
  }, 1000);
}
