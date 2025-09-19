// --- Fungsi Utama Load Sofascore + Countdown ---
function loadSofaScore(matchId, boxId, region = "Asia/Jakarta") {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;

    fetch(eventUrl)
        .then(res => res.json())
        .then(data => {
            const event = data.event;
            const home = event.homeTeam;
            const away = event.awayTeam;

            // Nama liga
            document.getElementById("league" + boxId).innerText = event.tournament.name;

            // Jadwal kickoff dengan regional
            let kickoffDate = new Date(event.startTimestamp * 1000);
            let options = {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: region
            };
            let kickoffString = new Intl.DateTimeFormat("id-ID", options).format(kickoffDate);

            let regionAbbr = "WIB"; 
            if (region === "Asia/Makassar") regionAbbr = "WITA";
            if (region === "Asia/Jayapura") regionAbbr = "WIT";

            document.getElementById("kickoff" + boxId).innerText =
                kickoffString + " " + regionAbbr;

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

// --- Fungsi Update Live Score & Match Ended (dengan warna status) ---
function monitorMatchStatus(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
    const matchBox = document.getElementById("match" + boxId);
    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const liveStatusEl = document.getElementById("liveStatus" + boxId); // elemen baru untuk babak/status
    const finishedContainer = document.getElementById("finishedMatches");

    const interval = setInterval(async () => {
        const res = await fetch(eventUrl);
        const data = await res.json();
        const event = data.event;
        if (!event || !matchBox) return;

        // --- Update Skor ---
        let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
        liveScoreEl.innerHTML = scoreText;

        // --- Update Babak / Status ---
        let statusText = "";
        let statusColor = "#ffcc00"; // default

        if (event.status.type === "inprogress") {
            statusText = event.status.description || "";

            if (statusText.toLowerCase().includes("1st")) statusColor = "#00ff00";      // hijau
            else if (statusText.toLowerCase().includes("2nd")) statusColor = "#00ffff"; // cyan
            else if (statusText.toLowerCase().includes("halftime")) statusColor = "#ff00ff"; // magenta

            // Tampilkan LIVE NOW
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);
            countdownEl.innerHTML = "";
            liveContainer.classList.remove('hidden');
            liveContainer.classList.add('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke: 0.2px black;'>🔴 LIVE NOW</strong>";

        } else if (event.status.type === "finished") {
            // MATCH ENDED
            clearInterval(interval);
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('blink');
            liveContainer.style.animation = "none";
            liveContainer.classList.remove('hidden');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke: 0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

            statusText = "FT";
            statusColor = "#ff0000"; // merah Full Time

            if (finishedContainer && matchBox.parentNode !== finishedContainer) {
                finishedContainer.appendChild(matchBox);
            }
        } else {
            // upcoming / belum kickoff
            liveContainer.classList.add('hidden');
            statusText = "";
        }

        // Tampilkan status/babak dengan warna
        if (liveStatusEl) {
            liveStatusEl.innerHTML = statusText ? `<span style="color:${statusColor}; font-weight:bold;">${statusText}</span>` : "";
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
            countdownEl.innerHTML = ""; // jangan tulis LIVE NOW
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
          
