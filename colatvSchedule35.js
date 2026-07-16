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
// RENDER COLATV
// ==========================================


function renderColaTV(){


    const box =
    document.getElementById(
        "colatvSchedule"
    );



    if(!box) return;




    if(
        colaMatches.length === 0
    ){


        box.innerHTML = `

        <div class="cola-empty">
            No matches available
        </div>

        `;


        return;


    }







    /*
       LIVE FIRST
    */


    colaMatches.sort(
        (a,b)=>{


            return (
                isLiveMatch(b)
                -
                isLiveMatch(a)
            );


        }
    );






    /*
       GROUP LEAGUE
    */


    let groups = {};




    colaMatches.forEach(
        match=>{


            let league =
            match.competitionName ||
            match.leagueName ||
            "Other";



            if(!groups[league]){

                groups[league]=[];

            }



            groups[league].push(
                match
            );



        }
    );







    let html = `


    <div class="cola-title">

        ⚡ COLATV LIVE SCHEDULE

    </div>


    `;






    Object.keys(groups)
    .forEach(
        league=>{


            html += `


            <div class="cola-league">


                <div class="cola-league-name">

                    🏆 ${league}

                </div>


            `;



            groups[league]
            .forEach(
                match=>{


                    html +=
                    createColaCard(
                        match
                    );


                }
            );



            html += `

            </div>

            `;



        }
    );






    box.innerHTML =
    html;



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



<div class="cola-match"

onclick="openColaMatch('${match.match_uuid}')">



    <div class="cola-status">

        ${getMatchStatus(match)}

    </div>





    <div class="cola-team">


        <div class="cola-team-box">


            <img src="${homeLogo}"

            onerror="
            this.style.display='none'
            ">


            <span>

            ${home}

            </span>


        </div>





        <div class="cola-score">


            ${getScore(match)}


        </div>






        <div class="cola-team-box">


            <img src="${awayLogo}"

            onerror="
            this.style.display='none'
            ">



            <span>

            ${away}

            </span>


        </div>




    </div>







    <div class="cola-time">


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



    if(
        match.score
    ){


        return `

        ${match.score.home.score}
        -
        ${match.score.away.score}

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



    setInterval(
loadColaTVSchedule,
30000
);


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
// UPDATE LIVE STATUS
// ==========================================


setInterval(
()=>{


    if(
        colaMatches.length
    ){


        renderColaTV();


    }



},
30000
);                 
