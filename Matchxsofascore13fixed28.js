// --- Fungsi Update Live Score & Match Ended + Menit ---
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

        // --- MATCH LIVE ---
        if (event.status.type === "inprogress") {
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('hidden');
            liveContainer.classList.add('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";

            // Score
            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";

            // --- Menit Pertandingan ---
            let minuteText = "";
            const statusType = event.status.description || "";
            const homeScore = event.homeScore.current;
            const awayScore = event.awayScore.current;

            // Data Sofascore menyediakan currentMinute dan extraTime jika ada
            let currentMinute = event.status.currentMinute || 0; // menit utama
            let extraMinute = event.status.extraTime || 0;       // tambahan waktu

            if (currentMinute > 0) {
                minuteText = currentMinute;
                if (extraMinute > 0) minuteText += "+" + extraMinute;
                minuteText += "'";
            } else {
                minuteText = statusType; // fallback
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

            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
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
