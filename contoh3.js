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
// MATCH REVIEW SYSTEM (ADD ON)
// TIDAK MENGUBAH SCRIPT ASLI
// ===============================

function createMatchReview(matchBox) {

  if (!matchBox) return;

  const reviewContainer = document.getElementById("matchReview");

  if (!reviewContainer) return;


  const matchName = matchBox.querySelector(".club font:last-child")?.innerText || "Match";

  const competition = matchBox.querySelector(".club font:first-child")?.innerText || "";

  const kickoff = matchBox.querySelector(".club div")?.innerText || "";


  const homeLogo = matchBox.querySelectorAll("img")[0]?.src || "";
  const awayLogo = matchBox.querySelectorAll("img")[1]?.src || "";


  reviewContainer.insertAdjacentHTML("afterbegin", `

    <div class="review-box">

      <div class="review-title">
        📝 MATCH REVIEW
      </div>


      <div class="review-content">

        <img src="${homeLogo}" class="review-logo">


        <div class="review-info">

          <b>${competition}</b>
          <br>

          <span>${kickoff}</span>

          <h3>
            ${matchName}
          </h3>

          <div class="review-status">
            ⛔ FULL TIME
          </div>


          <div class="review-score">
            Review tersedia setelah pertandingan selesai
          </div>

        </div>


        <img src="${awayLogo}" class="review-logo">


      </div>


    </div>

  `);

}



// Monitor pertandingan selesai
const reviewWatcher = setInterval(() => {

  const finishedContainer = document.getElementById("finishedMatches");

  if (!finishedContainer) return;


  const matches = finishedContainer.querySelectorAll(".kotak1");


  matches.forEach(match => {

    if (!match.dataset.reviewCreated) {

      createMatchReview(match);

      match.dataset.reviewCreated = "true";

    }

  });


},2000);
