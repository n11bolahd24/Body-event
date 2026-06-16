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

  // 🔥 ambil semua tombol server di match ini
  const serverButtons = matchBox.querySelectorAll(".tv");

  function setServerState(enabled) {
    serverButtons.forEach(btn => {
      if (enabled) {
        btn.classList.remove("disabled");
      } else {
        btn.classList.add("disabled");
      }
    });
  }

  const countdown = setInterval(() => {
    const now = Date.now();
    const distance = targetDate - now;
    const matchEnd = targetDate + (2.5 * 60 * 60 * 1000); // 2.5 = 2 JAM 30 MENIT

    // ⏳ BEFORE KICKOFF
    if (distance > 0) {

      setServerState(false);

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      countdownElement.innerHTML =
        days + "D - " + hours + "H - " + minutes + "M - " + seconds + "S";

    }

    // 🔴 LIVE
    else if (now < matchEnd) {

      setServerState(true);

      countdownElement.innerHTML = "";

      liveContainer.classList.remove("hidden");
      liveContainer.classList.add("blink");

      liveContainer.innerHTML =
        "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW</strong>";

    }

    // ⛔ FINISHED
    else {

      setServerState(false);

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
// RENDER MATCH
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
    <a class="tv"
       href="javascript:${func}();">
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

      <div class="live-container hidden" id="liveContainer${no}">
        <strong style="color:red;">🔴 LIVE NOW</strong>
      </div>

      <div class="club1" style="position:relative;z-index:1;">
        <br>
      </div>

      <div class="club">
        <center>
          <font style="font-weight:bold">${competition}</font>
          <br>
          <div id="kickoff${no}"></div>
          <font style="font-weight:bold">${home} vs ${away}</font>
        </center>
      </div>

      <img src="${homeLogo}" style="position:absolute;height:50px;width:50px;top:25%;left:10%;border-radius:5px;">
      <img src="${awayLogo}" style="position:absolute;height:50px;width:50px;top:25%;right:10%;border-radius:5px;">

      <center>
        <span style="font-size:large;">
          ${serverHTML}
        </span>
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
