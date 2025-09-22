// --- Script Sofascore dengan menit realtime ---

// Fungsi hitung menit live realtime
function getLiveMinute(event) {
  if (event.status.type === "inprogress" && event.time) {
    const now = Math.floor(Date.now() / 1000);
    const elapsed = Math.floor((now - event.time.currentPeriodStartTimestamp) / 60);

    let minute = 0;

    if (event.time.currentPeriod === "1st") {
      minute = elapsed;
      if (minute > 45) {
        return "45+" + (minute - 45) + "'";
      }
      return minute + "'";
    }

    if (event.time.currentPeriod === "2nd") {
      minute = 45 + elapsed;
      if (minute > 90) {
        return "90+" + (minute - 90) + "'";
      }
      return minute + "'";
    }

    if (event.time.currentPeriod === "OT") {
      minute = 90 + elapsed;
      if (minute > 120) {
        return "120+" + (minute - 120) + "'";
      }
      return minute + "'";
    }

    return elapsed + "'";
  }
  return "";
}

// Render kotak pertandingan
function renderMatchBox(event, containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;

  const liveMinute = getLiveMinute(event);

  box.innerHTML = `
    <div style="color:white; font-weight:bold; text-align:center;">
      <img src="https://api.sofascore.app/api/v1/team/${event.homeTeam.id}/image" style="height:20px;"> 
      ${event.homeTeam.shortName} ${event.homeScore.current} - ${event.awayScore.current} ${event.awayTeam.shortName} 
      <img src="https://api.sofascore.app/api/v1/team/${event.awayTeam.id}/image" style="height:20px;">
      <br>
      <span style="font-size:12px; color:#FFD700;">${liveMinute}</span>
    </div>
  `;
}

// Supaya update terus per detik
function startLiveUpdater(event, containerId) {
  renderMatchBox(event, containerId);
  setInterval(() => {
    renderMatchBox(event, containerId);
  }, 1000);
}

// Contoh: ambil data dari Sofascore API lalu panggil updater
function loadSofaScore(matchId, containerId) {
  fetch(`https://api.sofascore.app/api/v1/event/${matchId}`)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      startLiveUpdater(event, containerId);
    })
    .catch(err => console.error("Gagal ambil data:", err));
}
