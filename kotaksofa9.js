function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvServerTime = null) {
  const html = `
  <div id="match${matchKey}" class="${boxClass} matchbox">
    <div class="countdown" id="countdown${matchKey}"></div>
    <div id="liveContainer${matchKey}" style="text-align:center; height:20px;">
      <span style="display:inline-block; width:150px; font-weight:bold;"></span>
    </div>
    <div class="club1" style="position: relative; z-index: 1;">
      <br/>
      <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
        <br/><br/>
        <strong id="formattedTime${matchKey}" style="color: red;"></strong>
      </div>
    </div>
    <div class="club">
      <center>
        <span id="league${matchKey}" style="font-weight:bold; font-size:12px; color:white;">Loading...</span>
        <div id="liveScore${matchKey}" style="font-size:20px; font-weight:bold; color:orange;"></div>
        <div id="matchStatus${matchKey}" style="font-size:10px; font-weight:bold; color:orange;"></div>
        <font id="teams${matchKey}" style="font-size:15px; font-weight:bold;">Fetching match...</font><br>
        <div id="kickoff${matchKey}" style="font-size:12px; color:white; font-style:italic;"></div>

        <div id="tvCountdown${matchKey}" style="color:yellow; font-weight:bold; font-style:italic;"></div>

        <span style="font-size: large;">
          ${serverFuncs.map((fn, i) => `
            <a class="tv" id="tvServer${matchKey}_${i}" href="javascript:${fn}();"><b>SERVER ${i+1}</b></a>
          `).join(" ")}
        </span>
      </center>
    </div>
  </div>

  <script>
    setTimeout(function(){ loadSofaScore(${matchId}, "${matchKey}"); }, 500);
  <\/script>
  `;

  document.write(html);
}
