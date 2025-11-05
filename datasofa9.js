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
                </span>`;
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



            // Logo nama tim
            document.getElementById("logoHome" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
            document.getElementById("teamshome" + boxId).innerText = home.name;
            document.getElementById("logoAway" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + away.id + "/image";
            document.getElementById("teamsaway" + boxId).innerText = away.name;

            // Mulai countdown & monitor status
            startCountdown(kickoffDate.getTime(), boxId);
            monitorMatchStatus(matchId, boxId);
        });
}

// --- Fungsi Update Live Score & Match Status (Fix) ---
function monitorMatchStatus(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
    const matchBox = document.getElementById("match" + boxId);
    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchStatusEl = document.getElementById("matchStatus" + boxId);

    // Pastikan interval lama berhenti sebelum buat yang baru
    if (window["interval_" + boxId]) clearInterval(window["interval_" + boxId]);

    // Nilai default
    if (matchStatusEl && !matchStatusEl.textContent.trim()) {
        matchStatusEl.innerHTML = "UP COMING";
        matchStatusEl.style.display = "block";
    }
    if (liveScoreEl && !liveScoreEl.textContent.trim()) {
        liveScoreEl.innerHTML = "VS";
        liveScoreEl.style.display = "block";
    }

    const finishedContainer = document.getElementById(
        boxId < 100 ? "finishedMatches1" : "finishedMatches2"
    );

    // Tambahkan flag agar tidak fetch bertumpuk
    let isUpdating = false;

    window["interval_" + boxId] = setInterval(async () => {
        if (isUpdating) return; // cegah dobel fetch
        isUpdating = true;

        try {
            const res = await fetch(eventUrl);
            const data = await res.json();
            const event = data.event;
            if (!event || !matchBox) return;

            // === STATUS UPCOMING ===
            if (event.status.type === "upcoming") {
                liveScoreEl.style.display = "none";
                matchStatusEl.style.display = "none";
                liveContainer.classList.add('hidden');
            }

            // === STATUS LIVE ===
            else if (event.status.type === "inprogress" || event.status.type === "penalties") {
                if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);
                countdownEl.innerHTML = "";

                liveContainer.classList.remove('hidden', 'blink');
                liveContainer.classList.add('blink');
                liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";

                let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
                if (event.homeScore.penalties !== undefined && event.awayScore.penalties !== undefined) {
                    scoreText += ` <span style="font-size:12px;">(P: ${event.homeScore.penalties} - ${event.awayScore.penalties})</span>`;
                }
                liveScoreEl.innerHTML = scoreText;

                let statusText = event.status.description || "LIVE";
                if (event.time && event.time.currentPeriodStartTimestamp) {
                    const elapsed = Math.floor((Date.now() - event.time.currentPeriodStartTimestamp * 1000) / 60000);
                    if (event.status.type === "inprogress") {
                        if (elapsed >= 90) statusText = "90+'";
                        else statusText = `${elapsed}'`;
                    }
                }
                matchStatusEl.innerHTML = statusText;
                matchStatusEl.style.display = "block";
            }

            // === STATUS SELESAI ===
            else if (event.status.type === "finished") {
                clearInterval(window["interval_" + boxId]);
                if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

                countdownEl.innerHTML = "";
                liveContainer.classList.remove('blink');
                liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

                let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
                if (event.homeScore.penalties !== undefined && event.awayScore.penalties !== undefined) {
                    scoreText += ` <span style="font-size:12px;">(P: ${event.homeScore.penalties} - ${event.awayScore.penalties})</span>`;
                }
                liveScoreEl.innerHTML = scoreText;
                matchStatusEl.innerHTML = "Full Time";

                if (finishedContainer && matchBox.parentNode !== finishedContainer) {
                    finishedContainer.appendChild(matchBox);
                }
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            isUpdating = false;
        }
    }, 15000); // ✅ Update tiap 15 detik, cukup aman dan ringan
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
