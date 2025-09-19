// --- Fungsi Update Live Score & Match Ended (pisah skor & status) ---
function monitorMatchStatus(matchId, boxId) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const matchBox = document.getElementById("match" + boxId);
  const liveContainer = document.getElementById("liveContainer" + boxId);
  const countdownEl = document.getElementById("countdown" + boxId);
  const liveScoreEl = document.getElementById("liveScore" + boxId);
  const liveStatusEl = document.getElementById("liveStatus" + boxId); // baru
  const finishedContainer = document.getElementById("finishedMatches");

  const interval = setInterval(async () => {
    const res = await fetch(eventUrl);
    const data = await res.json();
    const event = data.event;
    if (!event || !matchBox) return;

    // Update skor
    let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
    liveScoreEl.innerHTML = scoreText;

    // Update status babak / ended
    let statusText = "";
    if (event.status.type === "inprogress") {
      if (event.status.description) statusText = event.status.description; // misal 1st Half / 2nd Half
      countdownEl.innerHTML = "";
      liveContainer.classList.remove('hidden');
      liveContainer.classList.add('blink');
      liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW</strong>";
    } else if (event.status.type === "finished") {
      clearInterval(interval);
      if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);

      countdownEl.innerHTML = "";
      liveContainer.classList.remove('blink');
      liveContainer.style.animation = "none";
      liveContainer.classList.remove('hidden');
      liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";

      statusText = "FT"; // full time
      if (finishedContainer && matchBox.parentNode !== finishedContainer) {
        finishedContainer.appendChild(matchBox);
      }
    } else {
      // upcoming
      liveContainer.classList.add('hidden');
      statusText = "";
    }

    liveStatusEl.innerHTML = statusText; // update status di bawah skor
  }, 3000);
}
