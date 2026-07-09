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
    const matchEnd = targetDate + (3 * 60 * 60 * 1000); // 3 = 3 JAM

    // ⏳ BEFORE KICKOFF
    if (distance > 0) {

  // Aktifkan server 15 menit sebelum kickoff
  if (distance <= 30 * 60 * 1000) {
    setServerState(true);
  } else {
    setServerState(false);
  }

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

      // tetap aktifkan server walaupun match selesai
      setServerState(true);

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

  const serverHTML = servers.map((server, i) => `
  <a class="tv"
     href="javascript:${server.func}();">
    <b>
      <span style="border:none;color:white;padding:0 10px 0 6px;">
        ${server.name}
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

      <img src="${homeLogo}" style="position:absolute;height:50px;width:50px;top:25%;left:10%;">
      <img src="${awayLogo}" style="position:absolute;height:50px;width:50px;top:25%;right:10%;">

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

// ===============================
// MATCH PREVIEW (Klik kotak pertandingan)
// Tidak mengubah createCountdown()
// ===============================

document.addEventListener("click", function (e) {

    const match = e.target.closest(".kotak1");
    if (!match) return;

    const tv = document.getElementById("tv");
    if (!tv) return;

    const competition = match.querySelector(".club font:first-child")?.innerHTML || "";
    const kickoff = match.querySelector('[id^="kickoff"]')?.innerHTML || "";
    const teams = match.querySelector(".club font:last-child")?.innerHTML || "";

    const homeLogo = match.querySelectorAll("img")[0]?.src || "";
    const awayLogo = match.querySelectorAll("img")[1]?.src || "";

    tv.innerHTML = `
    <div id="previewBox" style="
        height:100%;
        background:#000;
        color:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        flex-direction:column;
        text-align:center;
        padding:15px;
    ">

        <div style="font-weight:bold;font-size:18px;color:#f7c82d;">
            ${competition}
        </div>

        <div style="margin-top:5px;">
            ${kickoff}
        </div>

        <div style="
            display:flex;
            align-items:center;
            justify-content:center;
            gap:20px;
            margin:15px 0;
        ">

            <img src="${homeLogo}" width="65">

            <div style="font-size:20px;font-weight:bold;">
                VS
            </div>

            <img src="${awayLogo}" width="65">

        </div>

        <div style="
            font-size:18px;
            font-weight:bold;
            margin-bottom:10px;
        ">
            ${teams}
        </div>

        <div id="previewCountdown"
             style="
                font-size:24px;
                font-weight:bold;
                color:#ffd700;
             ">
        </div>

    </div>
    `;

    const sourceCountdown = match.querySelector('[id^="countdown"]');
    const sourceLive = match.querySelector('[id^="liveContainer"]');

    function syncPreview(){

    const target = document.getElementById("previewCountdown");

    if(!target) return;

    // Kalau LIVE benar-benar tampil
    if(sourceLive &&
       !sourceLive.classList.contains("hidden")){

        target.innerHTML = sourceLive.innerHTML;

    }else{

        target.innerHTML = sourceCountdown.innerHTML;

    }

}

    syncPreview();

    clearInterval(window.previewInterval);

    window.previewInterval = setInterval(syncPreview,1000);

});
