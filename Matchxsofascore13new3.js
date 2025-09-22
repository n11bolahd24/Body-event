// --- Matchxsofascore13.js ---
// Ambil data Sofascore + countdown + menit realtime

// Hitung menit berjalan realtime
function getLiveMinute(event) {
    if (event.status.type === "inprogress" && event.time) {
        const now = Math.floor(Date.now() / 1000);
        const elapsed = Math.floor((now - event.time.currentPeriodStartTimestamp) / 60);

        let minute = 0;

        if (event.time.currentPeriod === "1st") {
            minute = elapsed;
            return minute >= 45 ? "45+" + (minute - 45) + "'" : minute + "'";
        }

        if (event.time.currentPeriod === "2nd") {
            minute = 45 + elapsed;
            return minute >= 90 ? "90+" + (minute - 90) + "'" : minute + "'";
        }

        if (event.time.currentPeriod === "OT") {
            minute = 90 + elapsed;
            return minute >= 120 ? "120+" + (minute - 120) + "'" : minute + "'";
        }

        return elapsed + "'";
    }

    if (event.status.type === "notstarted") {
        return "K.O " + new Date(event.startTimestamp * 1000).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
    }

    if (event.status.type === "halftime") return "HT";
    if (event.status.type === "finished") return "FT";

    return "";
}

// Countdown sebelum pertandingan dimulai
function startCountdown(targetTime, elId) {
    const el = document.getElementById(elId);
    if (!el) return;

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetTime - now;

        if (distance < 0) {
            clearInterval(interval);
            el.innerHTML = "";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        el.innerHTML = (days > 0 ? days + "D " : "") + hours + "H " + minutes + "M " + seconds + "S";
    }, 1000);
}

// Render box pertandingan
function renderMatchBox(event, boxId) {
    const box = document.getElementById("match" + boxId);
    if (!box) return;

    const minute = getLiveMinute(event);

    box.innerHTML = `
      <div style="color:white; text-align:center; font-weight:bold;">
        <div id="league${boxId}" style="margin-bottom:4px;">
          <img src="https://api.sofascore.app/api/v1/unique-tournament/${event.tournament.uniqueTournament.id}/image/dark"
               style="height:18px;vertical-align:middle;margin-right:4px;">
          ${event.tournament.name}
        </div>

        <div>
          <img id="logoHome${boxId}" src="https://api.sofascore.app/api/v1/team/${event.homeTeam.id}/image"
               style="height:22px;vertical-align:middle;"> 
          ${event.homeTeam.shortName} 
          <span id="liveScore${boxId}">${event.homeScore.current} - ${event.awayScore.current}</span> 
          ${event.awayTeam.shortName} 
          <img id="logoAway${boxId}" src="https://api.sofascore.app/api/v1/team/${event.awayTeam.id}/image"
               style="height:22px;vertical-align:middle;">
        </div>

        <div id="status${boxId}" style="font-size:12px; color:#FFD700; margin-top:2px;">
          ${minute}
        </div>

        <div id="countdown${boxId}" style="font-size:11px; color:#ccc; margin-top:2px;"></div>
      </div>
    `;

    // countdown hanya muncul kalau status upcoming
    if (event.status.type === "notstarted") {
        startCountdown(event.startTimestamp * 1000, "countdown" + boxId);
    }
}

// Update realtime setiap 3 detik (ambil API lagi)
function monitorMatch(matchId, boxId) {
    const url = `https://api.sofascore.app/api/v1/event/${matchId}`;
    const interval = setInterval(async () => {
        const res = await fetch(url);
        const data = await res.json();
        const event = data.event;
        if (!event) return;
        renderMatchBox(event, boxId);

        if (event.status.type === "finished") clearInterval(interval);
    }, 3000);
}

// Fungsi utama
function loadSofaScore(matchId, boxId) {
    const url = `https://api.sofascore.app/api/v1/event/${matchId}`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const event = data.event;
            renderMatchBox(event, boxId);
            monitorMatch(matchId, boxId);
        });
}
  
