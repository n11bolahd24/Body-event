<script>
// --- fungsi load data dari Sofascore ---
function loadSofaScore(matchId, matchKey) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  fetch(eventUrl)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      const home = event.homeTeam;
      const away = event.awayTeam;

      // Nama & logo liga
      const leagueEl = document.getElementById("league" + matchKey);
      if (leagueEl) {
        leagueEl.innerHTML = `
        <span style="display:inline-flex;align-items:center;">
          <img src="https://api.sofascore.app/api/v1/unique-tournament/${event.tournament.uniqueTournament.id}/image/dark"
               alt="${event.tournament.name}"
               style="height:18px;width:18px;margin-right:4px;">
          <span>${event.tournament.name}</span>
        </span>`;
      }

      // Waktu kickoff otomatis zona waktu pengunjung
      const kickoffDate = new Date(event.startTimestamp * 1000);
      const tanggal = kickoffDate.toLocaleDateString(undefined, {
        day: '2-digit', month: 'long', year: 'numeric'
      });
      const jam = kickoffDate.toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit', hour12: false
      });
      document.getElementById("kickoff" + matchKey).innerHTML = `${tanggal} | K.O ${jam}`;

      // Nama tim
      document.getElementById("teams" + matchKey).innerText = home.name + " VS " + away.name;

      // Logo tim
      document.getElementById("logoHome" + matchKey).src =
        "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
      document.getElementById("logoAway" + matchKey).src =
        "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

      // Countdown
      startCountdown(kickoffDate.getTime(), matchKey);
    })
    .catch(err => console.error("Gagal load SofaScore:", err));
}

// --- fungsi countdown ---
function startCountdown(targetTime, boxId) {
  const countdownId = "countdown" + boxId;
  window["countdown_" + boxId] = setInterval(function () {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance < 0) {
      clearInterval(window["countdown_" + boxId]);
      const countdownEl = document.getElementById(countdownId);
      if (countdownEl) countdownEl.innerHTML = "";
      return;
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const el = document.getElementById(countdownId);
    if (el) el.innerText = `${hours}H ${minutes}M ${seconds}S`;
  }, 1000);
}

// --- fungsi utama render box pertandingan ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tampilMenit = 0) {
  const html = `
  <div class="${boxClass}" id="match${matchKey}">
    <div class="countdown" id="countdown${matchKey}" style="font-weight:bold;color:yellow;text-align:center;"></div>
    <div class="live-container" id="liveContainer${matchKey}" style="text-align:center;height:20px;">
      <span id="liveStatus${matchKey}" style="font-weight:bold;"></span>
    </div>

    <div class="club">
      <center>
        <span id="league${matchKey}" style="font-weight:bold;font-size:12px;color:white;">LIGA</span>
        <div id="liveScore${matchKey}" style="font-size:20px;font-weight:bold;color:orange;text-align:center;"></div>  
        <div id="matchStatus${matchKey}" style="font-size:10px;font-weight:bold;color:orange;text-align:center;"></div>   
        <font id="teams${matchKey}" style="font-size:15px;font-weight:bold;">TEAM VS TEAM</font><br>
        <div id="kickoff${matchKey}" style="font-size:12px;color:white;text-align:center;font-style:italic;"></div>
      </center>
    </div>

    <img id="logoHome${matchKey}" style="position:absolute;height:55px;width:55px;top:20%;left:10%;border-radius:5px;">
    <img id="logoAway${matchKey}" style="position:absolute;height:55px;width:55px;top:20%;right:10%;border-radius:5px;">

    <center>
      <span style="font-size:large;" id="servers${matchKey}">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" id="srv${matchKey}_${i}" href="javascript:${fn}();" style="display:none;"><b><span>SERVER ${i + 1}</span></b></a>
        `).join(" ")}
      </span>
    </center>
    <br>
  </div>
  `;

  document.write(html);

  // --- panggil sofascore ---
  window.addEventListener("load", () => {
    loadSofaScore(matchId, matchKey);

    // --- kontrol waktu tampil tombol server ---
    const tampilSebelum = tampilMenit * 60 * 1000;
    const serverButtons = document.querySelectorAll(`#match${matchKey} .tv`);
    if (!serverButtons.length) return;

    fetch(`https://api.sofascore.com/api/v1/event/${matchId}`)
      .then(res => res.json())
      .then(data => {
        const kickoff = new Date(data.event.startTimestamp * 1000);

        const updateVisibility = () => {
          const now = new Date();
          const distance = kickoff - now;
          if (distance <= tampilSebelum || data.event.status.type === "inprogress") {
            serverButtons.forEach(btn => (btn.style.display = "inline-block"));
          } else {
            serverButtons.forEach(btn => (btn.style.display = "none"));
          }
        };

        updateVisibility();
        setInterval(updateVisibility, 30000);
      })
      .catch(err => console.warn("Gagal ambil data kickoff:", err));
  });
}
</script>
