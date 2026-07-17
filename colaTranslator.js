/* ==========================================
   colaTranslator.js
   PART 1
   N11BOLAHD Translator Engine
========================================== */

(function(window){

"use strict";

/* ==========================================
   VERSION
========================================== */

window.COLA_TRANSLATOR_VERSION = "1.0.0";


/* ==========================================
   DICTIONARY
   (Diisi pada PART 2,3,4...)
========================================== */

window.COLA_TRANSLATOR_DICTIONARY = {};



/* ==========================================
   NORMALIZE TEXT
========================================== */

function normalizeText(text){

    if(!text) return "";

    return String(text)
        .trim()
        .replace(/\s+/g," ")
        .toLowerCase();

}



/* ==========================================
   ADD TRANSLATION
========================================== */

window.addColaTranslation = function(from,to){

    if(!from || !to) return;

    window.COLA_TRANSLATOR_DICTIONARY[
        normalizeText(from)
    ] = to;

};



/* ==========================================
   ADD BULK
========================================== */

window.addColaTranslations = function(obj){

    if(!obj) return;

    Object.keys(obj).forEach(key=>{

        addColaTranslation(
            key,
            obj[key]
        );

    });

};



/* ==========================================
   EXACT TRANSLATE
========================================== */

window.translateName = function(text){

    if(!text) return "";

    const original = String(text);

    const key =
    normalizeText(original);

    if(
        window.COLA_TRANSLATOR_DICTIONARY[key]
    ){

        return window
        .COLA_TRANSLATOR_DICTIONARY[key];

    }

    return original;

};



/* ==========================================
   SMART TRANSLATE
========================================== */

window.smartTranslate = function(text){

    if(!text) return "";

    let result = String(text);

    const dict =
    window.COLA_TRANSLATOR_DICTIONARY;

    Object.keys(dict).forEach(key=>{

        const regex =
        new RegExp(
            key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),
            "gi"
        );

        result =
        result.replace(
            regex,
            dict[key]
        );

    });

    return result;

};



/* ==========================================
   AUTO TRANSLATE MATCH
========================================== */

window.translateMatch = function(match){

    if(!match) return match;

    if(match.homeTeamName){

        match.homeTeamName =
        smartTranslate(
            match.homeTeamName
        );

    }

    if(match.awayTeamName){

        match.awayTeamName =
        smartTranslate(
            match.awayTeamName
        );

    }

    if(match.competitionName){

        match.competitionName =
        smartTranslate(
            match.competitionName
        );

    }

    if(match.competition?.name){

        match.competition.name =
        smartTranslate(
            match.competition.name
        );

    }

    if(match.home_team?.name){

        match.home_team.name =
        smartTranslate(
            match.home_team.name
        );

    }

    if(match.away_team?.name){

        match.away_team.name =
        smartTranslate(
            match.away_team.name
        );

    }

    return match;

};



/* ==========================================
   TRANSLATE ARRAY
========================================== */

window.translateMatches = function(matches){

    if(!Array.isArray(matches))
        return matches;

    matches.forEach(match=>{

        translateMatch(match);

    });

    return matches;

};



/* ==========================================
   DEBUG
========================================== */

console.log(
    "COLA Translator Engine Loaded",
    window.COLA_TRANSLATOR_VERSION
);

/* ==========================================
   colaTranslator.js
   PART 2
   FOOTBALL INTERNATIONAL DICTIONARY
========================================== */


/* ==========================================
   VIETNAMESE TERMS
========================================== */

addColaTranslations({

    /* Competitions */

    "giải vô địch bóng đá thế giới":
    "FIFA World Cup",

    "giải vô địch bóng đá thế giới fifa":
    "FIFA World Cup",

    "giải vô địch châu âu":
    "UEFA European Championship",

    "giải vô địch bóng đá châu âu":
    "UEFA European Championship",

    "giải bóng đá vô địch các câu lạc bộ châu âu":
    "UEFA Champions League",

    "cúp c1 châu âu":
    "UEFA Champions League",

    "cúp c2 châu âu":
    "UEFA Europa League",

    "cúp c3 châu âu":
    "UEFA Conference League",

    "siêu cúp châu âu":
    "UEFA Super Cup",


    /* Countries */

    "pháp":
    "France",

    "đtqg pháp":
    "France National Team",

    "đội tuyển pháp":
    "France National Team",


    "đtqg anh":
    "England",

    "đội tuyển anh":
    "England National Team",


    "đức":
    "Germany",

    "đtqg đức":
    "Germany National Team",


    "tây ban nha":
    "Spain",

    "đtqg tây ban nha":
    "Spain National Team",


    "bồ đào nha":
    "Portugal",

    "đtqg bồ đào nha":
    "Portugal National Team",


    "ý":
    "Italy",

    "italia":
    "Italy",


    "hà lan":
    "Netherlands",

    "đtqg hà lan":
    "Netherlands National Team",


    "bỉ":
    "Belgium",

    "croatia":
    "Croatia",


    "argentina":
    "Argentina",

    "brazil":
    "Brazil",


    "mexico":
    "Mexico",


    "nhật bản":
    "Japan",

    "hàn quốc":
    "South Korea",


    "trung quốc":
    "China",


    "úc":
    "Australia"



});





/* ==========================================
   FIFA COMPETITIONS
========================================== */

addColaTranslations({

    "fifa world cup":
    "FIFA World Cup",

    "world cup":
    "FIFA World Cup",

    "world cup qualification":
    "FIFA World Cup Qualifiers",

    "vòng loại world cup":
    "World Cup Qualifiers",


    "fifa club world cup":
    "FIFA Club World Cup",

    "cúp các câu lạc bộ thế giới":
    "FIFA Club World Cup",


    "fifa u20 world cup":
    "FIFA U20 World Cup",

    "fifa u17 world cup":
    "FIFA U17 World Cup"



});





/* ==========================================
   UEFA COMPETITIONS
========================================== */

addColaTranslations({

    "uefa champions league":
    "UEFA Champions League",

    "champions league":
    "UEFA Champions League",

    "cúp c1":
    "UEFA Champions League",


    "uefa europa league":
    "UEFA Europa League",

    "europa league":
    "UEFA Europa League",


    "uefa conference league":
    "UEFA Conference League",

    "conference league":
    "UEFA Conference League",


    "uefa nations league":
    "UEFA Nations League",


    "uefa european championship":
    "UEFA Euro",


    "uefa super cup":
    "UEFA Super Cup"


});





/* ==========================================
   AFC COMPETITIONS
========================================== */

addColaTranslations({

    "afc champions league":
    "AFC Champions League",

    "afc champions league elite":
    "AFC Champions League Elite",

    "afc cup":
    "AFC Cup",

    "afc asian cup":
    "AFC Asian Cup",

    "asian cup":
    "AFC Asian Cup"



});





/* ==========================================
   COMMON VIETNAMESE WORDS
========================================== */

addColaTranslations({

    "giải":
    "League",

    "cúp":
    "Cup",

    "vô địch":
    "Championship",

    "bóng đá":
    "Football",

    "quốc gia":
    "National",

    "châu âu":
    "Europe",

    "châu á":
    "Asia",

    "nam mỹ":
    "South America",

    "nữ":
    "Women",

    "trẻ":
    "Youth",

    "u23":
    "U23",

    "u20":
    "U20",

    "u17":
    "U17"

});



console.log(
"COLA Translator PART 2 Loaded"
);

/* ==========================================
   colaTranslator.js
   PART 3
   DOMESTIC FOOTBALL LEAGUE DICTIONARY
========================================== */


/* ==========================================
   ENGLAND
========================================== */

addColaTranslations({

    "giải ngoại hạng anh":
    "Premier League",

    "ngoại hạng anh":
    "Premier League",

    "english premier league":
    "Premier League",

    "premier league":
    "Premier League",


    "giải hạng nhất anh":
    "English Championship",

    "championship":
    "English Championship",


    "fa cup":
    "FA Cup",

    "cúp fa":
    "FA Cup",


    "carabao cup":
    "Carabao Cup"

});





/* ==========================================
   SPAIN
========================================== */

addColaTranslations({

    "la liga":
    "La Liga",

    "laliga":
    "La Liga",

    "giải vô địch tây ban nha":
    "La Liga",

    "copa del rey":
    "Copa del Rey",

    "siêu cúp tây ban nha":
    "Spanish Super Cup"

});





/* ==========================================
   ITALY
========================================== */

addColaTranslations({

    "serie a":
    "Serie A",

    "giải vô địch ý":
    "Serie A",

    "serie b":
    "Serie B",

    "coppa italia":
    "Coppa Italia",

    "siêu cúp ý":
    "Italian Super Cup"

});





/* ==========================================
   GERMANY
========================================== */

addColaTranslations({

    "bundesliga":
    "Bundesliga",

    "giải vô địch đức":
    "Bundesliga",

    "bundesliga 2":
    "Bundesliga 2",

    "dfb pokal":
    "DFB Pokal",

    "siêu cúp đức":
    "German Super Cup"

});





/* ==========================================
   FRANCE
========================================== */

addColaTranslations({

    "ligue 1":
    "Ligue 1",

    "giải vô địch pháp":
    "Ligue 1",

    "ligue 2":
    "Ligue 2",

    "coupe de france":
    "Coupe de France",

    "siêu cúp pháp":
    "French Super Cup"

});





/* ==========================================
   PORTUGAL
========================================== */

addColaTranslations({

    "primeira liga":
    "Primeira Liga",

    "liga portugal":
    "Liga Portugal",

    "giải vô địch bồ đào nha":
    "Primeira Liga",

    "taça de portugal":
    "Portuguese Cup"

});





/* ==========================================
   NETHERLANDS
========================================== */

addColaTranslations({

    "eredivisie":
    "Eredivisie",

    "giải vô địch hà lan":
    "Eredivisie",

    "knvb beker":
    "KNVB Cup"

});





/* ==========================================
   BELGIUM
========================================== */

addColaTranslations({

    "jupiler pro league":
    "Belgian Pro League",

    "giải vô địch bỉ":
    "Belgian Pro League"

});





/* ==========================================
   TURKEY
========================================== */

addColaTranslations({

    "super lig":
    "Turkish Super Lig",

    "süper lig":
    "Turkish Super Lig",

    "giải vô địch thổ nhĩ kỳ":
    "Turkish Super Lig"

});





/* ==========================================
   SWITZERLAND
========================================== */

addColaTranslations({

    "super league thụy sĩ":
    "Swiss Super League",

    "swiss super league":
    "Swiss Super League"

});





/* ==========================================
   SCOTLAND
========================================== */

addColaTranslations({

    "scottish premiership":
    "Scottish Premiership",

    "giải vô địch scotland":
    "Scottish Premiership"

});





/* ==========================================
   USA
========================================== */

addColaTranslations({

    "giải bóng đá nhà nghề mỹ":
    "Major League Soccer",

    "mls":
    "Major League Soccer",

    "major league soccer":
    "Major League Soccer"


});





/* ==========================================
   MEXICO
========================================== */

addColaTranslations({

    "liga mx":
    "Liga MX",

    "mexico liga mx":
    "Liga MX",

    "giải vô địch mexico":
    "Liga MX"


});





/* ==========================================
   BRAZIL
========================================== */

addColaTranslations({

    "brasileirão":
    "Brazil Serie A",

    "brazil serie a":
    "Brazil Serie A",

    "giải vô địch brazil":
    "Brazil Serie A"


});





/* ==========================================
   ARGENTINA
========================================== */

addColaTranslations({

    "liga profesional argentina":
    "Argentina Primera Division",

    "argentina primera division":
    "Argentina Primera Division"


});





/* ==========================================
   JAPAN
========================================== */

addColaTranslations({

    "j league":
    "J1 League",

    "j1 league":
    "J1 League",

    "giải vô địch nhật bản":
    "J1 League",

    "j2 league":
    "J2 League"


});





/* ==========================================
   SOUTH KOREA
========================================== */

addColaTranslations({

    "k league":
    "K League",

    "k league 1":
    "K League 1",

    "giải vô địch hàn quốc":
    "K League 1"

});





/* ==========================================
   CHINA
========================================== */

addColaTranslations({

    "giải vô địch trung quốc":
    "Chinese Super League",

    "chinese super league":
    "Chinese Super League"


});





/* ==========================================
   AUSTRALIA
========================================== */

addColaTranslations({

    "a league":
    "A-League",

    "australian a league":
    "A-League"


});





console.log(
"COLA Translator PART 3 Loaded"
);

/* ==========================================
   colaTranslator.js
   PART 4
   ASIA - AFRICA - WOMEN - YOUTH
========================================== */


/* ==========================================
   SAUDI ARABIA
========================================== */

addColaTranslations({

    "saudi pro league":
    "Saudi Pro League",

    "giải vô địch ả rập xê út":
    "Saudi Pro League",

    "arabian gulf league":
    "Saudi Pro League",

    "cúp nhà vua saudi":
    "Saudi King Cup"

});





/* ==========================================
   QATAR
========================================== */

addColaTranslations({

    "qatar stars league":
    "Qatar Stars League",

    "giải vô địch qatar":
    "Qatar Stars League"

});





/* ==========================================
   UAE
========================================== */

addColaTranslations({

    "uae pro league":
    "UAE Pro League",

    "giải vô địch uae":
    "UAE Pro League",

    "arabian gulf cup":
    "UAE Arabian Gulf Cup"

});





/* ==========================================
   IRAN
========================================== */

addColaTranslations({

    "iran pro league":
    "Iran Pro League",

    "giải vô địch iran":
    "Iran Pro League"

});





/* ==========================================
   INDONESIA
========================================== */

addColaTranslations({

    "liga 1 indonesia":
    "Indonesia Liga 1",

    "bri liga 1":
    "Indonesia Liga 1",

    "liga indonesia":
    "Indonesia Liga 1",

    "piala indonesia":
    "Indonesia Cup"


});





/* ==========================================
   THAILAND
========================================== */

addColaTranslations({

    "thai league":
    "Thai League",

    "thai league 1":
    "Thai League 1",

    "giải vô địch thái lan":
    "Thai League 1"

});





/* ==========================================
   VIETNAM
========================================== */

addColaTranslations({

    "v league":
    "Vietnam V.League",

    "v league 1":
    "Vietnam V.League 1",

    "giải vô địch quốc gia việt nam":
    "Vietnam V.League 1"

});





/* ==========================================
   MALAYSIA
========================================== */

addColaTranslations({

    "malaysia super league":
    "Malaysia Super League",

    "giải vô địch malaysia":
    "Malaysia Super League"

});





/* ==========================================
   SINGAPORE
========================================== */

addColaTranslations({

    "singapore premier league":
    "Singapore Premier League"

});





/* ==========================================
   PHILIPPINES
========================================== */

addColaTranslations({

    "philippines football league":
    "Philippines Football League"

});





/* ==========================================
   INDIA
========================================== */

addColaTranslations({

    "indian super league":
    "Indian Super League",

    "i league":
    "I-League"

});





/* ==========================================
   SOUTH AFRICA
========================================== */

addColaTranslations({

    "dstv premiership":
    "South Africa Premiership",

    "south africa premier league":
    "South Africa Premiership"

});





/* ==========================================
   EGYPT
========================================== */

addColaTranslations({

    "egypt premier league":
    "Egypt Premier League",

    "giải vô địch ai cập":
    "Egypt Premier League"

});





/* ==========================================
   MOROCCO
========================================== */

addColaTranslations({

    "botola pro":
    "Morocco Botola Pro",

    "morocco league":
    "Morocco Botola Pro"

});





/* ==========================================
   INTERNATIONAL WOMEN
========================================== */

addColaTranslations({

    "giải vô địch bóng đá nữ thế giới":
    "FIFA Women's World Cup",

    "fifa women's world cup":
    "FIFA Women's World Cup",

    "uefa women's champions league":
    "UEFA Women's Champions League",

    "women champions league":
    "Women's Champions League"

});





/* ==========================================
   YOUTH COMPETITIONS
========================================== */

addColaTranslations({

    "giải vô địch u23 châu á":
    "AFC U23 Asian Cup",

    "afc u23 asian cup":
    "AFC U23 Asian Cup",

    "giải vô địch u20 thế giới":
    "FIFA U20 World Cup",

    "giải vô địch u17 thế giới":
    "FIFA U17 World Cup",

    "uefa youth league":
    "UEFA Youth League"

});





/* ==========================================
   OLYMPIC
========================================== */

addColaTranslations({

    "bóng đá olympic":
    "Olympic Football",

    "olympic football":
    "Olympic Football"

});





console.log(
"COLA Translator PART 4 Loaded"
);

/* ==========================================
   colaTranslator.js
   PART 5
   MULTI SPORT TRANSLATOR
========================================== */


/* ==========================================
   BASKETBALL
========================================== */

addColaTranslations({

    "giải nba":
    "NBA",

    "nba":
    "NBA",

    "giải nba summer league":
    "NBA Summer League",

    "nba summer league":
    "NBA Summer League",

    "nba preseason":
    "NBA Preseason",

    "nba finals":
    "NBA Finals",

    "national basketball association":
    "NBA",


    "euroleague":
    "EuroLeague",

    "euro cup basketball":
    "EuroCup Basketball",


    "acb liga":
    "Spanish Basketball League",

    "liga acb":
    "Spanish Basketball League",


    "basketball champions league":
    "Basketball Champions League",


    "fiba world cup":
    "FIBA Basketball World Cup",

    "giải vô địch bóng rổ thế giới":
    "FIBA Basketball World Cup"

});





/* ==========================================
   NCAA BASKETBALL
========================================== */

addColaTranslations({

    "ncaa":
    "NCAA Basketball",

    "ncaa basketball":
    "NCAA Basketball",

    "college basketball":
    "College Basketball"

});





/* ==========================================
   TENNIS
========================================== */

addColaTranslations({

    "atp":
    "ATP Tennis",

    "atp tour":
    "ATP Tour",

    "wta":
    "WTA Tennis",

    "wta tour":
    "WTA Tour",


    "grand slam":
    "Grand Slam Tennis",

    "australian open":
    "Australian Open",

    "roland garros":
    "French Open",

    "french open":
    "French Open",

    "wimbledon":
    "Wimbledon",

    "us open":
    "US Open"

});





/* ==========================================
   MOTORSPORT
========================================== */

addColaTranslations({

    "formula 1":
    "Formula 1",

    "f1":
    "Formula 1",

    "fia formula one":
    "Formula 1",

    "formula 2":
    "Formula 2",

    "formula e":
    "Formula E",


    "motogp":
    "MotoGP",

    "moto gp":
    "MotoGP",

    "world superbike":
    "World Superbike"

});





/* ==========================================
   VOLLEYBALL
========================================== */

addColaTranslations({

    "volleyball nations league":
    "Volleyball Nations League",

    "vnl":
    "Volleyball Nations League",

    "giải bóng chuyền thế giới":
    "World Volleyball Championship",

    "fivb":
    "FIVB Volleyball"

});





/* ==========================================
   BASEBALL
========================================== */

addColaTranslations({

    "mlb":
    "Major League Baseball",

    "major league baseball":
    "MLB",

    "kbo":
    "KBO Baseball",

    "npb":
    "Japanese Baseball League"

});





/* ==========================================
   ICE HOCKEY
========================================== */

addColaTranslations({

    "nhl":
    "National Hockey League",

    "national hockey league":
    "NHL",

    "khl":
    "Kontinental Hockey League",

    "ice hockey world championship":
    "Ice Hockey World Championship"

});





/* ==========================================
   BOXING / MMA
========================================== */

addColaTranslations({

    "ufc":
    "UFC",

    "ultimate fighting championship":
    "UFC",

    "boxing":
    "Boxing",

    "world boxing championship":
    "World Boxing Championship"

});





/* ==========================================
   CRICKET
========================================== */

addColaTranslations({

    "ipl":
    "Indian Premier League Cricket",

    "indian premier league":
    "Indian Premier League Cricket",

    "icc cricket world cup":
    "ICC Cricket World Cup",

    "cricket world cup":
    "Cricket World Cup"

});





/* ==========================================
   GOLF
========================================== */

addColaTranslations({

    "pga tour":
    "PGA Tour Golf",

    "the masters":
    "The Masters Golf",

    "us open golf":
    "US Open Golf"

});





/* ==========================================
   GENERAL SPORT NAME
========================================== */

addColaTranslations({

    "足球":
    "Football",

    "篮球":
    "Basketball",

    "网球":
    "Tennis",

    "排球":
    "Volleyball",

    "赛车":
    "Motorsport"

});





console.log(
"COLA Translator PART 5 Loaded - MULTI SPORT"
);

/* ==========================================
   colaTranslator.js
   PART 6
   AUTO TRANSLATE ENGINE
========================================== */


/*
    CLEAN VIETNAMESE COMPETITION NAME
*/


function autoTranslateColaLeague(name, fallback=""){


    if(!name)
        return "Other";



    let original =
    name.trim();



    let text =
    original.toLowerCase();





    /*
       CEK DATABASE TRANSLATION
    */


    if(
        typeof colaTranslate === "function"
    ){

        let result =
        colaTranslate(original);


        if(
            result &&
            result !== original
        ){

            return result;

        }

    }







    /*
       REMOVE VIETNAMESE WORD
    */


    const replaceMap = {


        "giải vô địch bóng đá thế giới":
        "FIFA World Cup",


        "giải vô địch bóng đá":
        "Football Championship",


        "giải vô địch":
        "Championship",


        "giải":
        "League",


        "vô địch":
        "Championship",


        "quốc gia":
        "National",


        "bóng đá":
        "Football",


        "thế giới":
        "World",


        "châu âu":
        "Europe",


        "châu á":
        "Asia",


        "anh":
        "England",


        "pháp":
        "France",


        "đức":
        "Germany",


        "tây ban nha":
        "Spain",


        "italia":
        "Italy",


        "nhật bản":
        "Japan",


        "hàn quốc":
        "South Korea",


        "mexico":
        "Mexico"

    };








    Object.keys(replaceMap)
    .forEach(key=>{


        text =
        text.replace(
            new RegExp(key,"gi"),
            replaceMap[key]
        );


    });









    /*
       FORMAT TEXT
    */


    text =
    text
    .replace(/\s+/g," ")
    .trim();







    /*
       CAPITALIZE
    */


    text =
    text
    .split(" ")
    .map(word=>{

        return word
        .charAt(0)
        .toUpperCase()
        +
        word.slice(1);

    })
    .join(" ");








    /*
       JIKA HASIL MASIH ANEH
       AMBIL FALLBACK
    */


    if(
        text.length < 3 ||
        text.includes("Giải")
    ){

        if(fallback){

            return fallback;

        }

    }






    return text;


}








/* ==========================================
   PATCH CREATE CARD
========================================== */


/*
   Override competition display
*/


function translateColaCompetition(match){


    let main =
    match.competitionName ||
    "";



    let fallback =
    match
    ?.node_api_data
    ?.competition
    ?.name
    ||
    match
    ?.competition
    ?.name
    ||
    "";



    return autoTranslateColaLeague(
        main,
        fallback
    );


}







console.log(
"COLA Translator PART 6 Loaded - AUTO ENGINE"
);  

})(window);
