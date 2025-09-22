// --- Fungsi Utama Load Sofascore + Countdown ---
function loadSofaScore(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;

    fetch(eventUrl)
        .then(res => res.json())
        .then(data => {
            const event = data.event;
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
                    </span>
                `;
            }

            // Kickoff time (local timezone user)
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
                `${tanggal} | &#x26BD; ${jam}`;

            // Nama tim
            document.getElementById("teams" + boxId).innerText =
                home.name + " VS " + away.name;

            // Logo tim
            document.getElementById("logoHome" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
            document.getElementById("logoAway" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

            // Mulai countdown & monitor status
            startCountdown(kickoffDate.getTime(), boxId);
            monitorMatchStatus(matchId, boxId);
        })
        .catch(err => console.error("Load SofaScore error:", err));
}

// --- Fungsi Update Live Score & Menit Real-time ---
function monitorMatchStatus(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
    const matchBox = document.getElementById("match" + boxId);
    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchStatusEl = document.getElementById("matchStatus" + boxId);
    const finishedContainer = document.getElementById("finishedMatches");

    setInterval(async () => {
        try {
            const res = await fetch(eventUrl);
            const data = await res.json();
            const event = data.event;
            if (!event || !matchBox) return;

            // --- UPCOMING ---
            if (event.status.type === "notstarted" || event.status.type === "upcoming") {
                liveScoreEl.style.display = "none";
                matchStatusEl.style.display = "none";
                if (liveContainer) liveContainer.classList.add('hidden');
            }

            // --- IN PROGRESS ---
            if (event.status.type === "inprogress" && event.time) {
                if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

                if (countdownEl) countdownEl.innerHTML = "";
                if (liveContainer) {
                    liveContainer.classList.remove('hidden');
                    liveContainer.classList.add('blink');
                    liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";
                }

                // Skor
                const scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
                if (liveScoreEl) {
                    liveScoreEl.innerHTML = scoreText;
                    liveScoreEl.style.display = "block";
                }

                // Hitung menit realtime
                const initial = event.time.initial || 0; // biasanya 0, 45, 90
                const periodStart = event.time.currentPeriodStartTimestamp || 0;
                const nowSec = Math.floor(Date.now() / 1000);
                const elapsed = Math.floor((nowSec - periodStart) / 60);
                let minute = initial + elapsed;

                // Injury time
                if (event.time.injuryTime && minute >= initial) {
                    minute = `${initial}+${elapsed}`;
                }

                let desc = event.status.description || "LIVE";
                if (matchStatusEl) {
                    matchStatusEl.innerHTML = `${desc} - ${minute}'`;
                    matchStatusEl.style.display = "block";
                }
            }

            // --- HALF-TIME ---
            if (event.status.type === "halftime") {
                if (matchStatusEl) {
                    matchStatusEl.innerHTML = "HT";
                    matchStatusEl.style.display = "block";
                }
            }

            // --- FINISHED ---
            if (event.status.type === "finished") {
                if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

                if (countdownEl) countdownEl.innerHTML = "";
                if (liveContainer) {
                    liveContainer.classList.remove('blink');
                    liveContainer.style.animation = "none";
                    liveContainer.classList.remove('hidden');
                    liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";
                }

                const scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
                if (liveScoreEl) {
                    liveScoreEl.innerHTML = scoreText;
                    liveScoreEl.style.display = "block";
                }

                if (matchStatusEl) {
                    matchStatusEl.innerHTML = "FT";
                    matchStatusEl.style.display = "block";
                }

                if (finishedContainer && matchBox.parentNode !== finishedContainer) {
                    finishedContainer.appendChild(matchBox);
                }
            }
        } catch (e) {
            console.error("Error monitor match:", e);
        }
    }, 1000); // update tiap detik
}

// --- Fungsi Countdown ---
function startCountdown(targetTime, boxId) {
    const countdownId = "countdown" + boxId;
    window["countdown_" + boxId] = setInterval(function () {
        const now = new Date().getTime();
        const distance = targetTime - now;

        if (distance < 0) {
            clearInterval(window["countdown_" + boxId]);
            const countdownEl = document.getElementById(countdownId);
            if (countdownEl) countdownEl.innerHTML = "";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const countdownEl = document.getElementById(countdownId);
        if (countdownEl) {
            countdownEl.innerText =
                (days > 0 ? days + "D - " : "") +
                hours + "H - " +
                minutes + "M - " +
                seconds + "S";
        }
    }, 1000);
}
