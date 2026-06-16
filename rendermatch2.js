function createCountdown(
  targetDate,
  countdownId,
  liveContainerId,
  kickoffId,
  matchBoxId
) {
  const countdownElement = document.getElementById(countdownId);
  const liveContainer = document.getElementById(liveContainerId);
  const kickoffElement = document.getElementById(kickoffId);
  const matchBox = document.getElementById(matchBoxId);

  if (!countdownElement || !liveContainer || !kickoffElement || !matchBox) return;

  const serverButtons = matchBox.querySelectorAll(".tv");

  // STATUS SERVER TEXT
  const serverStatus = document.createElement("div");
  serverStatus.style.textAlign = "center";
  serverStatus.style.marginTop = "6px";
  serverStatus.style.fontWeight = "bold";
  serverStatus.style.fontSize = "12px";
  matchBox.appendChild(serverStatus);

  function setServerState(state) {
    serverButtons.forEach(btn => {
      if (state === "active") {
        btn.classList.remove("disabled");
      } else {
        btn.classList.add("disabled");
      }
    });

    if (state === "ready") {
      serverStatus.innerHTML = "⏳ SERVER BELUM SIAP";
      serverStatus.style.color = "#ffcc00";
    }

    if (state === "active") {
      serverStatus.innerHTML = "🔴 SERVER AKTIF";
      serverStatus.style.color = "#00ff7b";
    }

    if (state === "ended") {
      serverStatus.innerHTML = "⛔ SERVER TUTUP";
      serverStatus.style.color = "#ff4d4d";
    }
  }

  const countdown = setInterval(() => {
    const now = Date.now();
    const distance = targetDate - now;
    const matchEnd = targetDate + (2 * 60 * 60 * 1000);

    // ⏳ BEFORE MATCH
    if (distance > 0) {

      setServerState("ready");

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      countdownElement.innerHTML =
        days + "D - " + hours + "H - " + minutes + "M - " + seconds + "S";
    }

    // 🔴 LIVE
    else if (now < matchEnd) {

      setServerState("active");

      countdownElement.innerHTML = "";

      liveContainer.classList.remove("hidden");
      liveContainer.classList.add("blink");

      liveContainer.innerHTML =
        "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW</strong>";
    }

    // ⛔ END
    else {

      setServerState("ended");

      clearInterval(countdown);

      countdownElement.innerHTML = "";

      liveContainer.classList.remove("blink");
      liveContainer.style.animation = "none";
      liveContainer.classList.remove("hidden");

      liveContainer.innerHTML =
        "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

      const finishedContainer = document.getElementById("finishedMatches");

      if (finishedContainer) {
        finishedContainer.appendChild(matchBox);
      }
    }

  }, 1000);

  const kickoffDate = new Date(targetDate);

  kickoffElement.innerHTML =
    kickoffDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }) +
    " | K.O " +
    kickoffDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
}


// ===============================
// RENDER MATCH (TIDAK DIUBAH)
// ===============================
function renderMatch({
  no,
  date,
  competition,
  home,
  away,
  homeLogo,
  awayLogo,
  servers = []
}) {

  const container = document.getElementById("matchContainer");
  if (!container) return;

  const serverHTML = servers.map((func, i) => `
    <a class="tv" href="javascript:${func}();">
      <b>
        <span style="border:none;color:white;padding:0 10px 0 6px;">
          SERVER${i + 1}
        </span>
      </b>
    </a>
  `).join("");

  container.insertAdjacentHTML("beforeend", `
    <div class="kotak1" id="match${no}">

      <div class="countdown" id="countdown${no}"></div>

      <div class="live-container hidden" id="liveContainer${no}"></div>

      <div class="club" style="text-align:center;">
        <b>${competition}</b><br>
        <div id="kickoff${no}"></div>
        <b>${home} vs ${away}</b>
      </div>

      <img src="${homeLogo}" style="position:absolute;height:50px;width:50px;top:25%;left:10%;">
      <img src="${awayLogo}" style="position:absolute;height:50px;width:50px;top:25%;right:10%;">

      <center>
        ${serverHTML}
      </center>

      <br>
    </div>
  `);

  createCountdown(
    new Date(date).getTime(),
    `countdown${no}`,
    `liveContainer${no}`,
    `kickoff${no}`,
    `match${no}`
  );
}
