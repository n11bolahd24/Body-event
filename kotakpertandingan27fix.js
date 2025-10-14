
// --- fungsi asli (placeholder) ---
function loadSofaScore(matchId, matchKey) {
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}



// --- fungsi utama render box ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", kickoffTime) {
  const kickoff = new Date(kickoffTime);
  const now = new Date();

  // hitung sisa waktu
  const selisihMs = kickoff - now;

  // buat elemen utama
  const container = document.getElementById("matches");
  if (!container) {
    console.error("❌ Tidak ada div#matches di halaman");
    return;
  }

  const matchBox = document.createElement("div");
  matchBox.className = `${boxClass} matchbox`;
  matchBox.id = `match${matchKey}`;
  matchBox.innerHTML = `
    <div class="countdown" id="countdown${matchKey}" style="color:white;font-weight:bold;"></div>
    <div class="live-container" id="liveContainer${matchKey}" style="text-align:center; height:20px;">
      <span id="liveStatus${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
    </div>
    <div class="club">
      <center>
        <span id="league${matchKey}" style="position:relative; top:5px; left:-11px; font-weight:bold; font-size:12px; color:white;">NAMA LIGA</span>
        <div id="liveScore${matchKey}" style="font-size:20px; font-family:'Arial', sans-serif; font-weight:bold; color:orange;"></div>
        <font id="teams${matchKey}" style="font-size:15px; font-weight:bold">NAMA CLUB VS NAMA CLUB</font><br>
        <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;"></div>
      </center>
    </div>
    <center>
      <div id="serverContainer${matchKey}" style="display:none; margin-top:5px;">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();" style="margin:3px; color:yellow; text-decoration:none;">
            <b><span>SERVER ${i+1}</span></b>
          </a>
        `).join(" ")}
      </div>
    </center>
  `;

  container.appendChild(matchBox);
  loadSofaScore(matchId, matchKey);

  // tampilkan waktu kickoff
  document.getElementById(`kickoff${matchKey}`).innerText =
    "Kickoff: " + kickoff.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  // fungsi countdown
  function updateCountdown() {
    const now = new Date();
    const selisih = kickoff - now;
    const countdownEl = document.getElementById(`countdown${matchKey}`);
    const serverBox = document.getElementById(`serverContainer${matchKey}`);

    if (selisih <= 0) {
      countdownEl.innerText = "KICKOFF!";
      serverBox.style.display = "block"; // link server muncul saat mulai
      clearInterval(timer);
    } else {
      const menit = Math.floor(selisih / 60000);
      const detik = Math.floor((selisih % 60000) / 1000);
      countdownEl.innerText = `Kickoff dalam ${menit}m ${detik}s`;
    }
  }

  // update tiap 1 detik
  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
}

