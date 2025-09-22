// --- Fungsi format menit pertandingan ---
function formatMatchMinute(rawMinute, period) {
    if (!rawMinute) return "";

    let minuteText = rawMinute.toString();

    // Kalau ada tanda tambah (misal 45+X atau 90+X)
    if (minuteText.includes("+")) {
        let [base, extra] = minuteText.split("+").map(n => parseInt(n, 10));

        if (period.includes("1st half")) {
            return `${base}+${extra}'`;

        } else if (period.includes("2nd half")) {
            let totalMinute = 45 + extra;
            if (totalMinute > 90) return `90+${totalMinute - 90}'`;
            return `${totalMinute}'`;

        } else if (period.includes("et 1st half")) {
            let totalMinute = 90 + extra;
            if (totalMinute > 105) return `105+${totalMinute - 105}'`;
            return `${totalMinute}'`;

        } else if (period.includes("et 2nd half")) {
            let totalMinute = 105 + extra;
            if (totalMinute > 120) return `120+${totalMinute - 120}'`;
            return `${totalMinute}'`;
        }
    } else {
        let minute = parseInt(minuteText, 10);

        if (period.includes("2nd half") && minute <= 45) {
            return (45 + minute) + "'";
        } else if (period.includes("et 1st half") && minute <= 15) {
            return (90 + minute) + "'";
        } else if (period.includes("et 2nd half") && minute <= 15) {
            return (105 + minute) + "'";
        }
        return minute + "'";
    }
}

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
            document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;

            document.getElementById("logoHome" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
            document.getElementById("logoAway" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

            startCountdown(kickoffDate.getTime(), boxId);
            monitorMatchStatus(matchId, boxId);
        });
}

// --- Fungsi Update Live Score & Menit Realtime ---
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

        if (event.status.type === "inprogress") {
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('hidden');
            liveContainer.classList.add('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";

            // Skor utama
            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            // Tambah skor penalti kalau ada
            if (event.homeScore.penalties !== undefined && event.awayScore.penalties !== undefined) {
                scoreText += ` (P: ${event.homeScore.penalties}-${event.awayScore.penalties})`;
            }
            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";

            // Status & menit
            let statusText = event.status.description || "1st Half";
            if (event.status.minute) {
                statusText = `${statusText} - ${formatMatchMinute(event.status.minute, event.status.description.toLowerCase())}`;
            }

            // Kalau fase adu penalti
            if (event.status.description.toLowerCase().includes("penalties")) {
                statusText = "Penalties Shootout";
            }

            matchStatusEl.innerHTML = statusText;
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
            if (event.homeScore.penalties !== undefined && event.awayScore.penalties !== undefined) {
                scoreText += ` (P: ${event.homeScore.penalties}-${event.awayScore.penalties})`;
            }
            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";

            matchStatusEl.innerHTML = "Full Time";
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
