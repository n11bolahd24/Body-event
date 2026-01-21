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

    let matchFinished = false; // 🔐 LOCK STATE

    const interval = setInterval(async () => {
        if (matchFinished) return;

        try {
            const res = await fetch(eventUrl);
            if (!res.ok) return;

            const data = await res.json();
            const event = data.event;
            if (!event) return;

            const status = event.status.type;

            /* ================= UPCOMING ================= */
            if (status === "upcoming") {
                liveContainer.classList.remove("blink");
                liveContainer.style.animation = "none";
                liveContainer.classList.add("hidden");
                liveScoreEl.innerHTML = "VS";
                matchStatusEl.innerHTML = "UP COMING";
                return;
            }

            /* ================= LIVE ================= */
            if (status === "inprogress" || status === "penalties") {
                if (window["countdown_" + boxId])
                    clearInterval(window["countdown_" + boxId]);

                countdownEl.innerHTML = "";

                liveContainer.classList.remove("hidden");
                liveContainer.classList.remove("blink");
                void liveContainer.offsetWidth; // reset animation
                liveContainer.classList.add("blink");

                liveContainer.innerHTML =
                    "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW</strong>";

                // skor
                let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
                if (
                    event.homeScore.penalties !== undefined &&
                    event.awayScore.penalties !== undefined
                ) {
                    scoreText +=
                        ` <span style="font-size:12px;">(P: ${event.homeScore.penalties} - ${event.awayScore.penalties})</span>`;
                }
                liveScoreEl.innerHTML = scoreText;

// status menit 
let statusText = "";
if (status === "penalties") {
    statusText = "PENALTIES";
} else if (event.time && event.time.currentPeriodStartTimestamp) {
    const startTs = event.time.currentPeriodStartTimestamp * 1000;
    const elapsed = Math.floor((Date.now() - startTs) / 60000);

    switch (event.status.description) {
        case "1st half":
            statusText = elapsed >= 45 ? "Half Time" : `${elapsed}'`;
            break;

        case "Halftime":
            statusText = "Half Time";
            break;

        case "2nd half":
            statusText = elapsed + 45 >= 90 ? "90+'" : `${elapsed + 45}'`;
            break;

        case "1st extra":
            statusText = `${90 + elapsed}'`;
            break;

        case "2nd extra":
            statusText = `${105 + elapsed}'`;
            break;

        default:
            statusText = "LIVE";
    }
}

matchStatusEl.innerHTML = statusText;
return;
}
            /* ================= FINISHED ================= */
            if (status === "finished") {

    // 🔽 TENTUKAN CONTAINER (sesuai logic lama kamu)
    const matchBox = document.getElementById("match" + boxId);
    const finishedContainer = document.getElementById(
        boxId < 100 ? "finishedMatches1" : "finishedMatches2"
    );

    // 🔽 PINDAHKAN MATCH (SEKALI SAJA)
    if (finishedContainer && matchBox && matchBox.parentNode !== finishedContainer) {
        finishedContainer.appendChild(matchBox);
    }

    // 🔒 LOCK STATE SETELAH PINDAH
    matchFinished = true;

    clearInterval(interval);
    if (window["countdown_" + boxId])
        clearInterval(window["countdown_" + boxId]);

    liveContainer.classList.remove("blink");
    liveContainer.style.animation = "none";
    liveContainer.classList.remove("hidden");

    liveContainer.innerHTML =
        "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

    let finalScore = `${event.homeScore.current} - ${event.awayScore.current}`;
    if (
        event.homeScore.penalties !== undefined &&
        event.awayScore.penalties !== undefined
    ) {
        finalScore +=
            ` <span style="font-size:12px;">(P: ${event.homeScore.penalties} - ${event.awayScore.penalties})</span>`;
    }

    liveScoreEl.innerHTML = finalScore;
    matchStatusEl.innerHTML = "Full Time";
}
        } catch (e) {
            console.warn("monitor error", e);
        }
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
