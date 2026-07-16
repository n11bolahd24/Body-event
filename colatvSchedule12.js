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
onclick="event.stopPropagation();openColaMatch('${match.match_uuid}')">

▶ WATCH

</button>




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

match.match_status == 2 ||
match.match_status == 4 ||

match.status == "LIVE" ||

match.status == 2 ||

match.live == true ||

match.is_live == true

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
match.kickoff_timestamp ||
match.kickoffTime ||
match.start_time ||
match.startTime ||
match.matchTime ||
match.match_time ||
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

        "https://api.gvapi.cc/api/match/" +

        match_uuid +

        "/detail_live";







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





    match.anchorAppointmentVoList ||


    match.streamList ||


    match.servers ||


    [];







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
