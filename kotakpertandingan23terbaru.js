// --- isi asli Matchxsofascore13.js ---
// (biarkan semua fungsi loadSofaScore dan utility-nya tetap ada di sini)

function loadSofaScore(matchId, matchKey) {
  // ... isi asli script Anda ...
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
  // contoh simulasi (hapus dan ganti pakai fetch asli Anda)
  document.getElementById("teams" + matchKey).textContent = "Arsenal vs Chelsea";
  document.getElementById("league" + matchKey).textContent = "Premier League";
  document.getElementById("liveScore" + matchKey).textContent = "0 - 0";
}



// --- Fungsi utama untuk menampilkan box SofaScore ---
function renderMatchBox(matchId, matchKey, boxClass = "kotak") {
  const container = document.getElementById("matches") || document.body;

  // HTML box dasar SofaScore
  const html = `
  <div class="${boxClass}" id="match${matchKey}">
    <div class="countdown" id="countdown${matchKey}"></div>
    <div class="live-container" id="liveContainer${matchKey}" style="text-align:center; height:20px;">
      <span id="liveStatus${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
    </div>
    <div class="club1" style="position: relative; z-index: 1;">
      <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); font-size: 29px;">
        <strong id="formattedTime${matchKey}" style="color: red;"></strong>
      </div>
    </div>
    <div class="club">
      <center>
        <span id="league${matchKey}" style="position:relative; top:5px; left:-11px; font-weight:bold; font-size:12px; color:white;">NAMA LIGA</span>
        <div id="liveScore${matchKey}" style="font-size:20px; font-family:'Arial', sans-serif; font-weight:bold; color:orange; text-align:center;"></div>  
        <div id="matchStatus${matchKey}" style="font-family:'Courier New', monospace; font-size:10px; font-weight:bold; color:orange; text-align:center;"></div>   
        <font id="teams${matchKey}" style="font-size:15px; font-weight:bold;">NAMA CLUB VS NAMA CLUB</font><br>
        <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; font-style:italic;"></div>
      </center>
    </div>
    <img id="logoHome${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; left:10%; border-radius:5px;">
    <img id="logoAway${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; right:10%; border-radius:5px;">
  </div>
  `;

  // Tambahkan ke halaman
  container.insertAdjacentHTML("beforeend", html);

  // Pastikan loadSofaScore dijalankan setelah elemen siap
  setTimeout(() => {
    if (typeof loadSofaScore === "function") {
      loadSofaScore(matchId, matchKey);
    } else {
      console.error("loadSofaScore() belum terdefinisi saat dipanggil.");
    }
  }, 200);
}



// --- Fungsi terpisah untuk countdown + tombol server ---
function renderTvServer(matchKey, serverFuncs, showTime) {
  // showTime = "YYYY-MM-DD HH:mm:ss" (zona waktu lokal)
  const parent = document.getElementById(`match${matchKey}`);
  if (!parent) {
    console.error("Match box not found:", matchKey);
    return;
  }

  const tvBox = document.createElement("div");
  tvBox.id = `tvBox${matchKey}`;
  tvBox.style.textAlign = "center";
  tvBox.style.marginTop = "10px";

  tvBox.innerHTML = `
    <span id="serverCountdown${matchKey}" style="color:yellow; font-weight:bold; font-size:14px;"></span>
    <div id="serverButtons${matchKey}" style="display:none; font-size:large; margin-top:5px;">
      ${serverFuncs.map((fn, i) => `
        <a class="tv" href="javascript:${fn}();" style="margin:0 3px;">
          <b><span>SERVER ${i + 1}</span></b>
        </a>
      `).join("")}
    </div>
  `;
  parent.appendChild(tvBox);

  // --- countdown otomatis waktu lokal ---
  const targetTime = new Date(showTime.replace(" ", "T"));
  const countdownEl = document.getElementById(`serverCountdown${matchKey}`);
  const buttonsEl = document.getElementById(`serverButtons${matchKey}`);

  function updateCountdown() {
    const now = new Date();
    const diff = targetTime - now;

    if (diff <= 0) {
      countdownEl.style.display = "none";
      buttonsEl.style.display = "block";
      buttonsEl.style.opacity = 0;
      buttonsEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, fill: "forwards" });
      clearInterval(timer);
    } else {
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      countdownEl.textContent = `Server aktif dalam ${hours}j ${minutes}m ${seconds}d (waktu lokal)`;
    }
  }

  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
}
