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
      let date = new Date(event.startTimestamp * 1000);
      document.getElementById("kickoff" + boxId).innerText =
        date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) +
        " | K.O " + date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

      // Nama tim
      document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;

      // Logo tim
      document.getElementById("logoHome" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
      document.getElementById("logoAway" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + away.id + "/image";
    });

  // --- Update Live Score + Menit ---
  function updateLive() {
    fetch(eventUrl)
      .then(res => res.json())
      .then(data => {
        const event = data.event;
        if (event.status.type === "inprogress") {
          document.getElementById("liveContainer" + boxId).classList.remove("hidden");

          // Ambil menit terbaru dari timeline
          fetch(timelineUrl)
            .then(res => res.json())
            .then(timeline => {
              let minute = "";
              if (timeline.incidents && timeline.incidents.length > 0) {
                let last = timeline.incidents[0]; // incident terbaru
                if (last.time && last.time.minute) {
                  minute = `${last.time.minute}'`;
                }
              }

              // Tampilkan score + menit
              document.getElementById("liveScore" + boxId).innerHTML =
                `${event.homeScore.current} - ${event.awayScore.current} <span style="color:#ffcc00;">(${minute || event.status.description})</span>`;
            });
        }
      });
  }

  updateLive();                  // pertama kali
  setInterval(updateLive, 20000); // refresh tiap 20 detik
}
