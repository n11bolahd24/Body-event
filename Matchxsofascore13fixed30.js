// --- Fungsi Utama Load Sofascore + Countdown + Live Match ---
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
                </span>`;
            }

            // Jadwal kickoff otomatis zona waktu pengunjung
            const kickoffDate = new Date(event.startTimestamp * 1000);

            // Format tanggal lokal pengunjung
            const tanggal = kickoffDate.toLocaleDateString(undefined, {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });

            // Format jam lokal pengunjung + kode zona
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

// --- Fungsi Update Live Score, Menit, Babak, Extra Time & Penalti ---
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

        // --- MATCH UPCOMING ---
        if (event.status.type === "upcoming") {
            liveScoreEl.style.display = "none";
            matchStatusEl.style.display = "none";
            liveContainer.classList.add('hidden');
        }

        // --- MATCH IN PROGRESS ---
        if (event.status.type === "inprogress") {
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);
            countdownEl.innerHTML = "";

            liveContainer.classList.remove('hidden');
            liveContainer.classList.add('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";

            // Score utama
            const homeScore = event.homeScore.current;
            const awayScore = event.awayScore.current;
            liveScoreEl.innerHTML = `${homeScore} - ${awayScore}`;
            liveScoreEl.style.display = "block";

            // Menit pertandingan + babak + extra time
            let minuteText = "";
            let currentMinute = event.status.currentMinute || 0;
            let extraMinute = event.status.extraTime || 0;

            if (currentMinute <= 45) {
                minuteText = currentMinute;
                if (extraMinute > 0) minuteText += "+" + extraMinute;
                minuteText += "' (1H)";
            } else if (currentMinute > 45) {
                const secondHalfMinute = currentMinute - 45;
                minuteText = secondHalfMinute;
                if (extraMinute > 0) minuteText += "+" + extraMinute;
                minuteText += "' (2H)";
            } else {
                minuteText = event.status.description || "Live";
            }

            // Penalti jika ada
            if (event.homeScore.penalties || event.awayScore.penalties) {
                const penHome = event.homeScore.penalties || 0;
                const penAway = event.awayScore.penalties || 0;
                minuteText += ` | Pen: ${penHome} - ${penAway}`;
            }

            matchStatusEl.innerHTML = minuteText;
            matchStatusEl.style.display = "block";
        }

        // --- MATCH FINISHED ---
        if (event.status.type === "finished") {
            clearInterval(interval);
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('blink');
            liveContainer.style.animation = "none";
            liveContainer.classList.remove('hidden');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

            const homeScore = event.homeScore.current;
            const awayScore = event.awayScore.current;
            liveScoreEl.innerHTML = `${homeScore} - ${awayScore}`;
            liveScoreEl.style.display = "block";

            let statusText = "Full Time";
            if (event.homeScore.penalties || event.awayScore.penalties) {
                const penHome = event.homeScore.penalties || 0;
                const penAway = event.awayScore.penalties || 0;
                statusText += ` | Penalties: ${penHome} - ${penAway}`;
            }

            matchStatusEl.innerHTML = statusText;
            matchStatusEl.style.display = "block";

            // Pindah ke container finished
            if (finishedContainer && matchBox.parentNode !== finishedContainer) {
                finishedContainer.appendChild(matchBox);
            }
        }
    }, 3000);
}
