// ===============================
// PREVIEW MATCH DI TV
// ===============================
function showMatchPreview(home, away, homeLogo, awayLogo, kickoff) {

  const tv = document.getElementById("tv");
  if (!tv) return;

  tv.innerHTML = `
  <div class="preview-match">

    <div style="
      display:flex;
      justify-content:space-around;
      align-items:center;
      text-align:center;
    ">

      <div>
        <img src="${homeLogo}"
        style="width:70px;height:70px;">
        <br>
        <b>${home}</b>
      </div>


      <div>

        <h2>VS</h2>

        <div style="
        font-size:18px;
        font-weight:bold;">
        ⏳ KICK OFF DALAM
        </div>

        <div id="tvPreviewCountdown"
        style="
        font-size:35px;
        font-weight:bold;
        color:#FFD700;">
        </div>


        <div style="margin-top:10px;">
        🔒 Server akan aktif 30 menit sebelum pertandingan
        </div>

      </div>


      <div>
        <img src="${awayLogo}"
        style="width:70px;height:70px;">
        <br>
        <b>${away}</b>
      </div>


    </div>

  </div>
  `;


  function updatePreview(){

    const box =
    document.getElementById("tvPreviewCountdown");

    if(!box) return;


    const distance = kickoff - Date.now();


    if(distance <= 0){

      box.innerHTML="🔴 LIVE NOW";
      return;

    }


    const hours = Math.floor(
      distance / (1000 * 60 * 60)
    );


    const minutes = Math.floor(
      (distance % (1000 * 60 * 60))
      /
      (1000 * 60)
    );


    const seconds = Math.floor(
      (distance % (1000 * 60))
      /
      1000
    );


    box.innerHTML =
      String(hours).padStart(2,"0")
      +" : "+
      String(minutes).padStart(2,"0")
      +" : "+
      String(seconds).padStart(2,"0");

  }


  updatePreview();

  setInterval(updatePreview,1000);

}



// ===============================
// COUNTDOWN MATCH
// ===============================
function createCountdown(
  targetDate,
  countdownId,
  liveContainerId,
  kickoffId,
  matchBoxId
) {

  const countdownElement = document.getElementById(countdownId);
  const liveContainer = document.getElementById(liveContainerId);
  const kickoffElement = document.getElementById(kickoffId);
  const matchBox = document.getElementById(matchBoxId);


  if (!countdownElement || !liveContainer || !kickoffElement || !matchBox) return;


  const serverButtons = matchBox.querySelectorAll(".tv");


  function setServerState(enabled) {

    serverButtons.forEach(btn => {

      if(enabled){
        btn.classList.remove("disabled");
      }else{
        btn.classList.add("disabled");
      }

    });

  }


  const countdown = setInterval(() => {


    const now = Date.now();

    const distance = targetDate - now;

    const matchEnd =
    targetDate + (3 * 60 * 60 * 1000);



    // ⏳ BEFORE KICKOFF
    if(distance > 0){


      if(distance <= 30 * 60 * 1000){

        setServerState(true);

      }else{

        setServerState(false);

      }



      const days = Math.floor(
        distance/(1000*60*60*24)
      );


      const hours = Math.floor(
        (distance%(1000*60*60*24))
        /
        (1000*60*60)
      );


      const minutes = Math.floor(
        (distance%(1000*60*60))
        /
        (1000*60)
      );


      const seconds = Math.floor(
        (distance%(1000*60))
        /
        1000
      );



      countdownElement.innerHTML =
      days+"D - "+
      hours+"H - "+
      minutes+"M - "+
      seconds+"S";


    }



    // 🔴 LIVE
    else if(now < matchEnd){


      setServerState(true);


      countdownElement.innerHTML="";


      liveContainer.classList.remove("hidden");

      liveContainer.classList.add("blink");


      liveContainer.innerHTML =
      "<strong style='color:white;'>🔴 LIVE NOW</strong>";


    }



    // ⛔ END
    else{


      setServerState(true);


      clearInterval(countdown);


      countdownElement.innerHTML="";


      liveContainer.classList.remove("hidden");


      liveContainer.innerHTML =
      "<strong style='color:white;'>⛔ MATCH ENDED ⛔</strong>";



      const finishedContainer =
      document.getElementById("finishedMatches");


      if(finishedContainer){

        finishedContainer.appendChild(matchBox);

      }

    }



  },1000);



  const kickoffDate = new Date(targetDate);


  kickoffElement.innerHTML =
  kickoffDate.toLocaleDateString("id-ID",{
    day:"2-digit",
    month:"long",
    year:"numeric"
  })
  +" | K.O "
  +
  kickoffDate.toLocaleTimeString("id-ID",{
    hour:"2-digit",
    minute:"2-digit",
    hour12:false
  });


}



// ===============================
// RENDER MATCH
// ===============================
function renderMatch({
  no,
  date,
  competition,
  home,
  away,
  homeLogo,
  awayLogo,
  servers=[]
}) {


const container =
document.getElementById("matchContainer");


if(!container) return;



const serverHTML =
servers.map(server=>`

<a class="tv"
href="javascript:${server.func}();"
onclick="event.stopPropagation();">

<b>
<span style="border:none;color:white;padding:0 10px 0 6px;">
${server.name}
</span>
</b>

</a>

`).join("");




container.insertAdjacentHTML("beforeend",`


<div class="kotak1"
id="match${no}"

onclick="
showMatchPreview(
'${home}',
'${away}',
'${homeLogo}',
'${awayLogo}',
${new Date(date).getTime()}
);
">


<div class="countdown"
id="countdown${no}">
</div>


<div class="live-container hidden"
id="liveContainer${no}">

<strong>🔴 LIVE NOW</strong>

</div>



<div class="club">

<center>

<font style="font-weight:bold">
${competition}
</font>

<br>

<div id="kickoff${no}"></div>


<font style="font-weight:bold">
${home} vs ${away}
</font>


</center>

</div>



<img src="${homeLogo}"
style="position:absolute;height:50px;width:50px;top:25%;left:10%;">



<img src="${awayLogo}"
style="position:absolute;height:50px;width:50px;top:25%;right:10%;">



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
