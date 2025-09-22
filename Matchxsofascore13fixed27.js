// --- Fungsi Update Live Score, Match Ended & Menit Realtime ---
function monitorMatchStatus(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
    const matchBox = document.getElementById("match" + boxId);
    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchStatusEl = document.getElementById("matchStatus" + boxId);
    const matchMinuteEl = document.getElementById("matchMinute" + boxId); // Tambahkan elemen untuk menit
    const finishedContainer = document.getElementById("finishedMatches");

    const interval = setInterval(async () => {
        const res = await fetch(eventUrl);
        const data = await res.json();
        const event = data.event;
        if (!event || !matchBox) return;

        // --- Status Upcoming ---
        if (event.status.type === "upcoming") {
            liveScoreEl.style.display = "none";
            matchStatusEl.style.display = "none";
            if (matchMinuteEl) matchMinuteEl.innerText = "";
            liveContainer.classList.add('hidden');
        }

        // --- Status In Progress ---
        if (event.status.type === "inprogress") {
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('hidden');
            liveContainer.classList.add('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";

            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";

            // Status text (1st Half, 2nd Half, Extra Time)
            let statusText = event.status.description || "1st Half";
            matchStatusEl.innerHTML = statusText;
            matchStatusEl.style.display = "block";

            // --- Hitung menit pertandingan ---
            let minute = 0;
            if (event.status.minute !== undefined && event.status.minute !== null) {
                minute = event.status.minute;
            } else {
                // fallback: hitung manual dari kickoff
                const kickoff = new Date(event.startTimestamp * 1000).getTime();
                const now = new Date().getTime();
                const diff = Math.floor((now - kickoff) / 60000);
                minute = diff > 0 ? diff : 0;
            }

            // Tambahkan format menit extra time
            if (minute > 45 && statusText.toLowerCase().includes("1st")) {
                minute = "45+" + (minute - 45);
            } else if (minute > 90 && statusText.toLowerCase().includes("2nd")) {
                minute = "90+" + (minute - 90);
            }

            if (matchMinuteEl) matchMinuteEl.innerText = minute + "'";
        }

        // --- Status Finished ---
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

            if (matchMinuteEl) matchMinuteEl.innerText = "FT";

            if (finishedContainer && matchBox.parentNode !== finishedContainer) {
                finishedContainer.appendChild(matchBox);
            }
        }
    }, 3000);
}
