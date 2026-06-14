// ===============================
// MATCH SYSTEM FINAL
// ===============================

function createCountdown(targetDate, countdownId, liveContainerId, kickoffId, matchBoxId) {

    var countdownElement = document.getElementById(countdownId);
    var liveContainer = document.getElementById(liveContainerId);
    var kickoffElement = document.getElementById(kickoffId);
    var matchBox = document.getElementById(matchBoxId);

    if (!countdownElement || !liveContainer || !kickoffElement || !matchBox) return;

    let finished = false;

    var countdown = setInterval(function () {

        if (finished) return;

        var now = new Date().getTime();
        var distance = targetDate - now;
        var matchEnd = targetDate + (2 * 60 * 60 * 1000);

        if (distance > 0) {

            countdownElement.innerHTML =
                Math.floor(distance / 86400000) + "D " +
                Math.floor((distance % 86400000) / 3600000) + "H " +
                Math.floor((distance % 3600000) / 60000) + "M " +
                Math.floor((distance % 60000) / 1000) + "S";

        } else if (now < matchEnd) {

            countdownElement.innerHTML = "";
            liveContainer.classList.remove("hidden");
            liveContainer.innerHTML = "🔴 LIVE NOW";

        } else {

            finished = true;
            clearInterval(countdown);

            countdownElement.innerHTML = "";
            liveContainer.classList.remove("hidden");
            liveContainer.innerHTML = "⛔ MATCH ENDED ⛔";

            var finishedBox = document.getElementById("finishedMatches");
            if (finishedBox) finishedBox.appendChild(matchBox);
        }

    }, 1000);

    var d = new Date(targetDate);
    kickoffElement.innerHTML =
        d.toLocaleDateString("id-ID") +
        " | K.O " +
        d.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit"
        });
}


// ===============================
// RENDER MATCH (FIX KOTAK1 DI SINI)
// ===============================

function renderMatch(
    id,
    competition,
    home,
    away,
    homeLogo,
    awayLogo,
    kickoff,
    servers = []
) {

    let serverHtml = servers.map(s =>
        `<a class="tv" href="javascript:${s[1]}">
            <b><span>${s[0]}</span></b>
        </a>`
    ).join("");

    let html = `
    <div class="kotak1 match-box" id="match${id}">

        <div class="countdown" id="countdown${id}"></div>

        <div class="live-container hidden" id="liveContainer${id}">
            🔴 LIVE NOW
        </div>

        <div class="club">
            <center>
                <font style="font-weight:bold">${competition}</font><br>
                <div id="kickoff${id}"></div>
                <font style="font-weight:bold">${home} vs ${away}</font>
            </center>
        </div>

        <img src="${homeLogo}"
            style="position:absolute;height:50px;width:50px;top:25%;left:10%;border-radius:5px;">

        <img src="${awayLogo}"
            style="position:absolute;height:50px;width:50px;top:25%;right:10%;border-radius:5px;">

        <center>
            <span style="font-size:large;">
                ${serverHtml}
            </span>
        </center>

        <br>
    </div>
    `;

    document.getElementById("matchContainer").innerHTML += html;

    createCountdown(
        new Date(kickoff).getTime(),
        `countdown${id}`,
        `liveContainer${id}`,
        `kickoff${id}`,
        `match${id}`
    );
}
