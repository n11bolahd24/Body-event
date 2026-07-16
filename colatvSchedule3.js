/* ==========================================
   COLATV AUTO SCHEDULE
   PART 1
   N11BOLAHD Integration
========================================== */


const COLATV_API =
"https://api.gvapi.cc/api/matches?t=" + Date.now();


let colaMatches = [];


// ==========================================
// LOAD COLATV DATA
// ==========================================

async function loadColaTVSchedule(){

    const box = document.getElementById("colatvSchedule");

    if(!box) return;


    box.innerHTML = `
        <div class="cola-loading">
            Loading schedule...
        </div>
    `;


    try {


        const response = await fetch(
            COLATV_API,
            {
                cache:"no-store"
            }
        );


        const json = await response.json();


console.log("COLATV RESPONSE:", json);

console.log(
    "ALL KEYS:",
    Object.keys(json)
);

console.log(
    "DATA KEYS:",
    json.data ? Object.keys(json.data) : "NO DATA"
);


        /*
          Flexible API parser
        */


        colaMatches =
            json.data?.list ||
            json.data?.items ||
            json.data?.records ||
            json.data ||
            json.matches ||
            json.result ||
            [];



        console.log(
            "COLATV MATCHES:",
            colaMatches
        );



        if(!Array.isArray(colaMatches)){

            colaMatches = [];

        }



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


return isLiveMatch(b) -
isLiveMatch(a);


});





// GROUP LEAGUE


let groups = {};



colaMatches.forEach(
(match)=>{


let league =
match.competitionName ||
match.leagueName ||
match.competition ||
"Other";



if(!groups[league]){

groups[league]=[];

}



groups[league].push(match);



});





let html = `

<div class="cola-title">

⚡ LIVE SCHEDULE

</div>

`;





Object.keys(groups).forEach(
(league)=>{


html += `


<div class="cola-league">


<div class="cola-league-name">

🏆 ${league}

</div>


`;



groups[league].forEach(
(match)=>{


html += createMatchCard(match);


});



html += `

</div>

`;



});





box.innerHTML = html;



}





// ==========================================
// MATCH CARD
// ==========================================


function createMatchCard(match){



let home =
match.homeTeamName ||
match.home_team_name ||
match.homeName ||
"HOME";



let away =
match.awayTeamName ||
match.away_team_name ||
match.awayName ||
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


<div class="cola-match">


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
match.match_status == 3 ||
match.status == "finished"
){

return "FT";

}



return "UPCOMING";


}





function isLiveMatch(match){


return (

match.match_status == 2 ||

match.match_status == 4 ||

match.status == "live"

);


}





// ==========================================
// SCORE
// ==========================================


function getScore(match){


if(match.score){


let h =
match.score.home?.score ??
match.score.home ??
0;


let a =
match.score.away?.score ??
match.score.away ??
0;



return h+" - "+a;


}




if(
match.homeScore !== undefined
){

return (

match.homeScore +
" - " +
match.awayScore

);

}



return "VS";


}





// ==========================================
// TIME
// ==========================================


function getTime(match){



if(match.matchTime){

return match.matchTime;

}




if(match.kickoff_timestamp){


let date =
new Date(
match.kickoff_timestamp * 1000
);



return date.toLocaleTimeString(
"en-GB",
{
hour:"2-digit",
minute:"2-digit"
}
);


}



return "";

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
