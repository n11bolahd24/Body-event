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
            const tanggal = kickoffDate.toLocaleDateString(undefined, {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            const jam = kickoffDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZoneName: 'short'
            });

            document.getElementById("kickoff" + boxId).innerHTML = `${tanggal} | K.O ${jam}`;

            // Nama tim
            document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;

            // Logo tim
            document.getElementById("logoHome" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
            document.getElementById("logoAway" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

            // Mulai countdown & monitor status
            startCountdown(kickoffDate.getTime(), boxId);
            monitorMatchStatus(matchId, boxId);
        });
}

// --- Fungsi Update Live Score & Match Ended ---
function monitorMatchStatus(matchId, boxId) {
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

        if (event.status.type === "upcoming") {
            liveScoreEl.style.display = "none";
            matchStatusEl.style.display = "none";
            liveContainer.classList.add('hidden');
        }

        if (event.status.type === "inprogress" || event.status.type === "halftime" || event.status.type === "extraTime" || event.status.type === "penalties") {
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('hidden');
            liveContainer.classList.add('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";

            // Skor
            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            const penScore = getPenaltyScore(event);
            if (penScore) {
                scoreText += ` (${penScore})`;
            }
            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";

            // Menit + status
            matchStatusEl.innerHTML = getMinute(event);
            matchStatusEl.style.display = "block";
        }

        if (event.status.type === "finished") {
            clearInterval(interval);
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('blink');
            liveContainer.style.animation = "none";
            liveContainer.classList.remove('hidden');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            const penScore = getPenaltyScore(event);
            if (penScore) {
                scoreText += ` (${penScore})`;
            }
            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";

            matchStatusEl.innerHTML = "FT";
            matchStatusEl.style.display = "block";

            if (finishedContainer && matchBox.parentNode !== finishedContainer) {
                finishedContainer.appendChild(matchBox);
            }
        }
    }, 3000);
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

// --- Fungsi Ambil Menit + Status ---
function getMinute(event) {
    if (!event || !event.status) return "";

    const type = event.status.type;
    const desc = event.status.description;

    // --- Status teks ---
    let statusText = "";
    switch (type) {
        case "inprogress":
            if (event.time.currentPeriod === 1) statusText = "1st Half";
            if (event.time.currentPeriod === 2) statusText = "2nd Half";
            if (event.time.currentPeriod === 3) statusText = "ET 1st";
            if (event.time.currentPeriod === 4) statusText = "ET 2nd";
            break;
        case "halftime": statusText = "HT"; break;
        case "finished": statusText = "FT"; break;
        case "afterextra": statusText = "AET"; break;
        case "penalties": statusText = "PEN"; break;
    }

    // --- Sofascore description langsung ---
    if (desc && desc.trim() !== "") {
        return desc + " " + statusText;
    }

    // --- Hitung manual ---
    if (!(event.time && event.time.currentPeriodStartTimestamp)) {
        return statusText;
    }

    const now = Date.now() / 1000;
    let elapsed = Math.floor((now - event.time.currentPeriodStartTimestamp) / 60);
    let minute = elapsed;

    switch (event.time.currentPeriod) {
        case 1: minute = elapsed; break;
        case 2: minute = 45 + elapsed; break;
        case 3: minute = 90 + elapsed; break;
        case 4: minute = 105 + elapsed; break;
    }

    if (event.time.currentPeriod === 1 && minute > 45) {
        return "45+" + (minute - 45) + " " + statusText;
    }
    if (event.time.currentPeriod === 2 && minute > 90) {
        return "90+" + (minute - 90) + " " + statusText;
    }
    if (event.time.currentPeriod === 3 && minute > 105) {
        return "105+" + (minute - 105) + " " + statusText;
    }
    if (event.time.currentPeriod === 4 && minute > 120) {
        return "120+" + (minute - 120) + " " + statusText;
    }

    return minute + "' " + statusText;
}

// --- Fungsi Ambil Skor Penalti ---
function getPenaltyScore(event) {
    if (!event.homeScore || !event.awayScore) return "";
    if (event.homeScore.penalties != null || event.awayScore.penalties != null) {
        const homePen = event.homeScore.penalties ?? 0;
        const awayPen = event.awayScore.penalties ?? 0;
        return `${homePen} – ${awayPen}`;
    }
    return "";
}
