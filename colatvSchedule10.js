/* ==========================================
   COLATV AUTO SCHEDULE
   PART 1
   N11BOLAHD Integration
========================================== */


const COLATV_API =
"https://api.gvapi.cc/api/matches?t=" + Date.now();


let colaMatches = [];


// ==========================================
// LOAD DATA
// ==========================================

async function loadColaTVSchedule(){


    const box = document.getElementById("colatvSchedule");


    if(!box) return;



    box.innerHTML = `
        <div class="cola-loading">
            Loading schedule...
        </div>
    `;



    try{


        const response = await fetch(
            COLATV_API,
            {
                cache:"no-store"
            }
        );


        const json = await response.json();



        console.log(
            "COLATV RESPONSE:",
            json
        );



        // API GVAPI FORMAT
        // data = ARRAY MATCH


        colaMatches =
    json.data
    ? Object.entries(json.data).map(([key,value])=>{

        return {
            ...value,
            match_uuid:key
        };

    })
    : [];



        console.log(
            "COLATV MATCHES:",
            colaMatches
        );



        console.log(
            "TOTAL MATCH:",
            colaMatches.length
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
// RENDER
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




    // LIVE FIRST

    colaMatches.sort(
        (a,b)=>{

            return isLiveMatch(b)
            -
            isLiveMatch(a);

        }
    );




    // GROUP BY LEAGUE


    let groups = {};



    colaMatches.forEach(
        match=>{


            let league =
                match.competitionName ||
                "Other";



            if(!groups[league]){

                groups[league]=[];

            }



            groups[league].push(match);



        }
    );




    let html = `

    <div class="cola-title">
        ⚡ LIVE SCHEDULE
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


                    html += createMatchCard(match);


                }
            );



            html += `

            </div>

            `;



        }
    );



    box.innerHTML = html;


}





// ==========================================
// CARD
// ==========================================


function createMatchCard(match){

console.log(
"MATCH ID:",
match.match_uuid
);

console.log(
"MATCH DATA:",
match
);



    let home =
        match.homeTeamName ||
        "HOME";



    let away =
        match.awayTeamName ||
        "AWAY";



    let homeLogo =
        match.homeTeamLogo ||
        "";



    let awayLogo =
        match.awayTeamLogo ||
        "";



    return `


    <div class="cola-match"
onclick="openColaMatch('${match.match_uuid || ""}')">


        <div class="cola-status">

            ${getMatchStatus(match)}

        </div>



        <div class="cola-team">


            <div>

                <img src="${homeLogo}"
                onerror="this.style.display='none'">

                <span>
                ${home}
                </span>

            </div>



            <div class="cola-score">

                ${getScore(match)}

            </div>




            <div>

                <img src="${awayLogo}"
                onerror="this.style.display='none'">

                <span>
                ${away}
                </span>

            </div>



        </div>



        <div class="cola-time">

${getTime(match)}

</div>


<button class="cola-watch">

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
        match.match_status == 4

    );



}





// ==========================================
// SCORE
// ==========================================


function getScore(match){



    if(match.score){


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
        match.time ||
        match.matchTime ||
        match.timestamp;



    if(timestamp){


        timestamp = Number(timestamp);



        if(timestamp < 10000000000){

            timestamp = timestamp * 1000;

        }



        let date = new Date(timestamp);



        return new Intl.DateTimeFormat(
            undefined,
            {
                day:"2-digit",
                month:"short",
                year:"numeric",
                hour:"2-digit",
                minute:"2-digit",
                hour12:false
            }
        ).format(date);



    }


    return "TBA";


}




// ==========================================
// OPEN COLATV DETAIL
// ==========================================


async function openColaMatch(id){


if(!id){

alert("Match ID tidak ditemukan");

return;

}



console.log(
"OPEN MATCH:",
id
);



let url =
"https://api.colatv88xb.cc/api/match/"
+
id
+
"/detail_live";



try{


let res =
await fetch(url);



let data =
await res.json();



console.log(
"DETAIL LIVE:",
data
);



showColaServers(data);



}
catch(e){


console.log(
"DETAIL ERROR:",
e
);


}


}





// ==========================================
// SHOW SERVER
// ==========================================


function showColaServers(data){


let servers =
data?.data?.anchorAppointmentVoList ||
data?.anchorAppointmentVoList ||
[];



let html = `


<div class="cola-popup">


<div class="cola-popup-box">


<h3>
⚡ LIVE STREAM
</h3>



`;



if(!servers.length){


html += `

<p>
Server belum tersedia
</p>

`;



}
else{


servers.forEach(
(server,index)=>{


html += `

<button onclick="playColaServer('${server.url || server.play_url}')">

SERVER ${index+1}

</button>

`;



});



}



html += `


<button onclick="closeColaPopup()">

CLOSE

</button>


</div>

</div>


`;



document.body.insertAdjacentHTML(
"beforeend",
html
);


}





function closeColaPopup(){


let pop =
document.querySelector(
".cola-popup"
);


if(pop)
pop.remove();


}





function playColaServer(url){


console.log(
"PLAY URL:",
url
);


// nanti sambungkan ke player Anda


}


// ==========================================
// START
// ==========================================


document.addEventListener(
"DOMContentLoaded",
()=>{


    loadColaTVSchedule();



    setInterval(
        loadColaTVSchedule,
        60000
    );


});
