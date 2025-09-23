// --- Fungsi ambil menit ---
function getMinute(event) {
    if (!event || !event.status) return "";

    const type = event.status.type;
    const desc = event.status.description;

    console.log("➡️ getMinute() dipanggil:", { type, desc, time: event.time });

    // Pakai Sofascore description kalau ada (misal "80'", "90+3'")
    if (desc && desc.trim() !== "") {
        console.log("✅ Pakai description langsung:", desc);
        return desc;
    }

    // Kalau tidak ada description, fallback ke kalkulasi manual
    if (!(event.time && event.time.currentPeriodStartTimestamp)) {
        console.log("⚠️ Tidak ada currentPeriodStartTimestamp, fallback ke status type");
        if (type === "halftime") return "HT";
        if (type === "finished") return "FT";
        if (type === "penalties") return "PEN";
        return "";
    }

    const now = Date.now() / 1000;
    let elapsed = Math.floor((now - event.time.currentPeriodStartTimestamp) / 60);
    let minute = elapsed;

    switch (event.time.currentPeriod) {
        case 1: minute = elapsed; break;          // 1st half
        case 2: minute = 45 + elapsed; break;     // 2nd half
        case 3: minute = 90 + elapsed; break;     // ET 1st half
        case 4: minute = 105 + elapsed; break;    // ET 2nd half
    }

    console.log("⏱️ Kalkulasi manual:", {
        currentPeriod: event.time.currentPeriod,
        elapsed,
        hasil: minute
    });

    // Pastikan tidak lebih dari batas babak
    if (event.time.currentPeriod === 1 && minute > 45) {
        return "45+" + (minute - 45);
    }
    if (event.time.currentPeriod === 2 && minute > 90) {
        return "90+" + (minute - 90);
    }
    if (event.time.currentPeriod === 3 && minute > 105) {
        return "105+" + (minute - 105);
    }
    if (event.time.currentPeriod === 4 && minute > 120) {
        return "120+" + (minute - 120);
    }

    return minute + "'";
}

// --- Fungsi Utama Load Sofascore + Countdown ---
function loadSofaScore(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;

    console.log("🔄 Load awal untuk matchId:", matchId, "boxId:", boxId);

    fetch(eventUrl)
        .then(res => res.json())
        .then(data => {
            console.log("📦 Data load awal:", data);
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
                day: '2-digit', month: 'long', year: 'numeric'
            });
            const jam = kickoffDate.toLocaleTimeString(undefined, {
                hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short'
            });

            document.getElementById("kickoff" + boxId).innerHTML = `${tanggal} | K.O ${jam}`;
            document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;
            document.getElementById("logoHome" + boxId).src = "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
            document.getElementById("logoAway" + boxId).src = "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

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

    console.log("👀 Start monitor matchId:", matchId, "boxId:", boxId);

    const interval = setInterval(async () => {
        const res = await fetch(eventUrl);
        const data = await res.json();
        const event = data.event;

        console.log("📡 Update event:", event);

        if (!event || !matchBox) return;

        if (event.status.type === "upcoming") {
            console.log("⌛ Status: upcoming");
            liveScoreEl.style.display = "none";
            matchStatusEl.style.display = "none";
            liveContainer.classList.add('hidden');
        }

        if (event.status.type === "inprogress" || event.status.type === "extraTime" || event.status.type === "penalties") {
            console.log("🔥 Status: live");
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('hidden');
            liveContainer.classList.add('blink');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";

            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            if (event.homeScore.penalties !== undefined) {
                scoreText += ` (${event.homeScore.penalties} - ${event.awayScore.penalties})`;
            }
            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";

            let statusText = getMinute(event);
            console.log("📍 Menit tampil:", statusText);
            matchStatusEl.innerHTML = statusText;
            matchStatusEl.style.display = "block";
        }

        if (event.status.type === "finished") {
            console.log("🏁 Status: finished");
            clearInterval(interval);
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

            countdownEl.innerHTML = "";
            liveContainer.classList.remove('blink');
            liveContainer.style.animation = "none";
            liveContainer.classList.remove('hidden');
            liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            if (event.homeScore.penalties !== undefined) {
                scoreText += ` (${event.homeScore.penalties} - ${event.awayScore.penalties})`;
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
