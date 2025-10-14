<script>
// --- fungsi renderMatch fix ---

function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", kickoffTime = null) {
  // buat kotak pertandingan
  const html = `
  <div class="${boxClass}" id="match${matchKey}">
    <center>
      <div id="teams${matchKey}" style="color:white;font-weight:bold;font-size:15px;">[Tim A vs Tim B]</div>
      <div id="kickoff${matchKey}" style="color:orange;font-size:13px;"></div>
      <div id="count${matchKey}" style="color:yellow;font-size:13px;margin-top:5px;"></div>
      <div id="server${matchKey}" style="display:none;margin-top:5px;">
        ${serverFuncs.map((fn, i)=>`<a class="tv" href="javascript:${fn}();" style="color:lime;">SERVER ${i+1}</a>`).join(" ")}
      </div>
    </center>
  </div>
  `;

  document.write(html); // pakai ini biar langsung muncul di Blogger

  // atur waktu server muncul
  if (!kickoffTime) return;

  const [jam, menit] = kickoffTime.split(":").map(Number);
  const now = new Date();
  const kickoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), jam, menit);
  const showTime = new Date(kickoff.getTime() - 15 * 60 * 1000);

  const countEl = document.getElementById("count" + matchKey);
  const serverEl = document.getElementById("server" + matchKey);
  const kickoffEl = document.getElementById("kickoff" + matchKey);
  kickoffEl.textContent = "Kickoff: " + kickoffTime + " WIB";

  function update() {
    const now = new Date();
    if (now >= kickoff) {
      serverEl.style.display = "block";
      countEl.innerHTML = "<b style='color:lime;'>LIVE SEKARANG!</b>";
      return;
    } else if (now >= showTime) {
      serverEl.style.display = "block";
      const sisa = Math.floor((kickoff - now) / 1000);
      const m = Math.floor(sisa / 60);
      const s = sisa % 60;
      countEl.innerHTML = `Kickoff dalam ${m}:${s.toString().padStart(2,"0")}`;
    } else {
      serverEl.style.display = "none";
      const sisa = Math.floor((showTime - now) / 1000);
      const m = Math.floor(sisa / 60);
      const s = sisa % 60;
      countEl.innerHTML = `Server muncul dalam ${m}:${s.toString().padStart(2,"0")}`;
    }
  }

  update();
  setInterval(update, 1000);
}
</script>
