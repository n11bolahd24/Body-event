// --- Fungsi Utama Load Sofascore + Countdown + Monitor Status + Menit Realtime ---
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

// --- Fungsi Update Live Score, Menit & Match Ended ---
function monitorMatchStatus(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
    const matchBox = document.getElementById("match" + boxId);
    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchStatusEl = document.getElementById("matchStatus" + boxId);
    const matchMinuteEl = document.getElementById("matchMinute" + boxId);
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

            // Skor
            let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
            liveScoreEl.innerHTML = scoreText;
            liveScoreEl.style.display = "block";

            // Status babak
            let statusText = event.status.description || "1st Half";
            matchStatusEl.innerHTML = statusText;
            matchStatusEl.style.display = "block";

            // --- Hitung menit pertandingan ---
            let minute = 0;
            if (event.status.minute !== undefined && event.status.minute !== null) {
                minute = event.status.minute;
            } else {
                const kickoff = new Date(event.startTimestamp * 1000).getTime();
                const now = new Date().getTime();
                const diff = Math.floor((now - kickoff) / 60000);
                minute = diff > 0 ? diff : 0;
            }

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

// --- Fungsi Render Match Box ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak") {
    const html = `
    <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox">
        <div class="countdown" id="countdown${matchKey}"></div>
        <div class="live-container" id="liveContainer${matchKey}" style="text-align:center; height:20px;">
            <span id="liveStatus${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
        </div>
        <div class="club1" style="position: relative; z-index: 1;">
            <br/>
            <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
                <br/><br/>
                <strong id="formattedTime${matchKey}" style="color: red;"></strong>
            </div>
        </div>
        <div class="club">
            <center>
                <span id="league${matchKey}" style="position:relative; top:5px; left:-11px; font-weight:bold; font-size:12px; color:white;">NAMA LIGA</span>
                <div id="liveScore${matchKey}" style="position:relative; top:0px; left:0px;font-size:20px; font-weight:bold; color:orange; text-align:center;"></div>  
                <div id="matchStatus${matchKey}" style="font-size:10px; font-weight:bold; color:orange; text-align:center; margin:-1px 1px;"></div>
                <div id="matchMinute${matchKey}" style="font-size:12px; font-weight:bold; color:lime; text-align:center; margin:2px 0;"></div> 
                <font id="teams${matchKey}" style="font-size:15px; font-weight:bold">NAMA CLUB VS NAMA CLUB</font><br>
                <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;"></div>
            </center>
        </div>
        <img id="logoHome${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; left:10%; border-radius:5px;">
        <img id="logoAway${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; right:10%; border-radius:5px;">
        <center>
            <span style="font-size: large;">
                ${serverFuncs.map((fn, i) => `
                    <a class="tv" href="javascript:${fn}();"><b><span>SERVER${i+1}</span></b></a>
                `).join(" ")}
            </span>
        </center><br>
    </div>
    <script>loadSofaScore(${matchId}, "${matchKey}");<\/script>
    `;

    document.write(html);
}
