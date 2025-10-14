// --- isi asli Matchxsofascore13.js ---
// (biarkan semua fungsi loadSofaScore dan utility-nya tetap ada di sini)

// contoh placeholder (punya Anda pasti lebih panjang)
function loadSofaScore(matchId, matchKey) {
  // ... isi asli dari script Anda ...
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}

function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", serverVisibleTime = null) {
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
        <div id="liveScore${matchKey}" style="position:relative; top:0px; left:0px;font-size:20px; font-family:'Arial', sans-serif; font-weight:bold; color:orange; text-align:center;"></div>  
        <div id="matchStatus${matchKey}" style="font-family:'Courier New', monospace; font-size:10px; font-weight:bold; color:orange; text-align:center; margin:-1px 1px;"></div>   
        <font id="teams${matchKey}" style="font-size:15px; font-weight:bold">NAMA CLUB VS NAMA CLUB</font><br>
        <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;"></div>
      </center>
    </div>
    <img id="logoHome${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; left:10%; border-radius:5px;">
    <img id="logoAway${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; right:10%; border-radius:5px;">
    <center>
      <div id="serverCountdown${matchKey}" style="color:yellow; font-weight:bold; margin-top:5px;"></div>
      <div id="serverLinks${matchKey}" style="font-size: large; display:none;">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();"><b><span>SERVER ${i + 1}</span></b></a>
        `).join(" ")}
      </div>
    </center><br>
  </div>
  `;

  // ✅ Tambahkan ke elemen container, misal <div id="matches"></div>
  const container = document.getElementById("matches");
  if (container) {
    container.insertAdjacentHTML("beforeend", html);
  } else {
    console.warn("renderMatch: container #matches tidak ditemukan");
  }

  // Panggil loadSofaScore (pasti sudah terdefinisi di script utama)
  if (typeof loadSofaScore === "function") {
    loadSofaScore(matchId, matchKey);
  } else {
    console.error("Fungsi loadSofaScore belum tersedia");
  }

  // --- Countdown ke waktu tampil server ---
  if (serverVisibleTime) {
    const targetTime = new Date(serverVisibleTime).getTime();
    const countdownEl = () => document.getElementById("serverCountdown" + matchKey);
    const serverLinksEl = () => document.getElementById("serverLinks" + matchKey);

    const updateCountdown = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        clearInterval(timer);
        if (countdownEl()) countdownEl().style.display = "none";
        if (serverLinksEl()) serverLinksEl().style.display = "inline-block";
        return;
      }

      const minutes = String(Math.floor(diff / 60000)).padStart(2, '0');
      const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      const text = `Server aktif dalam ${minutes}:${seconds}`;
      if (countdownEl()) countdownEl().textContent = text;
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
  } else {
    const el = document.getElementById("serverLinks" + matchKey);
    if (el) el.style.display = "inline-block";
  }
}
