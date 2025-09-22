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

// --- Fungsi Update Live Score & Match Status + Menit Perkiraan ---
function monitorMatchStatus(matchId, boxId, kickoffTimeMs) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
    const matchBox = document.getElementById("match" + boxId);
    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchStatusEl = document.getElementById("matchStatus" + boxId);
    const finishedContainer = document.getElementById("finishedMatches");

    let halfStartTime = kickoffTimeMs;
    let halfType = "1st"; // 1st, 2nd, ET1, ET2

    const interval = setInterval(async () => {
        const res = await fetch(eventUrl);
        const data = await res.json();
        const event = data.event;
        if (!event || !matchBox) return;

        const statusType = event.status.type;
        const statusDesc = event.status.description || "";

        const penaltiesHome = event.homeScore.penalties || 0;
        const penaltiesAway = event.awayScore.penalties || 0;
        const hasPenalties = penaltiesHome > 0 || penaltiesAway > 0;

        // --- UPCOMING ---
        if (statusType === "upcoming") {
            liveScoreEl.style.display = "none";
            matchStatusEl.style.display = "none";
            liveContainer.classList.add('hidden');
        }

        // --- IN PROGRESS / HALF TIME / EXTRA TIME ---
        else if (statusType === "inprogress" || statusType === "halftime") {
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);
            countdownEl.innerHTML = "";

            liveContainer.classList.remove('hidden');
            liveContainer.classList.add('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";

            liveScoreEl.innerHTML = `${event.homeScore.current} - ${event.awayScore.current}`;
            liveScoreEl.style.display = "block";

            // Tentukan menit perkiraan
            const now = Date.now();
            let minutesPassed = 0;

            // Deteksi babak
            if (statusDesc.toLowerCase().includes("1st half") && halfType !== "1st") {
                halfType = "1st";
                halfStartTime = now;
            } else if (statusDesc.toLowerCase().includes("2nd half") && halfType !== "2nd") {
                halfType = "2nd";
                halfStartTime = now;
            } else if (statusDesc.toLowerCase().includes("et 1st half") && halfType !== "ET1") {
                halfType = "ET1";
                halfStartTime = now;
            } else if (statusDesc.toLowerCase().includes("et 2nd half") && halfType !== "ET2") {
                halfType = "ET2";
                halfStartTime = now;
            }

            // Hitung menit perkiraan
            const elapsed = Math.floor((now - halfStartTime) / (1000 * 60));
            switch (halfType) {
                case "1st": 
                    minutesPassed = elapsed;
                    if (minutesPassed > 45) minutesPassed = `45+${minutesPassed - 45}`;
                    break;
                case "2nd": 
                    minutesPassed = 46 + elapsed;
                    if (minutesPassed > 90) minutesPassed = `90+${minutesPassed - 90}`;
                    break;
                case "ET1": 
                    minutesPassed = 91 + elapsed;
                    if (minutesPassed > 105) minutesPassed = `105+${minutesPassed - 105}`;
                    break;
                case "ET2": 
                    minutesPassed = 106 + elapsed;
                    if (minutesPassed > 120) minutesPassed = `120+${minutesPassed - 120}`;
                    break;
            }

            matchStatusEl.innerHTML = `${statusDesc} ${minutesPassed}'`;
            matchStatusEl.style.display = "block";
        }

        // --- FINISHED ---
        else if (statusType === "finished") {
            clearInterval(interval);
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('blink');
            liveContainer.style.animation = "none";
            liveContainer.classList.remove('hidden');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            if (hasPenalties) scoreText += ` (${penaltiesHome}-${penaltiesAway} p)`;

            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";

            matchStatusEl.innerHTML = "Full Time";
            matchStatusEl.style.display = "block";

            if (finishedContainer && matchBox.parentNode !== finishedContainer) {
                finishedContainer.appendChild(matchBox);
            }
        }

    }, 1000);
}
