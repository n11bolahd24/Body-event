// --- Fungsi Update Live Score & Match Status Lengkap ---
function monitorMatchStatus(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
    const matchBox = document.getElementById("match" + boxId);
    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchStatusEl = document.getElementById("matchStatus" + boxId);
    const finishedContainer = document.getElementById("finishedMatches");

    const interval = setInterval(async () => {
        try {
            const res = await fetch(eventUrl);
            const data = await res.json();
            const event = data.event;
            if (!event || !matchBox) return;

            const type = event.status.type;
            const desc = event.status.description || "";
            const homeScore = event.homeScore.current;
            const awayScore = event.awayScore.current;

            // Default sembunyikan semua dulu
            liveScoreEl.style.display = "none";
            matchStatusEl.style.display = "none";
            liveContainer.classList.remove('blink');
            liveContainer.classList.add('hidden');

            // Tangani masing-masing status
            if (type === "upcoming" || type === "awaiting") {
                // Pertandingan belum mulai
                if (window["countdown_" + boxId]) countdownEl.style.display = "block";
                liveContainer.innerHTML = "";
            } 
            else if (type === "inprogress") {
                // Pertandingan berjalan
                if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);
                countdownEl.innerHTML = "";
                liveContainer.classList.remove('hidden');
                liveContainer.classList.add('blink');
                liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";

                liveScoreEl.innerHTML = `${homeScore} - ${awayScore}`;
                liveScoreEl.style.display = "block";

                matchStatusEl.innerHTML = desc; // misal "1st Half", "45+2'"
                matchStatusEl.style.display = "block";
            } 
            else if (type === "halftime") {
                // Babak pertama selesai
                if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);
                countdownEl.innerHTML = "";
                liveContainer.classList.remove('hidden');
                liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⏸ HALF TIME ⏸</strong>";

                liveScoreEl.innerHTML = `${homeScore} - ${awayScore}`;
                liveScoreEl.style.display = "block";

                matchStatusEl.innerHTML = "Half Time";
                matchStatusEl.style.display = "block";
            }
            else if (type === "finished") {
                clearInterval(interval);
                if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);
                countdownEl.innerHTML = "";

                liveContainer.classList.remove('blink');
                liveContainer.classList.remove('hidden');
                liveContainer.style.animation = "none";
                liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

                liveScoreEl.innerHTML = `${homeScore} - ${awayScore}`;
                liveScoreEl.style.display = "block";

                matchStatusEl.innerHTML = desc || "Full Time";
                matchStatusEl.style.display = "block";

                if (finishedContainer && matchBox.parentNode !== finishedContainer) {
                    finishedContainer.appendChild(matchBox);
                }
            } 
            else if (type === "postponed") {
                liveContainer.classList.remove('hidden');
                liveContainer.innerHTML = "<strong style='color:orange;-webkit-text-stroke:0.2px black;'>🟠 MATCH POSTPONED 🟠</strong>";
            } 
            else if (type === "cancelled") {
                liveContainer.classList.remove('hidden');
                liveContainer.innerHTML = "<strong style='color:red;-webkit-text-stroke:0.2px black;'>❌ MATCH CANCELLED ❌</strong>";
            } 
            else if (type === "interrupted" || type === "abandoned") {
                liveContainer.classList.remove('hidden');
                liveContainer.innerHTML = "<strong style='color:yellow;-webkit-text-stroke:0.2px black;'>⚠️ MATCH INTERRUPTED ⚠️</strong>";
            }

        } catch (err) {
            console.error("Error fetching match status:", err);
        }
    }, 3000);
}
