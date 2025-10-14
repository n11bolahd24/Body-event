// --- tambahkan CSS langsung ke <head> ---
(function injectCSS() {
  const css = `
  .post-body img, .post-body .tr-caption-container {
    padding: 0;
    width:auto;
    max-width:100%;
    height:auto;
  }
  .tomboltv {
    background: #fff;
    border: 1px solid #d0cbcb;
    border-radius: .5em;
    color: #ff0000;
    display: inline-block;
    font: bold 17px Arial, sans-serif;
    margin: 0px;
    min-width:50px;
    padding: 2px 1px;
    text-align: center;
    text-decoration: none;
  }
  .tomboltv:hover {
    border-color: #fff;
    box-shadow: 0 1px 3px rgba(215, 56, 56, 0.6);
    color: #066496;
  }
  .club1 {
    display: block;
    margin: 5px 0;
    text-align: center;
    font-size: 15px;
    color: white;
  }
  .tv {
    background-image: linear-gradient(to right top, #000000, #000000, #00ccff);
    color: white;
    border: none;
    padding: 5px 6px;
    border-radius: 5px;
    font-size: 10px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin-left: 3px;
    margin-bottom: 2px;
    white-space: nowrap;
    display: inline-block;
  }
  .tv:hover {
    background-image: linear-gradient(to right, #ff0000, #00d0ff);
    color: white;
  }
  .countdown {
    font-weight: bold;
    color: orange;
    -webkit-text-stroke: 0.3px black;
    position: absolute;
    font-size: 13px;
    right: 50%;
    top: 5%;
    transform: translateX(50%);
    background-color: transparent;
    padding: 4px;
    border-radius: 5px;
    z-index: 1;
  }
  .live-container {
    color: red;
    position: absolute;
    font-size: 13px;
    right: 50%;
    top: 10%;
    transform: translateX(50%);
    z-index: 1;
    animation: blink 1.5s infinite ease-in-out;
  }
  @keyframes blink {
    0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; }
  }
  [id^="tvCountdown"] {
    font-size: 12px;
    color: yellow;
    text-align: center;
    margin-top: 5px;
  }`;
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);
})();

// --- fungsi load SofaScore tetap ---
function loadSofaScore(matchId, matchKey) {
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}

// --- fungsi renderMatch (versi aman Blogger) ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvStartTime = null) {
  function createMatchBox() {
    const wrapper = document.createElement("div");
    wrapper.className = boxClass;
    wrapper.id = "match" + matchKey;
    wrapper.innerHTML = `
      <div class="countdown" id="countdown${matchKey}"></div>
      <div class="live-container" id="liveContainer${matchKey}" style="text-align:center; height:20px;">
        <span id="liveStatus${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
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
          <span id="league${matchKey}" style="position:relative; top:5px; left:-11px; font-weight:bold; font-size:12px; color:white;">NAMA LIGA</span>
          <div id="liveScore${matchKey}" style="position:relative; top:0px; left:0px;font-size:20px; font-family:'Arial', sans-serif; font-weight:bold; color:orange; text-align:center;"></div>  
          <div id="matchStatus${matchKey}" style="font-family:'Courier New', monospace; font-size:10px; font-weight:bold; color:orange; text-align:center; margin:-1px 1px;"></div>   
          <font id="teams${matchKey}" style="font-size:15px; font-weight:bold">NAMA CLUB VS NAMA CLUB</font><br>
          <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;"></div>
        </center>
      </div>
      <img id="logoHome${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; left:10%; border-radius:5px;">
      <img id="logoAway${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; right:10%; border-radius:5px;">
      <center>
        <span style="font-size: large; display:none;" id="tvContainer${matchKey}">
          ${serverFuncs.map((fn, i) => `
            <a class="tv" href="javascript:${fn}();" style="display:inline-block;"><b><span>SERVER ${i+1}</span></b></a>
          `).join(" ")}
        </span>
        <div id="tvCountdown${matchKey}"></div>
      </center><br>
    `;

    const postBody = document.querySelector('.post-body') || document.body;
    postBody.appendChild(wrapper);

    // panggil sofascore
    loadSofaScore(matchId, matchKey);

    // countdown aktif
    if (tvStartTime) {
      const target = new Date(tvStartTime).getTime();
      const container = wrapper.querySelector(`#tvContainer${matchKey}`);
      const countdownEl = wrapper.querySelector(`#tvCountdown${matchKey}`);

      function updateCountdown() {
        const now = Date.now();
        const diff = target - now;
        if (diff <= 0) {
          countdownEl.textContent = "";
          container.style.display = "inline";
          clearInterval(timer);
          return;
        }
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        countdownEl.textContent = `Server aktif dalam ${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
      }

      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
    }
  }

  // TUNGGU halaman siap dulu
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createMatchBox);
  } else {
    createMatchBox();
  }
}
