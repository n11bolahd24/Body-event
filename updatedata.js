 // === CONFIG API (ANTI BLOCK) ===
const SOFA_PROXY = "https://cors.isomorphic-git.org/";
const SOFA_API = "https://api.sofascore.app/api/v1/event/";

// --- Fungsi Utama Load Sofascore + Countdown ---
function loadSofaScore(matchId, boxId) {
    const eventUrl = SOFA_PROXY + SOFA_API + matchId;

    fetch(eventUrl, {
        cache: "no-store",
        headers: { accept: "application/json" }
    })
    .then(res => {
        if (!res.ok) throw new Error("Sofascore blocked");
        return res.json();
    })
    .then(data => {
        const event = data.event;
        if (!event) throw new Error("No event");

        const home = event.homeTeam;
        const away = event.awayTeam;

        // Liga
        const leagueEl = document.getElementById("league" + boxId);
        if (leagueEl && event.tournament?.uniqueTournament) {
            leagueEl.innerHTML = `
            <span style="display:inline-flex;align-items:center;">
              <img src="https://api.sofascore.app/api/v1/unique-tournament/${event.tournament.uniqueTournament.id}/image/dark"
                   style="height:18px;width:18px;margin-right:4px;">
              <span>${event.tournament.name}</span>
            </span>`;
        }

        // Kickoff
        const kickoffDate = new Date(event.startTimestamp * 1000);
        document.getElementById("kickoff" + boxId).innerHTML =
            kickoffDate.toLocaleDateString(undefined, {
                day: "2-digit", month: "long", year: "numeric"
            }) + " | K.O " +
            kickoffDate.toLocaleTimeString(undefined, {
                hour: "2-digit", minute: "2-digit", hour12: false
            });

        // Team & logo
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
        console.warn("⚠️ SofaScore fallback aktif", err);
    });
}

// --- Update Live Score & Status ---
function monitorMatchStatus(matchId, boxId) {
    const eventUrl = SOFA_PROXY + SOFA_API + matchId;

    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchStatusEl = document.getElementById("matchStatus" + boxId);

    let matchFinished = false;

    const interval = setInterval(async () => {
        if (matchFinished) return;

        try {
            const res = await fetch(eventUrl, {
                cache: "no-store",
                headers: { accept: "application/json" }
            });
            if (!res.ok) return;

            const data = await res.json();
            const event = data.event;
            if (!event) return;

            const status = event.status.type;

            // UPCOMING
            if (status === "upcoming") {
                liveContainer.classList.add("hidden");
                liveScoreEl.innerHTML = "VS";
                matchStatusEl.innerHTML = "UP COMING";
            }

            // LIVE
            else if (status === "inprogress" || status === "penalties") {
                clearInterval(window["countdown_" + boxId]);
                countdownEl.innerHTML = "";

                liveContainer.classList.remove("hidden", "blink");
                void liveContainer.offsetWidth;
                liveContainer.classList.add("blink");
                liveContainer.innerHTML =
                    "<strong style='color:white;-webkit-text-stroke:.2px black;'>🔴 LIVE NOW 🔥</strong>";

                let score = `${event.homeScore.current} - ${event.awayScore.current}`;
                if (event.homeScore.penalties !== undefined) {
                    score += ` <span style="font-size:12px;">(P: ${event.homeScore.penalties} - ${event.awayScore.penalties})</span>`;
                }
                liveScoreEl.innerHTML = score;

                let statusText = event.status.description || "LIVE";
                if (event.time?.currentPeriodStartTimestamp) {
                    const start = event.time.currentPeriodStartTimestamp * 1000;
                    const min = Math.floor((Date.now() - start) / 60000);
                    statusText = `${min}'`;
                }
                matchStatusEl.innerHTML = statusText;
            }

            // FINISHED
            else if (status === "finished") {
                matchFinished = true;
                clearInterval(interval);

                liveContainer.classList.remove("blink", "hidden");
                liveContainer.innerHTML =
                    "<strong style='color:white;-webkit-text-stroke:.2px black;'>⛔ MATCH ENDED ⛔</strong>";

                let finalScore = `${event.homeScore.current} - ${event.awayScore.current}`;
                if (event.homeScore.penalties !== undefined) {
                    finalScore += ` <span style="font-size:12px;">(P: ${event.homeScore.penalties} - ${event.awayScore.penalties})</span>`;
                }

                liveScoreEl.innerHTML = finalScore;
                matchStatusEl.innerHTML = "Full Time";
            }

        } catch (e) {
            console.warn("monitor error", e);
        }
    }, 10000); // 🔥 dari 3s → 10s (anti block)
}

// --- Countdown ---
function startCountdown(targetTime, boxId) {
    window["countdown_" + boxId] = setInterval(() => {
        const d = targetTime - Date.now();
        if (d <= 0) {
            clearInterval(window["countdown_" + boxId]);
            document.getElementById("countdown" + boxId).innerHTML = "";
            return;
        }
        document.getElementById("countdown" + boxId).innerText =
            `${Math.floor(d / 3600000)}H - ${Math.floor(d / 60000) % 60}M - ${Math.floor(d / 1000) % 60}S`;
    }, 1000);
}
