// === kotakpertandingan17fix-delay.js ===
// Versi dengan fitur tunda tombol server (atur menit di renderMatch)

// --- fungsi asli dari Matchxsofascore13.js (atau load SofaScore API) ---
function loadSofaScore(matchId, matchKey) {
  // fungsi ini akan dipanggil otomatis oleh script utama SofaScore kamu
  if (typeof fetch === "function") {
    const url = `https://api.sofascore.com/api/v1/event/${matchId}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!data.event) return;
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

        // Nama tim
        document.getElementById("teams" + matchKey).innerText =
          home.name + " VS " + away.name;

        // Logo tim
        document.getElementById("logoHome" + matchKey).src =
          "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
        document.getElementById("logoAway" + matchKey).src =
          "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

        // Kickoff time
        const kickoffDate = new Date(event.startTimestamp * 1000);
        const tanggal = kickoffDate.toLocaleDateString(undefined, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        const jam = kickoffDate.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        document.getElementById("kickoff" + matchKey).innerHTML =
          `${tanggal} | K.O ${jam}`;

        // Countdown
        startCountdown(kickoffDate.getTime(), matchKey);
      })
      .catch(() => console.log("Gagal load data SofaScore"));
  }
}

// --- fungsi countdown sederhana ---
function startCountdown(targetTime, matchKey) {
  const el = document.getElementById("countdown" + matchKey);
  if (!el) return;

  const timer = setInterval(() => {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff <= 0) {
      clearInterval(timer);
      el.innerText = "Kickoff!";
      return;
    }

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    el.innerText = `${h}H ${m}M ${s}S`;
  }, 1000);
}



// --- fungsi utama untuk generate box pertandingan ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tampilMenit = 15) {
  const html = `
  <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox" style="position:relative; padding:10px; border-radius:10px; background:#111; color:white; margin-bottom:10px;">
    <div class="countdown" id="countdown${matchKey}" style="text-align:center;font-weight:bold;margin-bottom:4px;"></div>
    <div class="live-container" id="liveContainer${matchKey}" style="text-align:center; height:20px;">
      <span id="liveStatus${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
    </div>
    <div class="club1" style="position: relative; z-index: 1;">
      <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
        <strong id="formattedTime${matchKey}" style="color: red;"></strong>
      </div>
    </div>
    <div class="club">
      <center>
        <span id="league${matchKey}" style="position:relative; top:5px; font-weight:bold; font-size:12px; color:white;">NAMA LIGA</span>
        <div id="liveScore${matchKey}" style="font-size:20px;font-family:'Arial';font-weight:bold;color:orange;text-align:center;"></div>  
        <div id="matchStatus${matchKey}" style="font-family:'Courier New';font-size:10px;font-weight:bold;color:orange;text-align:center;margin:1px;"></div>   
        <font id="teams${matchKey}" style="font-size:15px; font-weight:bold;">NAMA CLUB VS NAMA CLUB</font><br>
        <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;"></div>
      </center>
    </div>
    <img id="logoHome${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; left:10%; border-radius:5px;">
    <img id="logoAway${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; right:10%; border-radius:5px;">
    <center>
      <span id="serverContainer${matchKey}" style="font-size: large; display:none;">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();" style="margin:5px;display:inline-block;padding:6px 12px;background:#ff6600;color:white;border-radius:6px;text-decoration:none;font-weight:bold;">
            SERVER ${i+1}
          </a>
        `).join(" ")}
      </span>
    </center><br>
  </div>
  <script>loadSofaScore(${matchId}, "${matchKey}");<\/script>
  `;

  document.write(html);

  // tampilkan tombol server setelah menit yang diatur
  setTimeout(function () {
    var el = document.getElementById("serverContainer" + matchKey);
    if (el) el.style.display = "inline-block";
  }, tampilMenit * 60000); // menit ke milidetik
}
