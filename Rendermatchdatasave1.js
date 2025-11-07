// --- Matchxsofascore13-save.js ---
// Gabungan renderMatch + auto save ke GitHub (via Cloudflare Worker)

// 🔹 Kirim data ke GitHub melalui Cloudflare Worker
async function saveMatchToGitHub(matchData) {
  try {
    const response = await fetch("https://matchdata.novendibagus5.workers.dev/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "matchdata.json", // file penyimpanan
        data: matchData
      })
    });

    console.log("✅ Data berhasil dikirim:", await response.text());
  } catch (error) {
    console.error("❌ Gagal kirim ke Worker:", error);
  }
}

// --- Ambil data Sofascore ---
function loadSofaScore(matchId, matchKey) {
  const eventUrl = `const eventUrl = `https://api.codetabs.com/v1/proxy?quest=https://api.sofascore.com/api/v1/event/${matchId}`;
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);

  fetch(eventUrl)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      const home = event.homeTeam;
      const away = event.awayTeam;

      // tampilkan data di halaman
      document.getElementById("league" + matchKey).innerHTML = `
        <span style="display:inline-flex;align-items:center;">
          <img src="https://api.sofascore.app/api/v1/unique-tournament/${event.tournament.uniqueTournament.id}/image/dark"
               alt="${event.tournament.name}"
               style="height:18px;width:18px;margin-right:4px;">
          <span>${event.tournament.name}</span>
        </span>`;

      document.getElementById("logoHome" + matchKey).src = "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
      document.getElementById("teamshome" + matchKey).innerText = home.name;
      document.getElementById("logoAway" + matchKey).src = "https://api.sofascore.app/api/v1/team/" + away.id + "/image";
      document.getElementById("teamsaway" + matchKey).innerText = away.name;

      const kickoffDate = new Date(event.startTimestamp * 1000);
      const tanggal = kickoffDate.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' });
      const jam = kickoffDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
      document.getElementById("kickoff" + matchKey).innerText = `${tanggal} | K.O ${jam}`;

      // 🔸 Simpan ke GitHub
      const matchData = {
        id: matchId,
        league: event.tournament.name,
        home: home.name,
        away: away.name,
        kickoff: `${tanggal} ${jam}`,
        homeLogo: `https://api.sofascore.app/api/v1/team/${home.id}/image`,
        awayLogo: `https://api.sofascore.app/api/v1/team/${away.id}/image`
      };

      saveMatchToGitHub(matchData);
    })
    .catch(err => console.error("Error load SofaScore:", err));
}

// --- Fungsi untuk generate box pertandingan ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvServerTime = null) {
  const html = `
  <div class="${boxClass}" id="match${matchKey}" 
     style="position:relative; display:flex; flex-direction:column; align-items:center; text-align:center;">

  <div class="countdown" id="countdown${matchKey}" style="position:absolute; top:8px; text-align:center;"></div>

  <div class="live-container" id="liveContainer${matchKey}" style="position:absolute; top:8px; text-align:center;">
    <div id="liveStatus${matchKey}" style="display:inline-block; font-weight:bold; color:red; font-size:16px;"></div>
  </div>

  <div class="club1" style="position: relative; z-index: 1;">
    <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
      <strong id="formattedTime${matchKey}" style="color: red;"></strong>
    </div>
  </div>
  
  <div class="club">
    <center>
      <div id="league${matchKey}" style="position:relative; top:15px; font-weight:bold; font-size:12px; color:white; text-align:center;">
        Refresh Or Setting Your DNS
      </div>
    </center>
  </div>

  <div style="display:flex; justify-content:space-between; align-items:center; width:100%; max-width:420px; margin-top:5px;">
    <div style="flex:1; display:flex; justify-content:flex-end; align-items:center; gap:8px;">
      <span id="teamshome${matchKey}" style="font-weight:bold; color:white; font-size:14px; text-align:right; max-width:105px; line-height:1.2;"></span>
      <img id="logoHome${matchKey}" style="height:45px; width:45px; border-radius:5px; margin-right:15px;">
    </div>

    <div id="liveScore${matchKey}" style="min-width:30px; text-align:center; font-size:20px; font-weight:bold; color:orange;">VS</div>

    <div style="flex:1; display:flex; justify-content:flex-start; align-items:center; gap:8px;">
      <img id="logoAway${matchKey}" style="height:45px; width:45px; border-radius:5px; margin-left:15px;">
      <span id="teamsaway${matchKey}" style="font-weight:bold; color:white; font-size:14px; text-align:left; max-width:105px; line-height:1.2;"></span>
    </div>
  </div>

  <div id="matchStatus${matchKey}" style="margin-top:-5px; font-family:'Courier New', monospace; font-size:10px; font-weight:bold; color:orange;">UP COMING</div>
  <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;"></div>

  <div id="tvCountdown${matchKey}" style="margin-top:3px; margin-bottom:3px; color: yellow; font-weight:bold; font-style:italic;"></div>

  <div style="font-size: large; margin-top:6px; padding-bottom:8px;">
    ${serverFuncs.map((fn, i) => `
      <a class="tv" id="tvServer${matchKey}_${i}" href="javascript:${fn}();">
        <b><span>SERVER ${i+1}</span></b>
      </a>
    `).join(" ")}
  </div>

  <script>
    loadSofaScore(${matchId}, "${matchKey}");
  <\/script>
  </div>
  `;

  document.write(html);
}
