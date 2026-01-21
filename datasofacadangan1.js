// --- Fungsi Utama Load Sofascore + Countdown ---
function loadSofaScore(matchId, boxId) {
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

            // Nama & logo liga
            const leagueEl = document.getElementById("league" + boxId);
            if (leagueEl) {
                leagueEl.innerHTML = `
                <span style="display:inline-flex;align-items:center;">
                  <img src="https://api.sofascore.app/api/v1/unique-tournament/${event.tournament.uniqueTournament.id}/image/dark"
                       alt="${event.tournament.name}"
                       style="height:18px;width:18px;margin-right:4px;">
                  <span>${event.tournament.name}</span>
                </span>`;
            }

            // Jadwal kickoff
            const kickoffDate = new Date(event.startTimestamp * 1000);
            const tanggal = kickoffDate.toLocaleDateString(undefined, {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            const jam = kickoffDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            document.getElementById("kickoff" + boxId).innerHTML =
                `${tanggal} | K.O ${jam}`;

            // Logo & nama tim (override fallback)
            document.getElementById("teamshome" + boxId).innerText = home.name;
            document.getElementById("teamsaway" + boxId).innerText = away.name;

            document.getElementById("logoHome" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
            document.getElementById("logoAway" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

            startCountdown(kickoffDate.getTime(), boxId);
            monitorMatchStatus(matchId, boxId);
        })
        .catch(err => {
            console.warn("⚠️ Sofascore gagal, pakai fallback team", err);
            // fallback sudah diisi dari renderMatch → tidak perlu apa-apa
        });
}

// --- Update Live Score & Status ---
function monitorMatchStatus(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchStatusEl = document.getElementById("matchStatus" + boxId);

    if (matchStatusEl && !matchStatusEl.textContent.trim()) {
        matchStatusEl.innerHTML = "UP COMING";
    }
    if (liveScoreEl && !liveScoreEl.textContent.trim()) {
        liveScoreEl.innerHTML = "VS";
    }

    const interval = setInterval(async () => {
        try {
            const res = await fetch(eventUrl);
            if (!res.ok) return;
            const data = await res.json();
            const event = data.event;
            if (!event) return;

            if (event.status.type === "inprogress") {
                if (window["countdown_" + boxId])
                    clearInterval(window["countdown_" + boxId]);

                countdownEl.innerHTML = "";
                liveContainer.classList.remove("hidden");
                liveContainer.innerHTML = "🔴 LIVE";

                liveScoreEl.innerHTML =
                    `${event.homeScore.current} - ${event.awayScore.current}`;
                matchStatusEl.innerHTML = event.status.description || "LIVE";
            }

            if (event.status.type === "finished") {
                clearInterval(interval);
                liveContainer.innerHTML = "⛔ MATCH ENDED";
                liveScoreEl.innerHTML =
                    `${event.homeScore.current} - ${event.awayScore.current}`;
                matchStatusEl.innerHTML = "Full Time";
            }
        } catch (e) {}
    }, 3000);
}

// --- Countdown ---
function startCountdown(targetTime, boxId) {
    window["countdown_" + boxId] = setInterval(() => {
        const now = Date.now();
        const distance = targetTime - now;

        if (distance <= 0) {
            clearInterval(window["countdown_" + boxId]);
            document.getElementById("countdown" + boxId).innerHTML = "";
            return;
        }

        const h = Math.floor(distance / 3600000);
        const m = Math.floor((distance % 3600000) / 60000);
        const s = Math.floor((distance % 60000) / 1000);

        document.getElementById("countdown" + boxId).innerText =
            `${h}H - ${m}M - ${s}S`;
    }, 1000);
}
