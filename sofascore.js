function loadSofaScore(matchId, boxId) {
  const eventUrl = "https://api.sofascore.com/api/v1/event/" + matchId;

  // ambil detail pertandingan
  fetch(eventUrl)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      const home = event.homeTeam;
      const away = event.awayTeam;

      // nama liga
      document.getElementById("league" + boxId).innerText = event.tournament.name;

      // jadwal kickoff
      let date = new Date(event.startTimestamp * 1000);
      document.getElementById("kickoff" + boxId).innerText =
        date.toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric"}) +
        " | K.O " + date.toLocaleTimeString("id-ID", {hour:"2-digit", minute:"2-digit"});

      // nama tim
      document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;

      // logo tim
      document.getElementById("logoHome" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
      document.getElementById("logoAway" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + away.id + "/image";
    });

  // update live score
  function updateLive() {
    fetch(eventUrl)
      .then(res => res.json())
      .then(data => {
        const event = data.event;
        let scoreBox = document.getElementById("liveScore" + boxId);

        if (event.status.type === "inprogress") {
          document.getElementById("liveContainer" + boxId).classList.remove("hidden");
          scoreBox.innerText =
            event.homeScore.current + " - " + event.awayScore.current +
            " (" + (event.time?.current ? event.time.current + "'" : "") + ")";
        } else if (event.status.type === "finished") {
          scoreBox.innerText =
            event.homeScore.current + " - " + event.awayScore.current + " (FT)";
        } else {
          scoreBox.innerText = "Belum mulai";
        }
      });
  }

  updateLive(); // pertama kali
  setInterval(updateLive, 20000); // refresh tiap 20 detik
}
