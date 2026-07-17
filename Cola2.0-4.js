/* ==========================================
   COLATV AUTO SCHEDULE
   PART 1
   N11BOLAHD Integration
========================================== */


/*
   API LIST MATCH
*/

const COLATV_API =
"https://api.gvapi.cc/api/matches?t=";



let colaMatches = [];





// ==========================================
// LOAD COLATV SCHEDULE
// ==========================================


async function loadColaTVSchedule(){


    const box =
    document.getElementById(
        "colatvSchedule"
    );


    if(!box) return;



    box.innerHTML = `

    <div class="cola-loading">
        Loading schedule...
    </div>

    `;



    try{


        const response =
        await fetch(
            COLATV_API + Date.now(),
            {
                cache:"no-store"
            }
        );



        const json =
        await response.json();



        console.log(
            "COLATV RESPONSE:",
            json
        );



        /*
          GVAPI FORMAT

          data:{
             id:{
               match data
             }
          }

        */


        colaMatches =
        json.data
        ?
        Object.entries(
            json.data
        )
        .map(
            ([key,value])=>{


                return {

                    ...value,

                    match_uuid:key

                };


            }
        )
        :
        [];




        console.log(
            "COLATV MATCH:",
            colaMatches
        );

console.log(
"FIRST MATCH FULL:",
JSON.stringify(
colaMatches[0],
null,
2
)
);

        renderColaTV();



    }
    catch(error){


        console.log(
            "COLATV ERROR:",
            error
        );



        box.innerHTML = `

        <div class="cola-error">
            Schedule unavailable
        </div>

        `;


    }



}



// ==========================================
// UPDATE MATCH DATA (NO RE-RENDER)
// ==========================================

async function updateLiveData(){

    try{

        const response = await fetch(
            COLATV_API + Date.now(),
            {
                cache:"no-store"
            }
        );

        const json = await response.json();

        if(!json.data) return;

        const latestMatches = Object.entries(json.data).map(
            ([key,value])=>{

                return{

                    ...value,

                    match_uuid:key

                };

            }
        );

        latestMatches.forEach(newMatch=>{

            const oldMatch = colaMatches.find(
                m=>m.match_uuid===newMatch.match_uuid
            );

            if(!oldMatch) return;

            // simpan data terbaru
            Object.assign(oldMatch,newMatch);

            // update status
            const status =
            document.getElementById(
                "status-"+newMatch.match_uuid
            );

            if(status){

                status.innerHTML =
                getMatchStatus(newMatch);

            }

            // update score
            const score =
            document.getElementById(
                "score-"+newMatch.match_uuid
            );

            if(score){

                score.innerHTML =
                getScore(newMatch);

            }

            // update waktu
            const time =
            document.getElementById(
                "time-"+newMatch.match_uuid
            );

            if(time){

                time.innerHTML =
                getTime(newMatch);

            }

        });

        console.log("LIVE DATA UPDATED");

    }
    catch(err){

        console.log("UPDATE ERROR",err);

    }

}




// ==========================================
// RENDER COLATV
// ==========================================


function renderColaTV(){

    const box =
    document.getElementById("colatvSchedule");

    if(!box) return;

    if(colaMatches.length === 0){

        box.innerHTML = `
        <div class="cola-empty">
            No matches available
        </div>
        `;

        return;
    }

// ==========================================
// SEARCH
// ==========================================

function searchColaMatch(keyword){

    keyword = keyword.toLowerCase().trim();

    document.querySelectorAll(".cola-match").forEach(card=>{

        const text = card.innerText.toLowerCase();

        card.style.display =
        text.includes(keyword)
        ? ""
        : "none";

    });

}    // ============================
    // URUTKAN BERDASARKAN KICK OFF
    // ============================

    colaMatches.sort((a,b)=>{

        const getTimestamp = (m)=>{

            let t =
            m.matchTime ||
            m.kickoff_timestamp ||
            m.kickoffTime ||
            m.start_time ||
            m.startTime ||
            m.timestamp ||
            m.time ||
            0;

            t = Number(t);

            if(t < 10000000000) t *= 1000;

            return t;
        };

        return getTimestamp(a) - getTimestamp(b);

    });

    let html = `
    
   <div class="cola-title">

    <span>LIVE SCHEDULE</span>

    <div class="cola-title-right">

        <input
            type="search"
            id="colaSearchInput"
            class="cola-search-input"
            placeholder=" Cari jadwal..."
            oninput="searchColaMatch(this.value)">

        <button
            class="cola-refresh"
            onclick="loadColaTVSchedule()">

            🔄 Update

        </button>

    </div>

</div>
<div
class="cola-search-box"
id="colaSearchBox"
style="display:none;">

<input
type="text"
id="colaSearchInput"
placeholder="Cari tim atau liga..."
onkeyup="searchColaMatch(this.value)">

</div>
`;

    colaMatches.forEach(match=>{

        html += createColaCard(match);

    });

    box.innerHTML = html;

}








// ==========================================
// CREATE MATCH CARD
// ==========================================


function createColaCard(match){



    let home =
    match.homeTeamName ||
    match.home_name ||
    "HOME";



    let away =
    match.awayTeamName ||
    match.away_name ||
    "AWAY";



    let homeLogo =
    match.homeTeamLogo ||
    match.home_logo ||
    "";



    let awayLogo =
    match.awayTeamLogo ||
    match.away_logo ||
    "";





return `


<div
class="cola-match"
id="match-${match.match_uuid}"
onclick="openColaMatch('${match.match_uuid}')">



   <div
class="cola-status"
id="status-${match.match_uuid}">

    ${getMatchStatus(match)}

</div>

    <div class="cola-competition">
    🏆 ${
        match.competitionName ||
        match.leagueName ||
        "Other"
    }
</div>




<div class="cola-team">

    <div class="cola-team-box home-team">

        <span>${home}</span>

        <img src="${homeLogo}"
        onerror="this.style.display='none'">

    </div>

    <div
class="cola-score"
id="score-${match.match_uuid}">
    ${getScore(match)}
</div>

    <div class="cola-team-box away-team">

        <img src="${awayLogo}"
        onerror="this.style.display='none'">

        <span>${away}</span>

    </div>

</div>






<div
class="cola-time"
id="time-${match.match_uuid}">

    ${getTime(match)}

</div>




<button
class="cola-watch"
onclick="event.stopPropagation();playColaMatch('${match.match_uuid}', this)">

▶ WATCH

</button>

<div
class="cola-server-list"
id="server-${match.match_uuid}">
</div>

</div>
`;



}









// ==========================================
// STATUS
// ==========================================


function getMatchStatus(match){



    if(
        isLiveMatch(match)
    ){


        return `

        <span class="cola-live">

        🔴 LIVE

        </span>

        `;


    }





    if(
        match.match_status == 3
    ){


        return "FT";


    }





    return "UPCOMING";



}







function isLiveMatch(match){


return (

match.matchStatus == 2 ||

match.match_status == "live" ||

match.status == "LIVE"

);


}







// ==========================================
// SCORE
// ==========================================


function getScore(match){


    let home =
    match.homeScore?.[0];


    let away =
    match.awayScore?.[0];



    if(
        home !== undefined &&
        away !== undefined &&
        (
            isLiveMatch(match) ||
            match.match_status == 3
        )
    ){

        return `
        ${home}
        -
        ${away}
        `;

    }


    return "VS";


}
// ==========================================
// TIME
// ==========================================


function getTime(match){

let timestamp =
match.matchTime ||
match.kickoff_timestamp ||
match.kickoffTime ||
match.start_time ||
match.startTime ||
match.timestamp ||
match.time;





    if(!timestamp)

        return "TBA";







    timestamp =
    Number(timestamp);





    if(
        timestamp < 10000000000
    ){

        timestamp *= 1000;

    }






    let date =
    new Date(timestamp);







    return new Intl.DateTimeFormat(
        "id-ID",
        {

        day:"2-digit",

        month:"short",

        year:"numeric",

        hour:"2-digit",

        minute:"2-digit",

        hour12:false

        }

    )
    .format(date);





}









// ==========================================
// AUTO START
// ==========================================


document.addEventListener(
"DOMContentLoaded",
()=>{
    loadColaTVSchedule();
});

/* ==========================================
   COLATV AUTO SCHEDULE
   PART 2
   DETAIL + SERVER + PLAYER
========================================== */



// ==========================================
// OPEN MATCH DETAIL
// ==========================================


async function openColaMatch(match_uuid){



    console.log(
        "OPEN MATCH:",
        match_uuid
    );




    const match =
    colaMatches.find(
        m => m.match_uuid == match_uuid
    );





    if(!match){


        alert(
            "Match tidak ditemukan"
        );


        return;


    }







    console.log(
        "MATCH DETAIL REQUEST:",
        match
    );





    try{



        /*
          DETAIL API

          Sesuaikan jika endpoint
          berbeda dari GVAPI
        */


        let detailURL =
"https://api.gvapi.cc/api/match/detail_live?id=" 
+ match.matchId;







        let response =

        await fetch(
            detailURL,
            {
                cache:"no-store"
            }
        );







        let json =

        await response.json();







        console.log(
            "DETAIL LIVE:",
            json
        );






        showColaServers(
            json.data || json
        );





    }

    catch(error){


        console.log(
            "DETAIL ERROR:",
            error
        );



        alert(
            "Server belum tersedia"
        );



    }





}









// ==========================================
// SHOW SERVER POPUP
// ==========================================


function showColaServers(match){





    console.log(
        "SERVER DATA:",
        match
    );






    let servers =

match.results ||

match.anchorAppointmentVoList ||

match.streamList ||

match.servers ||

[];

   console.log(
"TOTAL SERVER:",
servers.length
);


console.log(
"SERVER LIST:",
servers
);



  console.log(
"TLIVE:",
JSON.stringify(
servers[0].tlive,
null,
2
)
);





    let html = `



<div class="cola-popup">



<div class="cola-popup-box">





<h3>

⚡ LIVE STREAM

</h3>







`;









if(
    servers.length === 0
){


html += `



<p>

Server belum tersedia

</p>



`;



}

else{



servers.forEach(
(server,index)=>{





    let url =


    server.url ||


    server.play_url ||


    server.stream_url ||


    "";







    html += `



<button

class="cola-server-btn"


onclick="playColaServer('${url}')">


SERVER ${index+1}


</button>



`;




});



}








html += `




<button

class="cola-close-btn"


onclick="closeColaPopup()">


CLOSE


</button>




</div>


</div>




`;








document
.body
.insertAdjacentHTML(
"beforeend",
html
);





}









// ==========================================
// CLOSE POPUP
// ==========================================


function closeColaPopup(){



let popup =

document.querySelector(
".cola-popup"
);




if(popup){


    popup.remove();


}



}









// ==========================================
// PLAY SERVER
// ==========================================


function playColaServer(url){



console.log(
"PLAY URL:",
url
);





if(!url){


alert(
"Stream tidak tersedia"
);


return;


}






/*

SAMBUNGKAN KE PLAYER N11BOLAHD

Ganti nama fungsi
sesuai player Anda


Contoh:

loadPlayer(url)

atau

openPlayer(url)


*/






if(
typeof loadPlayer === "function"
){



    loadPlayer(url);



}

else{


    console.log(
    "Player function belum ditemukan"
    );



    window.open(
        url,
        "_blank"
    );


}





closeColaPopup();



}


// ==========================================
// PLAY COLATV MATCH
// ==========================================

async function playColaMatch(match_uuid, btn){

    const match =
    colaMatches.find(
        m => m.match_uuid == match_uuid
    );

    if(!match){
        alert("Match tidak ditemukan");
        return;
    }

    const serverBox =
    document.getElementById(
        "server-" + match_uuid
    );

    // kalau sudah tampil, sembunyikan lagi
    if(serverBox.innerHTML.trim() !== ""){
        serverBox.innerHTML = "";
        return;
    }

    let anchors =
    match.anchorAppointmentVoList || [];

    // kalau belum ada ambil dari API detail
    if(anchors.length === 0){

        try{

            const res = await fetch(
                "https://api.gvapi.cc/api/match/detail_live?id=" +
                match.matchId
            );

            const json = await res.json();

            anchors =
            json.data?.anchorAppointmentVoList || [];

        }catch(e){
            console.log(e);
        }

    }

    if(anchors.length === 0){

        serverBox.innerHTML =
        `<button class="cola-server-btn"
        onclick="playColaStream('${match.videoUrl}')">
        SERVER
        </button>`;

        return;
    }

    serverBox.innerHTML =
    anchors.map((anchor,index)=>{

        const stream =

        anchor.playStreamAddress2 ||

        anchor.playStreamAddress ||

        anchor.servers?.[0] ||

        match.videoUrl;

        return `
        <button
        class="cola-server-btn"
        onclick="playColaStream('${stream}')">

        ${anchor.nickName || `SERVER ${index+1}`}

        </button>
        `;

    }).join("");

}



// ==========================================
// SHAKA PLAYER COLATV
// ==========================================


let shakaPlayer;



async function playColaStream(url){


    const tv =
    document.getElementById("tv");



    if(!tv) return;



    tv.innerHTML = `

    <video id="colaVideo"

    autoplay

    controls

    playsinline

    style="
    width:100%;
    height:100%;
    background:#000;
    ">

    </video>

    `;



    const video =
    document.getElementById(
        "colaVideo"
    );



    shaka.polyfill.installAll();



    if(
        shaka.Player.isBrowserSupported()
    ){



        shakaPlayer =
        new shaka.Player(video);



        shakaPlayer.addEventListener(
            "error",
            e=>{

                console.log(
                "SHAKA ERROR:",
                e
                );

            }
        );



        try{


            await shakaPlayer.load(url);



            console.log(
            "SHAKA PLAYING:",
            url
            );



        }
        catch(error){


            console.log(
            "SHAKA LOAD ERROR:",
            error
            );


        }



    }

    else{


        alert(
        "Browser tidak support Shaka Player"
        );


    }



}

// ==========================================
// AUTO UPDATE LIVE
// ==========================================

setInterval(()=>{

    if(colaMatches.length){

        updateLiveData();

    }

},30000);
