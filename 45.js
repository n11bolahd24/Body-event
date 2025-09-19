// --- Fungsi Update Live Score & Pindah Match Ended ---
function monitorMatchStatus(matchId, boxId) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const interval = setInterval(async () => {
    const res = await fetch(eventUrl);
    const data = await res.json();
    const event = data.event;

    const liveContainer = document.getElementById("liveContainer" + boxId);
    const statusEl = document.getElementById("status" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchBox = document.getElementById("match" + boxId);
    const finishedContainer = document.getElementById("finishedMatches");

    if (!event || !matchBox || !finishedContainer) return;

    // --- Jika pertandingan LIVE ---
    if (event.status.type === "inprogress") {
      liveContainer.classList.remove("hidden");
      liveContainer.classList.add("blink");
      liveContainer.innerHTML = "<strong style='color:red;'>🔴 LIVE NOW</strong>";
      countdownEl.innerText = "";

      // Update skor + babak
      let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
      if (event.status.description) {
        scoreText += ` <span style="font-size:12px; color:#ffcc00;">(${event.status.description})</span>`;
      }
      liveScoreEl.innerHTML = scoreText;
    }

    // --- Jika pertandingan FINISHED ---
    if (event.status.type === "finished") {
      clearInterval(interval);

      // Ganti LIVE NOW menjadi MATCH ENDED di posisi yang sama
      liveContainer.classList.remove("blink");
      liveContainer.innerHTML = "<strong style='color:gray;'>⛔ MATCH ENDED ⛔</strong>";
      countdownEl.innerText = ""; // tetap kosong
      statusEl.innerText = "⛔ MATCH ENDED ⛔";

      // Skor fulltime tetap tampil + babak terakhir (FT)
      let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
      if (event.status.description) {
        scoreText += ` <span style="font-size:12px; color:#ffcc00;">(${event.status.description})</span>`;
      }
      liveScoreEl.innerHTML = scoreText;

      // Pindahkan kotak pertandingan ke container Match Ended (opsional)
      if (matchBox.parentNode.id !== "finishedMatches") {
        finishedContainer.appendChild(matchBox);
      }
    }
  }, 3000);
}
