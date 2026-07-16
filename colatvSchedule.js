/* ==========================================
   COLATV AUTO SCHEDULE
   PART 1
   N11BOLAHD Integration
========================================== */


const COLATV_API = 
"https://api.gvapi.cc/api/matches?t=" + Date.now();


let colaMatches = [];


// ===============================
// LOAD DATA
// ===============================

async function loadColaTVSchedule(){

    const box = document.getElementById("colatvSchedule");

    if(!box) return;


    box.innerHTML = `
        <div class="cola-loading">
            Loading schedule...
        </div>
    `;


    try{

        const res = await fetch(
            COLATV_API,
            {
                cache:"no-store"
            }
        );


        const json = await res.json();


        /*
        API FORMAT
        data : array pertandingan
        */

        colaMatches = 
        json.data || json.matches || [];


        renderColaTV();


    }
    catch(err){

        console.log(
            "ColaTV API Error:",
            err
        );


        box.innerHTML = `
        <div class="cola-error">
            Schedule unavailable
        </div>
        `;

    }

}



// ===============================
// RENDER
// ===============================

function renderColaTV(){

const box =
document.getElementById(
"colatvSchedule"
);


if(!box) return;



if(!colaMatches.length){

box.innerHTML =
`
<div class="cola-empty">
No matches available
</div>
`;

return;

}



// LIVE FIRST

colaMatches.sort(
(a,b)=>{

let liveA =
isLiveMatch(a) ? 0 : 1;

let liveB =
isLiveMatch(b) ? 0 : 1;


return liveA-liveB;

});




// GROUP BY COMPETITION


let groups={};


colaMatches.forEach(match=>{


let league =
match.competitionName ||
match.leagueName ||
"Other";


if(!groups[league])
groups[league]=[];


groups[league].push(match);


});




let html = `

<div class="cola-title">

⚡ LIVE SCHEDULE

</div>

`;




Object.keys(groups).forEach(
league=>{


html += `

<div class="cola-league">

<div class="cola-league-name">

🏆 ${league}

</div>


`;


groups[league].forEach(
match=>{


html += createMatchCard(match);


});


html += `

</div>

`;

});



box.innerHTML=html;


}



// ===============================
// MATCH CARD
// ===============================


function createMatchCard(match){


let home =
match.homeTeamName ||
match.home_name ||
"Home";


let away =
match.awayTeamName ||
match.away_name ||
"Away";



let homeLogo =
match.homeTeamLogo ||
"";


let awayLogo =
match.awayTeamLogo ||
"";



let status =
getMatchStatus(match);



return `

<div class="cola-match">


<div class="cola-status">

${status}

</div>



<div class="cola-team">


<div>

<img src="${homeLogo}"
onerror="this.style.display='none'">

<span>${home}</span>

</div>



<div class="cola-score">

${getScore(match)}

</div>



<div>

<img src="${awayLogo}"
onerror="this.style.display='none'">

<span>${away}</span>

</div>


</div>



<div class="cola-time">

${getTime(match)}

</div>



</div>

`;

}




// ===============================
// STATUS
// ===============================


function getMatchStatus(match){


if(isLiveMatch(match))
return `
<span class="cola-live">
🔴 LIVE
</span>
`;


if(
match.match_status==3 ||
match.status=="finished"
)
return "FT";


return "UPCOMING";


}




function isLiveMatch(match){


return (

match.match_status==2 ||
match.match_status==3 ||
match.status=="live"

);


}



// ===============================
// SCORE
// ===============================


function getScore(match){


if(
match.homeScore !== undefined
)

return `

${match.homeScore}
-
${match.awayScore}

`;



if(match.score)

return `

${match.score.home}
-
${match.score.away}

`;



return "VS";


}



// ===============================
// TIME
// ===============================


function getTime(match){


if(match.matchTime)
return match.matchTime;



if(match.kickoff_timestamp){

let d =
new Date(
match.kickoff_timestamp*1000
);


return d.toLocaleTimeString(
"en-GB",
{
hour:"2-digit",
minute:"2-digit"
}
);


}


return "";

}



// ===============================
// AUTO START
// ===============================


document.addEventListener(
"DOMContentLoaded",
()=>{


loadColaTVSchedule();


// refresh 60 detik

setInterval(
loadColaTVSchedule,
60000
);


});
