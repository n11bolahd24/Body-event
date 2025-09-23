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

            // Jadwal kickoff
            const kickoffDate = new Date(event.startTimestamp * 1000);
            const tanggal = kickoffDate.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' });
            const jam = kickoffDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' });
            document.getElementById("kickoff" + boxId).innerHTML = `${tanggal} | K.O ${jam}`;

            // Nama tim
            document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;

            // Logo tim
            document.getElementById("logoHome" + boxId).src = "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
            document.getElementById("logoAway" + boxId).src = "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

            // Countdown & monitor status
            startCountdown(kickoffDate.getTime(), boxId);
            monitorMatchStatusRealtime(matchId, boxId, kickoffDate.getTime());
        });
}

// --- Fungsi Update Live Score & Menit Real-Time ---
function monitorMatchStatusRealtime(matchId, boxId, kickoffTime) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
    const matchBox = document.getElementById("match" + boxId);
    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchStatusEl = document.getElementById("matchStatus" + boxId);
    const finishedContainer = document.getElementById("finishedMatches");

    let currentMinute = 0;
    let minuteInterval;

    const fetchInterval = setInterval(async () => {
        const res = await fetch(eventUrl);
        const data = await res.json();
        const event = data.event;
        if (!event || !matchBox || !matchStatusEl) return;

        // --- upcoming ---
        if (event.status.type === "upcoming") {
            liveScoreEl.style.display = "none";
            matchStatusEl.style.display = "none";
            liveContainer.classList.add('hidden');
            if (minuteInterval) clearInterval(minuteInterval);
        }

        // --- inprogress ---
        if (event.status.type === "inprogress") {
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('hidden');
            liveContainer.classList.add('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";

            // Skor utama
            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            if (event.homeScore.halfTime !== undefined && event.awayScore.halfTime !== undefined) {
                scoreText += ` (HT: ${event.homeScore.halfTime}-${event.awayScore.halfTime})`;
            }
            if (event.homeScore.penalty !== undefined && event.awayScore.penalty !== undefined) {
                scoreText += ` [P: ${event.homeScore.penalty}-${event.awayScore.penalty}]`;
            }
            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";

            // Menit real-time
            currentMinute = event.stats && event.stats.minute ? event.stats.minute : currentMinute;

            if (!minuteInterval) {
                minuteInterval = setInterval(() => {
                    if (!matchStatusEl) return;

                    let displayMinute = currentMinute;
                    // Extra time / injury time
                    if (currentMinute > 45 && event.status.description.includes("1st")) displayMinute = `45+${currentMinute-45}`;
                    if (currentMinute > 90 && event.status.description.includes("2nd")) displayMinute = `90+${currentMinute-90}`;

                    matchStatusEl.innerHTML = `${event.status.description || "In Progress"} (${displayMinute}')`;
                    currentMinute += 1;
                }, 1000); // update tiap 1 detik
            }
        }

        // --- finished ---
        if (event.status.type === "finished") {
            clearInterval(fetchInterval);
            if (minuteInterval) clearInterval(minuteInterval);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('blink');
            liveContainer.style.animation = "none";
            liveContainer.classList.remove('hidden');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            if (event.homeScore.halfTime !== undefined && event.awayScore.halfTime !== undefined) {
                scoreText += ` (HT: ${event.homeScore.halfTime}-${event.awayScore.halfTime})`;
            }
            if (event.homeScore.penalty !== undefined && event.awayScore.penalty !== undefined) {
                scoreText += ` [P: ${event.homeScore.penalty}-${event.awayScore.penalty}]`;
            }

            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";
            matchStatusEl.innerHTML = "Full Time";

            if (finishedContainer && matchBox.parentNode !== finishedContainer) {
                finishedContainer.appendChild(matchBox);
            }
        }

    }, 3000); // fetch API tiap 3 detik
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
            countdownEl.innerHTML = "";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById(countdownId).innerText =
            (days > 0 ? days + "D - " : "") +
            hours + "H - " +
            minutes + "M - " +
            seconds + "S";
    }, 1000);
}
