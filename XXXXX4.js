function renderMatch({
  id,
  boxClass = "kotak1",
  competition,
  home,
  away,
  homeLogo,
  awayLogo,
  kickoff,
  servers = []
}) {

  let serverHTML = servers.map(s => `
    <a class="tv" href="javascript:${s[1]}">
      <b><span>${s[0]}</span></b>
    </a>
  `).join("");

  let html = `
  <div class="${boxClass}" id="match${id}">

      <div class="countdown" id="countdown${id}"></div>

      <div class="live-container hidden" id="liveContainer${id}">
        🔴 LIVE NOW
      </div>

      <div class="club">
        <center>
          <font style="font-weight:bold">${competition}</font><br>
          <div id="kickoff${id}"></div>
          <font style="font-weight:bold">${home} vs ${away}</font>
        </center>
      </div>

      <img src="${homeLogo}" style="position:absolute;height:50px;width:50px;top:25%;left:10%;border-radius:5px;">
      <img src="${awayLogo}" style="position:absolute;height:50px;width:50px;top:25%;right:10%;border-radius:5px;">

      <center>
        ${serverHTML}
      </center>

      <br>
  </div>
  `;

  document.getElementById("matchContainer")
    .insertAdjacentHTML("beforeend", html);

  setTimeout(() => {
    createCountdown(
      new Date(kickoff).getTime(),
      `countdown${id}`,
      `liveContainer${id}`,
      `kickoff${id}`,
      `match${id}`
    );
  }, 50);
}
