function renderMatch({
  no,
  date,
  competition,
  home,
  away,
  homeLogo,
  awayLogo,
  servers = []
}) {

  const container = document.getElementById("matchContainer");

  let serverHTML = "";

  servers.forEach((func, i) => {
    serverHTML += `
      <a class="tv" href="javascript:${func}();">
        <b><span>SERVER${i + 1}</span></b>
      </a>
    `;
  });

  container.insertAdjacentHTML("beforeend", `
    <div class="kotak1" id="match${no}">
      <div class="countdown" id="countdown${no}"></div>

      <div class="live-container hidden"
           id="liveContainer${no}">
        <strong style="color:red;">🔴 LIVE NOW</strong>
      </div>

      <div class="club">
        <center>
          <font style="font-weight:bold">
            ${competition}
          </font><br>

          <div id="kickoff${no}"></div>

          <font style="font-weight:bold">
            ${home} vs ${away}
          </font>
        </center>
      </div>

      <img src="${homeLogo}"
           style="position:absolute;height:50px;width:50px;top:25%;left:10%;border-radius:5px;">

      <img src="${awayLogo}"
           style="position:absolute;height:50px;width:50px;top:25%;right:10%;border-radius:5px;">

      <center>
        <span style="font-size:large;">
          ${serverHTML}
        </span>
      </center>

      <br>
    </div>
  `);

  createCountdown(
    new Date(date).getTime(),
    `countdown${no}`,
    `liveContainer${no}`,
    `kickoff${no}`,
    `match${no}`
  );
}
