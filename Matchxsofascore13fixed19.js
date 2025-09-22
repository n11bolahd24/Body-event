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

            // Jadwal kickoff otomatis zona waktu pengunjung
            const kickoffDate = new Date(event.startTimestamp * 1000);
            const tanggal = kickoffDate.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' });
            const jam = kickoffDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' });

            document.getElementById("kickoff" + boxId).innerHTML = `${tanggal} | K.O ${jam}`;

            // Nama tim
            document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;

            // Logo tim
            document.getElementById("logoHome" + boxId).src = "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
            document.getElementById("logoAway" + boxId).src = "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

            // Mulai countdown & monitor status
            startCountdown(kickoffDate.getTime(), boxId);
            monitorMatchStatus(matchId, boxId, kickoffDate.getTime());
        });
}

// --- Fungsi Countdown ---
function startCountdown(targetTime, boxId) {
    const countdownId = "countdown" + boxId;
    window["countdown_" + boxId] = setInterval(function () {
        const now = new Date().getTime();
        const distance = targetTime - now;

        if (distance < 0) {
            clearInterval(window["countdown_" + boxId]);
            document.getElementById(countdownId).innerHTML = "";
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

// --- Fungsi Update Live Score & Match Status + Menit Real-Time ---
function monitorMatchStatus(matchId, boxId, kickoffTimeMs) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
    const matchBox = document.getElementById("match" + boxId);
    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchStatusEl = document.getElementById("matchStatus" + boxId);
    const finishedContainer = document.getElementById("finishedMatches");

    const interval = setInterval(async () => {
        const res = await fetch(eventUrl);
        const data = await res.json();
        const event = data.event;
        if (!event || !matchBox) return;

        const statusType = event.status.type;

        // Skor pinalti (jika ada)
        const penaltiesHome = event.homeScore.penalties || 0;
        const penaltiesAway = event.awayScore.penalties || 0;
        const hasPenalties = penaltiesHome > 0 || penaltiesAway > 0;

        // --- STATUS HALFTIME ---
        if (statusType === "halftime") {
            liveContainer.classList.remove('hidden');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⏸️ HALF TIME ⏸️</strong>";

            liveScoreEl.innerHTML = `${event.homeScore.current} - ${event.awayScore.current}`;
            liveScoreEl.style.display = "block";

            matchStatusEl.innerHTML = "Half Time";
            matchStatusEl.style.display = "block";

        } 
        // --- STATUS IN PROGRESS ---
        else if (statusType === "inprogress") {
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);
            countdownEl.innerHTML = "";
            liveContainer.classList.remove('hidden');
            liveContainer.classList.add('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";

            // Update skor
            liveScoreEl.innerHTML = `${event.homeScore.current} - ${event.awayScore.current}`;
            liveScoreEl.style.display = "block";

            // Hitung menit real-time dari kickoff
            let now = Date.now();
            let minutesPassed = Math.floor((now - kickoffTimeMs) / (1000 * 60));

            let half = event.status.description || "1st Half";
            if (half.toLowerCase().includes("2nd")) {
                minutesPassed = 45 + minutesPassed;
            }
            if (minutesPassed < 0) minutesPassed = 0;

            let statusText = half + " " + minutesPassed + "'";
            matchStatusEl.innerHTML = statusText;
            matchStatusEl.style.display = "block";
        } 
        // --- STATUS UPCOMING ---
        else if (statusType === "upcoming") {
            liveScoreEl.style.display = "none";
            matchStatusEl.style.display = "none";
            liveContainer.classList.add('hidden');
        } 
        // --- STATUS FINISHED ---
        else if (statusType === "finished") {
            clearInterval(interval);
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('blink');
            liveContainer.style.animation = "none";
            liveContainer.classList.remove('hidden');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            if (hasPenalties) {
                scoreText += ` (${penaltiesHome}-${penaltiesAway} p)`;
            }

            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";

            matchStatusEl.innerHTML = "Full Time";
            matchStatusEl.style.display = "block";

            if (finishedContainer && matchBox.parentNode !== finishedContainer) {
                finishedContainer.appendChild(matchBox);
            }
        }
    }, 1000); // update setiap 1 detik
}
