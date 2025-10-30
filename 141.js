// --- isi asli Matchxsofascore.js ---
// (biarkan semua fungsi loadSofaScore dan utility-nya tetap ada di sini)

function loadSofaScore(matchId, matchKey) {
  // ... isi asli dari script Anda ...
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}
// =========================
// RENDER MATCH UNTUK EVENT 1
// =========================
function renderMatch1(matchId, matchKey, serverFuncs, boxClass = "kotak", tvServerTime = null) {
  const html = `
  <div class="${boxClass}" id="match1_${matchKey}" class="matchbox">
    <div class="countdown" id="countdown1_${matchKey}"></div>
    <div class="live-container" id="liveContainer1_${matchKey}" style="text-align:center; height:20px;">
      <span id="liveStatus1_${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
    </div>
    <div class="club1" style="position: relative; z-index: 1;">
      <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
        <br/><br/><strong id="formattedTime1_${matchKey}" style="color: red;"></strong>
      </div>
    </div>
    <div class="club">
      <center>
        <span id="league1_${matchKey}" style="font-weight:bold; font-size:12px; color:white;">Loading...</span>
        <div id="liveScore1_${matchKey}" style="font-size:20px; font-weight:bold; color:orange;"></div>  
        <div id="matchStatus1_${matchKey}" style="font-size:10px; font-weight:bold; color:orange;"></div>   
        <font id="teams1_${matchKey}" style="font-size:15px; font-weight:bold">Failed To Load !</font><br>
        <div id="kickoff1_${matchKey}" style="font-size:12px; color:white; font-style:italic;"></div>
        <div id="tvCountdown1_${matchKey}" style="margin-top:0px; color:yellow; font-weight:bold; font-style:italic"></div>
        <span style="font-size: large;">
          ${serverFuncs.map((fn, i) => `
            <a class="tv" id="tvServer1_${matchKey}_${i}" href="javascript:${fn}();">
              <b><span>SERVER ${i+1}</span></b>
            </a>
          `).join(" ")}
        </span>
      </center>
    </div>
  </div>
  <script>
    loadSofaScore(${matchId}, "1_${matchKey}");
  <\/script>
  `;
  document.write(html);
}

// =========================
// RENDER MATCH UNTUK EVENT 2
// =========================
function renderMatch2(matchId, matchKey, serverFuncs, boxClass = "kotak", tvServerTime = null) {
  const html = `
  <div class="${boxClass}" id="match2_${matchKey}" class="matchbox">
    <div class="countdown" id="countdown2_${matchKey}"></div>
    <div class="live-container" id="liveContainer2_${matchKey}" style="text-align:center; height:20px;">
      <span id="liveStatus2_${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
    </div>
    <div class="club1" style="position: relative; z-index: 1;">
      <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
        <br/><br/><strong id="formattedTime2_${matchKey}" style="color: red;"></strong>
      </div>
    </div>
    <div class="club">
      <center>
        <span id="league2_${matchKey}" style="font-weight:bold; font-size:12px; color:white;">Loading...</span>
        <div id="liveScore2_${matchKey}" style="font-size:20px; font-weight:bold; color:orange;"></div>  
        <div id="matchStatus2_${matchKey}" style="font-size:10px; font-weight:bold; color:orange;"></div>   
        <font id="teams2_${matchKey}" style="font-size:15px; font-weight:bold">Failed To Load !</font><br>
        <div id="kickoff2_${matchKey}" style="font-size:12px; color:white; font-style:italic;"></div>
        <div id="tvCountdown2_${matchKey}" style="margin-top:0px; color:yellow; font-weight:bold; font-style:italic"></div>
        <span style="font-size: large;">
          ${serverFuncs.map((fn, i) => `
            <a class="tv" id="tvServer2_${matchKey}_${i}" href="javascript:${fn}();">
              <b><span>SERVER ${i+1}</span></b>
            </a>
          `).join(" ")}
        </span>
      </center>
    </div>
  </div>
  <script>
    loadSofaScore(${matchId}, "2_${matchKey}");
  <\/script>
  `;
  document.write(html);
}
