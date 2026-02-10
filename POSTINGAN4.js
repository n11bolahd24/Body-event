// --- Fungsi Utama Load Sofascore + Fallback Lengkap ---
function loadSofaScore(matchId, boxId, fallback = {}) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;

    fetch(eventUrl)
        .then(res => {
            if (!res.ok) throw new Error("Sofascore blocked");
            return res.json();
        })
        .then(data => {
            const event = data.event;
            if (!event) throw new Error("No event");

            const home = event.homeTeam;
            const away = event.awayTeam;

            // ===== LEAGUE =====
            const leagueEl = document.getElementById("league" + boxId);
            if (leagueEl) {
                leagueEl.innerHTML = `
                <span style="display:inline-flex;align-items:center;">
                  <img src="https://api.sofascore.app/api/v1/unique-tournament/${event.tournament.uniqueTournament.id}/image/dark"
                       style="height:18px;width:18px;margin-right:4px;">
                  <span>${event.tournament.name}</span>
                </span>`;
            }

            // ===== KICKOFF =====
            const kickoffDate = new Date(event.startTimestamp * 1000);
            const tanggal = kickoffDate.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            });
            const jam = kickoffDate.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            });

            document.getElementById("kickoff" + boxId).innerHTML =
                `${tanggal} | K.O ${jam}`;

            // ===== TEAM + LOGO =====
            document.getElementById("teamshome" + boxId).innerText = home.name;
            document.getElementById("teamsaway" + boxId).innerText = away.name;

            document.getElementById("logoHome" + boxId).src =
                `https://api.sofascore.app/api/v1/team/${home.id}/image`;
            document.getElementById("logoAway" + boxId).src =
                `https://api.sofascore.app/api/v1/team/${away.id}/image`;

            // ===== COUNTDOWN + LIVE =====
            startCountdown(kickoffDate.getTime(), boxId);
            monitorMatchStatus(matchId, boxId);
        })
        .catch(err => {
            console.warn("⚠️ Sofascore gagal → fallback aktif", err);

            // ===== FALLBACK TEAM =====
            if (fallback.home)
                document.getElementById("teamshome" + boxId).innerText = fallback.home;
            if (fallback.away)
                document.getElementById("teamsaway" + boxId).innerText = fallback.away;

            // ===== FALLBACK LEAGUE =====
            if (fallback.league)
                document.getElementById("league" + boxId).innerHTML = fallback.league;

            // ===== FALLBACK KICKOFF =====
            if (fallback.kickoffText)
                document.getElementById("kickoff" + boxId).innerHTML = fallback.kickoffText;

            // ===== FALLBACK COUNTDOWN =====
            if (fallback.kickoffTime)
                startCountdown(fallback.kickoffTime, boxId);
        });
}
// --- Countdown ---
function startCountdown(targetTime, boxId) {
    if (window["countdown_" + boxId])
        clearInterval(window["countdown_" + boxId]);

    window["countdown_" + boxId] = setInterval(() => {
        const now = Date.now();
        const distance = targetTime - now;

        if (distance <= 0) {
            clearInterval(window["countdown_" + boxId]);
            document.getElementById("countdown" + boxId).innerHTML =
                "<span style='color:red;font-weight:bold;'>LIVE</span>";
            return;
        }

        const h = Math.floor(distance / 3600000);
        const m = Math.floor((distance % 3600000) / 60000);
        const s = Math.floor((distance % 60000) / 1000);

        document.getElementById("countdown" + boxId).innerText =
            `${h}H - ${m}M - ${s}S`;
    }, 1000);
}

