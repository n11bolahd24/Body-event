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
                // Babak 1
                minuteText = currentMinute;
                if (extraMinute > 0) minuteText += "+" + extraMinute;
                minuteText += "' (1H)";
            } else if (currentMinute > 45) {
                // Babak 2
                const secondHalfMinute = currentMinute - 45;
                minuteText = secondHalfMinute;
                if (extraMinute > 0) minuteText += "+" + extraMinute;
                minuteText += "' (2H)";
            } else {
                minuteText = event.status.description || "Live";
            }

            // Jika ada penalti
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

            // Final score
            const homeScore = event.homeScore.current;
            const awayScore = event.awayScore.current;
            liveScoreEl.innerHTML = `${homeScore} - ${awayScore}`;
            liveScoreEl.style.display = "block";

            // Penalti jika ada
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
