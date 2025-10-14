<!-- SCRIPT JADWAL PERTANDINGAN DENGAN DELAY LINK SERVER -->
<script>
// === Fungsi Membuat Countdown ===
function createCountdown(targetDate, countdownId, liveContainerId, kickoffId, matchBoxId) {
    var countdownElement = document.getElementById(countdownId);
    var liveContainer = document.getElementById(liveContainerId);
    var kickoffElement = document.getElementById(kickoffId);
    var matchBox = document.getElementById(matchBoxId);

    function updateCountdown() {
        var now = new Date().getTime();
        var distance = targetDate - now;

        if (distance <= 0) {
            countdownElement.style.display = "none";
            liveContainer.style.display = "block";
            kickoffElement.innerHTML = "LIVE";
            kickoffElement.style.color = "#00ff00";
            matchBox.classList.add("live");
            clearInterval(interval);
        } else {
            var hours = Math.floor(distance / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);
            countdownElement.innerHTML = 
                (hours > 0 ? hours + "j " : "") + minutes + "m " + seconds + "d";
        }
    }

    updateCountdown();
    var interval = setInterval(updateCountdown, 1000);
}

// === Fungsi Render Match (versi lengkap + delay tombol server) ===
function renderMatch(matchId, status, servers, containerId, tampilMenit = 15) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // struktur dasar tampilan kotak
    container.innerHTML = `
      <div style="background:#333;border-radius:10px;padding:10px;text-align:center;color:white;">
        <div id="liga${matchId}" style="font-size:12px;opacity:0.7;">Nama Liga</div>
        <div id="judul${matchId}" style="font-size:14px;font-weight:bold;">Nama Club vs Nama Club</div>
        <div id="count${matchId}" style="margin:5px 0;color:#aaa;"></div>
        <div id="kick${matchId}" style="margin-bottom:5px;"></div>
        <div id="live${matchId}" style="display:none;">
          ${servers.map((srv, i) => `<button id="btn${matchId}_${i}" style="margin:3px;background:#000;color:white;border:1px solid #00bcd4;padding:4px 10px;border-radius:5px;cursor:pointer;">SERVER ${i+1}</button>`).join('')}
        </div>
      </div>
    `;

    // ambil data kickoff dari API sofascore
    fetch(`https://api.sofascore.com/api/v1/event/${matchId}`)
      .then(res => res.json())
      .then(data => {
          const event = data.event;
          const startTime = new Date(event.startTimestamp * 1000);
          document.getElementById("liga" + matchId).textContent = event.tournament.name;
          document.getElementById("judul" + matchId).textContent =
              event.homeTeam.name + " vs " + event.awayTeam.name;

          // buat countdown
          createCountdown(startTime, "count" + matchId, "live" + matchId, "kick" + matchId, containerId);

          // delay link server
          const tombolServer = container.querySelectorAll("button");
          const info = document.createElement("div");
          info.id = "infoLink" + matchId;
          info.style.textAlign = "center";
          info.style.fontSize = "12px";
          info.style.color = "gray";
          info.style.marginTop = "4px";
          info.style.fontStyle = "italic";
          container.appendChild(info);

          tombolServer.forEach(btn => btn.style.display = "none");

          const now = new Date();
          const tampilSebelum = tampilMenit * 60 * 1000;
          const selisih = startTime - now;

          if (selisih > tampilSebelum) {
              const menitTunggu = Math.ceil((selisih - tampilSebelum) / 60000);
              info.textContent = `🔒 Server muncul ${menitTunggu} menit sebelum kickoff`;

              setTimeout(() => {
                  tombolServer.forEach(btn => btn.style.display = "inline-block");
                  info.remove();
              }, selisih - tampilSebelum);
          } else {
              tombolServer.forEach(btn => btn.style.display = "inline-block");
              info.remove();
          }
      })
      .catch(err => {
          console.error("Gagal ambil jadwal", err);
      });
}

// === Contoh Penggunaan ===
// Format: renderMatch(matchId, status, ["ch1","ch2"], "idKotak", menitDelay);
renderMatch(13218604, "1", ["ch1", "ch20"], "kotak", 15);
</script>
