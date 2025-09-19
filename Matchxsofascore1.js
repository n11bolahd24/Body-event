// --- Fungsi untuk membuat kotak pertandingan ---
function createMatchBox(matchId, boxId, servers = []) {
    const container = document.createElement("div");
    container.className = "kotak";
    container.id = "match" + boxId;

    container.innerHTML = `
        <div class="kotak" id="match1" class="kotak matchbox">
        <div class="countdown" id="countdown${boxId}"></div>
        <div class="live-container" id="liveContainer${boxId}" style="text-align:center; height:20px;">
            <span id="liveStatus${boxId}" style="display:inline-block; width:150px; font-weight:bold;"></span>
        </div>
        <div class="club1" style="position: relative; z-index: 1;">
            <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
                <strong id="formattedTime${boxId}" style="color: red;"></strong>
            </div>
        </div>
        <div class="club">
            <center>  
                <img id="leagueLogo${boxId}" style="height:20px; vertical-align:middle; margin-right:5px;">
                <font id="league${boxId}" style="font-weight:bold">NAMA LIGA</font><br>
                <div id="liveScore${boxId}" style="font-size:10px; font-weight:bold; color:orange; text-align:center; margin:1px 0;"></div>  
                <div id="matchStatus${boxId}" style="font-size:10px; font-weight:bold; color:orange; text-align:center; margin:1px 0;"></div>   
                <font id="teams${boxId}" style="font-weight:bold">NAMA CLUB VS NAMA CLUB</font><br>
                <div id="kickoff${boxId}" style="font-size:12px; color:white; text-align:center; margin:1px 0;"></div>
            </center>
        </div>
        <img id="logoHome${boxId}" style="position:absolute; height:50px; width:50px; top:25%; left:10%; border-radius:5px;">
        <img id="logoAway${boxId}" style="position:absolute; height:50px; width:50px; top:25%; right:10%; border-radius:5px;">
        <center>
            <span style="font-size: large;" id="servers${boxId}">
                ${servers.map((s,i)=>`<a class="tv" href="javascript:${s}();"><b><span>SERVER${i+1}</span></b></a>`).join(" ")}
            </span>
        </center><br>
    `;

    document.getElementById("matchesContainer").appendChild(container);
    loadSofaScore(matchId, boxId);
}

// --- Fungsi utama load Sofascore (dari script kamu yang udah diedit dengan zona waktu otomatis) ---
function loadSofaScore(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;

    fetch(eventUrl)
        .then(res => res.json())
        .then(data => {
            const event = data.event;
            const home = event.homeTeam;
            const away = event.awayTeam;

            // Nama liga + logo liga
            document.getElementById("league" + boxId).innerText = event.tournament.name;
            document.getElementById("leagueLogo" + boxId).src = 
                "https://api.sofascore.app/api/v1/unique-tournament/" + event.tournament.uniqueTournament.id + "/image";

            // Kickoff otomatis sesuai zona waktu user
            let kickoffDate = new Date(event.startTimestamp * 1000);
            let tanggal = kickoffDate.toLocaleDateString(undefined, {
                day: "2-digit", month: "long", year: "numeric"
            });
            let jam = kickoffDate.toLocaleTimeString(undefined, {
                hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short"
            });
            document.getElementById("kickoff" + boxId).innerText = `${tanggal} | K.O ${jam}`;

            // Nama tim
            document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;

            // Logo tim
            document.getElementById("logoHome" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
            document.getElementById("logoAway" + boxId).src =
                "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

            // Countdown + status live
            startCountdown(kickoffDate.getTime(), boxId);
            monitorMatchStatus(matchId, boxId);
        });
}

// --- Monitor status pertandingan ---
function monitorMatchStatus(matchId, boxId) {
    const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
    const liveContainer = document.getElementById("liveContainer" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchStatusEl = document.getElementById("matchStatus" + boxId);

    const interval = setInterval(async () => {
        const res = await fetch(eventUrl);
        const data = await res.json();
        const event = data.event;
        if (!event) return;

        if (event.status.type === "upcoming") {
            liveContainer.classList.add("hidden");
            liveScoreEl.style.display = "none";
            matchStatusEl.style.display = "none";
        }

        if (event.status.type === "inprogress") {
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);
            countdownEl.innerHTML = "";
            liveContainer.classList.remove("hidden");
            liveContainer.innerHTML = `<strong style="color:white;-webkit-text-stroke:0.2px black;">🔴 LIVE NOW</strong>`;
            liveScoreEl.innerHTML = `${event.homeScore.current} - ${event.awayScore.current}`;
            liveScoreEl.style.display = "block";
            matchStatusEl.innerHTML = event.status.description || "1st Half";
            matchStatusEl.style.display = "block";
        }

        if (event.status.type === "finished") {
            clearInterval(interval);
            if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);
            countdownEl.innerHTML = "";
            liveContainer.innerHTML = `<strong style="color:white;-webkit-text-stroke:0.2px black;">⛔ MATCH ENDED ⛔</strong>`;
            liveScoreEl.innerHTML = `${event.homeScore.current} - ${event.awayScore.current}`;
            liveScoreEl.style.display = "block";
            matchStatusEl.innerHTML = "Full Time";
            matchStatusEl.style.display = "block";
        }
    }, 3000);
}

// --- Countdown ---
function startCountdown(targetTime, boxId) {
    const countdownId = "countdown" + boxId;
    window["countdown_" + boxId] = setInterval(function () {
        const now = new Date().getTime();
        const distance = targetTime - now;
        if (distance < 0) {
            clearInterval(window["countdown_" + boxId]);
            document.getElementById(countdownId).innerHTML = "";
            return;
        }
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        document.getElementById(countdownId).innerText =
            (days > 0 ? days + "D - " : "") + hours + "H - " + minutes + "M - " + seconds + "S";
    }, 1000);
              }
      
