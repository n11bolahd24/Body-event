// --- Fungsi Utama Load Sofascore + Countdown + Menit Real-Time + Extra Time + Penalti ---
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
            const kickoffEl = document.getElementById("kickoff" + boxId);
            if(kickoffEl) kickoffEl.innerHTML = `${tanggal} | K.O ${jam}`;

            // Nama tim
            const teamsEl = document.getElementById("teams" + boxId);
            if(teamsEl) teamsEl.innerText = home.name + " VS " + away.name;

            // Logo tim
            const logoHomeEl = document.getElementById("logoHome" + boxId);
            const logoAwayEl = document.getElementById("logoAway" + boxId);
            if(logoHomeEl) logoHomeEl.src = "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
            if(logoAwayEl) logoAwayEl.src = "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

            // Mulai countdown & monitor status
            startCountdown(kickoffDate.getTime(), boxId);
            monitorMatchStatus(matchId, boxId);
        });
}

// --- Hitung menit real-time jika API tidak ada ---
function getRealTimeMinute(event) {
    const now = Date.now();
    const start = event.startTimestamp * 1000;
    let minute = 0;

    if(event.status.type === "inprogress" || event.status.type === "extraTime") {
        minute = Math.floor((now - start) / 60000);

        if(event.status.addedTime) minute += event.status.addedTime;

        if(event.status.period === "firstHalf" && minute > 45 + (event.status.addedTime || 0)) {
            minute = 45 + (event.status.addedTime || 0);
        }
        if(event.status.period === "secondHalf" && minute > 90 + (event.status.addedTime || 0)) {
            minute = 90 + (event.status.addedTime || 0);
        }
    }
    return minute;
}

// --- Fungsi Update Live Score & Menit Real-Time ---
function monitorMatchStatus(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
    const matchBox = document.getElementById("match" + boxId);
    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchStatusEl = document.getElementById("matchStatus" + boxId);
    const formattedTimeEl = document.getElementById("formattedTime" + boxId);
    const finishedContainer = document.getElementById("finishedMatches");

    const interval = setInterval(async () => {
        const res = await fetch(eventUrl);
        const data = await res.json();
        const event = data.event;
        if(!event || !matchBox) return;

        // Hitung menit real-time
        let minute = event.status.minute || getRealTimeMinute(event);
        if(formattedTimeEl) formattedTimeEl.textContent = minute + "'";

        // Live score + penalti
        let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
        if(event.homeScore.penalties != null && event.awayScore.penalties != null) {
            scoreText += ` (P ${event.homeScore.penalties} - ${event.awayScore.penalties})`;
        }
        if(liveScoreEl) {
            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";
        }

        // Status match
        let statusText = "";
        if(event.status.type === "upcoming") {
            statusText = "Upcoming";
            liveContainer.classList.add('hidden');
            liveScoreEl.style.display = "none";
        } else if(event.status.type === "inprogress") {
            statusText = event.status.period === "firstHalf" ? "1st Half" :
                         event.status.period === "secondHalf" ? "2nd Half" :
                         event.status.description;
            liveContainer.classList.remove('hidden');
            liveContainer.classList.add('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";
        } else if(event.status.type === "extraTime") {
            statusText = "Extra Time";
            liveContainer.classList.remove('hidden');
            liveContainer.classList.add('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";
        } else if(event.status.type === "finished") {
            clearInterval(interval);
            if(window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);
            statusText = "Full Time";
            liveContainer.classList.remove('blink');
            liveContainer.style.animation = "none";
            liveContainer.classList.remove('hidden');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

            if(finishedContainer && matchBox.parentNode !== finishedContainer) {
                finishedContainer.appendChild(matchBox);
            }
        }

        // Tambahkan Penalty info di status
        if(event.homeScore.penalties != null && event.awayScore.penalties != null) {
            statusText += " | Penalty";
        }

        if(matchStatusEl) {
            matchStatusEl.innerHTML = statusText;
            matchStatusEl.style.display = "block";
        }
    }, 3000);
}

// --- Fungsi Countdown ---
function startCountdown(targetTime, boxId) {
    const countdownId = "countdown" + boxId;
    window["countdown_" + boxId] = setInterval(function() {
        const now = new Date().getTime();
        const distance = targetTime - now;

        if(distance < 0) {
            clearInterval(window["countdown_" + boxId]);
            const countdownEl = document.getElementById(countdownId);
            if(countdownEl) countdownEl.innerHTML = "";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const countdownEl = document.getElementById(countdownId);
        if(countdownEl) countdownEl.textContent =
            (days > 0 ? days + "D - " : "") +
            hours + "H - " +
            minutes + "M - " +
            seconds + "S";
    }, 1000);
}
