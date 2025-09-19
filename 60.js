// --- Fungsi Update Live Score & Match Ended (hanya saat live/finished) ---
function monitorMatchStatus(matchId, boxId) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const matchBox = document.getElementById("match" + boxId);
  const liveContainer = document.getElementById("liveContainer" + boxId);
  const countdownEl = document.getElementById("countdown" + boxId);
  const liveScoreEl = document.getElementById("liveScore" + boxId);
  const finishedContainer = document.getElementById("finishedMatches");

  const interval = setInterval(async () => {
    const res = await fetch(eventUrl);
    const data = await res.json();
    const event = data.event;
    if (!event || !matchBox) return;

    // Hanya tampilkan skor kalau pertandingan sedang berlangsung atau sudah selesai
    if (event.status.type === "inprogress" || event.status.type === "finished") {
      let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
      if (event.status.description) {
        scoreText += ` <span style="font-size:12px; color:#ffcc00;">(${event.status.description})</span>`;
      }
      liveScoreEl.innerHTML = scoreText;
    } else {
      // upcoming / belum kickoff → sembunyikan skor
      liveScoreEl.innerHTML = "";
    }

    if (event.status.type === "inprogress") {
      if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

      countdownEl.innerHTML = "";
      liveContainer.classList.remove('hidden');
      liveContainer.classList.add('blink');
      liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke: 0.2px black;'>🔴 LIVE NOW</strong>";

    } else if (event.status.type === "finished") {
      clearInterval(interval);
      if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

      countdownEl.innerHTML = "";
      liveContainer.classList.remove('blink');
      liveContainer.style.animation = "none";
      liveContainer.classList.remove('hidden');
      liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke: 0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

      if (finishedContainer && matchBox.parentNode !== finishedContainer) {
        finishedContainer.appendChild(matchBox);
      }
    } else {
      // upcoming / belum kickoff
      liveContainer.classList.add('hidden');
    }
  }, 3000);
                               }
        
