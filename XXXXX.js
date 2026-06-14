function renderMatch(
  id,
  competition,
  home,
  away,
  homeLogo,
  awayLogo,
  kickoff,
  servers = []
){

  const serverHtml = servers.map(server =>
    `<a class="tv" href="javascript:${server[1]}">
      <b><span>${server[0]}</span></b>
    </a>`
  ).join('');

  document.write(`
  <div class="kotak1" id="match${id}">
    <div class="countdown" id="countdown${id}"></div>

    <div class="live-container hidden" id="liveContainer${id}">
      <strong style="color:red;">🔴 LIVE NOW</strong>
    </div>

    <div class="club">
      <center>
        <font style="font-weight:bold">${competition}</font><br>
        <div id="kickoff${id}"></div>
        <font style="font-weight:bold">${home} vs ${away}</font>
      </center>
    </div>

    <img src="${homeLogo}"
      style="position:absolute;height:50px;width:50px;top:25%;left:10%;border-radius:5px;">

    <img src="${awayLogo}"
      style="position:absolute;height:50px;width:50px;top:25%;right:10%;border-radius:5px;">

    <center>
      <span style="font-size:large;">
        ${serverHtml}
      </span>
    </center>
    <br>
  </div>
  `);

  createCountdown(
    new Date(kickoff).getTime(),
    `countdown${id}`,
    `liveContainer${id}`,
    `kickoff${id}`,
    `match${id}`
  );
}
