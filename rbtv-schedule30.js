```javascript
/*!
 * RBTV+ Auto Schedule
 * N11BOLAHD
 * SCHEDULE / API DECODER + RENDER
 */

(function () {

  "use strict";

  console.clear();

  console.log(
    "%c[RBTV SCHEDULE 13] START",
    "color:#00d979;font-weight:bold"
  );


  /* =========================================================
     CONFIG
  ========================================================= */

  const RBTV_API =
    "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live?sportType=1&language=34&stream=true";


  /* =========================================================
     BASIC HELPERS
  ========================================================= */

  function rbReadVarint(buf, pos) {

    let value = 0n;
    let shift = 0n;

    while (pos < buf.length) {

      const b = buf[pos++];

      value |= BigInt(b & 0x7F) << shift;

      if (!(b & 0x80)) {

        return {
          value,
          next: pos
        };

      }

      shift += 7n;

      if (shift > 70n) break;
    }

    return null;
  }


  function rbReadFields(buf) {

    const fields = [];

    let p = 0;

    while (p < buf.length) {

      const keyInfo = rbReadVarint(buf, p);

      if (!keyInfo) break;

      p = keyInfo.next;

      const key = Number(keyInfo.value);

      const fieldNo = key >>> 3;
      const wireType = key & 7;

      if (!fieldNo) break;

      let value = null;

      const start = p;

      let end = p;


      try {

        /* VARINT */

        if (wireType === 0) {

          const v = rbReadVarint(buf, p);

          if (!v) break;

          value = v.value;

          p = v.next;

          end = p;
        }


        /* FIXED64 */

        else if (wireType === 1) {

          if (p + 8 > buf.length) break;

          value = buf.slice(p, p + 8);

          p += 8;

          end = p;
        }


        /* LENGTH DELIMITED */

        else if (wireType === 2) {

          const lenInfo = rbReadVarint(buf, p);

          if (!lenInfo) break;

          p = lenInfo.next;

          const len = Number(lenInfo.value);

          if (
            !Number.isFinite(len) ||
            len < 0 ||
            p + len > buf.length
          ) {
            break;
          }

          value = buf.slice(p, p + len);

          p += len;

          end = p;
        }


        /* FIXED32 */

        else if (wireType === 5) {

          if (p + 4 > buf.length) break;

          value = buf.slice(p, p + 4);

          p += 4;

          end = p;
        }


        else {

          break;
        }


        fields.push({
          fieldNo,
          wireType,
          value,
          start,
          end
        });

      } catch (e) {

        break;
      }
    }

    return fields;
  }


  function rbBytesToString(bytes) {

    try {

      return new TextDecoder("utf-8", {
        fatal: false
      }).decode(bytes);

    } catch (e) {

      return "";
    }
  }


  /* =========================================================
     CLEAN TEXT
  ========================================================= */

  function rbCleanText(str) {

    if (typeof str !== "string") return "";

    let s = str;


    s = s
      .replace(/^\uFEFF/, "")
      .replace(/[\u200B-\u200D\u2060]/g, "");


    s = s.replace(
      /[\x00-\x1F\x7F]/g,
      ""
    );


    s = s.trim();


    s = s.replace(
      /^[^A-Za-zÀ-ÿ0-9]+/,
      ""
    );


    s = s.replace(
      /^&+/,
      ""
    );


    s = s.replace(
      /^\d+(?=[A-Za-zÀ-ÿ])/,
      ""
    );


    return s.trim();
  }


  /* =========================================================
     URL HELPERS
  ========================================================= */

  function rbLooksLikeUrl(str) {

    return (
      typeof str === "string" &&
      /^https?:\/\//i.test(str)
    );
  }


  function rbIsTeamLogo(str) {

    return (
      rbLooksLikeUrl(str) &&
      /\/football\/team\//i.test(str)
    );
  }


  function rbIsCompetitionLogo(str) {

    return (
      rbLooksLikeUrl(str) &&
      /\/football\/competition\//i.test(str)
    );
  }


  /* =========================================================
     RECURSIVE STRING COLLECTION
  ========================================================= */

  function rbCollectStrings(
    buf,
    depth = 0,
    result = []
  ) {

    if (!buf || depth > 10) {
      return result;
    }


    const fields = rbReadFields(buf);


    for (const f of fields) {

      if (f.wireType !== 2) {
        continue;
      }


      const bytes = f.value;

      const str =
        rbBytesToString(bytes);


      if (str) {

        const clean =
          str.trim();


        if (
          clean &&
          !clean.includes("\u0000")
        ) {

          result.push({
            field: f.fieldNo,
            text: clean,
            bytes
          });

        }
      }


      rbCollectStrings(
        bytes,
        depth + 1,
        result
      );
    }


    return result;
  }


  /* =========================================================
     FIND TEAM OBJECTS
  ========================================================= */

  function rbFindTeamObjects(
    buf,
    depth = 0,
    result = []
  ) {

    if (!buf || depth > 8) {
      return result;
    }


    const fields =
      rbReadFields(buf);


    const directStrings = [];


    for (const f of fields) {

      if (f.wireType !== 2) {
        continue;
      }


      const text =
        rbBytesToString(f.value);


      if (!text) {
        continue;
      }


      const clean =
        rbCleanText(text);


      if (!clean) {
        continue;
      }


      directStrings.push({
        field: f.fieldNo,
        text: clean,
        bytes: f.value
      });

    }


    const directLogo =
      directStrings.find(x =>
        rbIsTeamLogo(x.text)
      );


    if (directLogo) {

      const possibleNames = [];


      for (const x of directStrings) {

        const clean =
          rbCleanText(x.text);


        if (!clean) {
          continue;
        }


        if (
          rbLooksLikeUrl(clean)
        ) {
          continue;
        }


        if (
          /^\d+$/.test(clean)
        ) {
          continue;
        }


        if (
          /^\d{4}$/.test(clean)
        ) {
          continue;
        }


        if (
          clean.length < 2 ||
          clean.length > 120
        ) {
          continue;
        }


        if (
          /\svs\s/i.test(clean) ||
          /-vs-/i.test(clean)
        ) {
          continue;
        }


        if (
          clean === "SuccessR" ||
          clean === "def"
        ) {
          continue;
        }


        possibleNames.push(clean);

      }


      let possibleName = "";


      if (possibleNames.length) {

        possibleName =
          possibleNames[
            possibleNames.length - 1
          ];

      }


      if (possibleName) {

        result.push({

          name:
            possibleName,

          logo:
            directLogo.text,

          depth

        });

      }

    }


    for (const f of fields) {

      if (f.wireType !== 2) {
        continue;
      }


      rbFindTeamObjects(
        f.value,
        depth + 1,
        result
      );

    }


    return result;
  }


  /* =========================================================
     FIND COMPETITION
  ========================================================= */

  function rbFindCompetition(buf) {

    let competitionName = "";
    let competitionLogo = "";


    function walk(current, depth) {

      if (
        !current ||
        depth > 10 ||
        competitionName
      ) {
        return;
      }


      const fields =
        rbReadFields(current);


      for (let i = 0; i < fields.length; i++) {

        const f =
          fields[i];


        if (f.wireType !== 2) {
          continue;
        }


        const nested =
          f.value;


        const localFields =
          rbReadFields(nested);


        let localLogo = "";

        let localStrings = [];


        for (const nf of localFields) {

          if (nf.wireType !== 2) {
            continue;
          }


          const s =
            rbBytesToString(
              nf.value
            );


          if (!s) {
            continue;
          }


          const clean =
            s.trim();


          localStrings.push({
            field: nf.fieldNo,
            text: clean
          });


          if (
            rbIsCompetitionLogo(clean)
          ) {

            localLogo =
              clean;
          }
        }


        if (localLogo) {

          for (
            const x of localStrings
          ) {

            const clean =
              rbCleanText(x.text);


            if (!clean) {
              continue;
            }


            if (
              rbLooksLikeUrl(clean)
            ) {
              continue;
            }


            if (
              /^\d+$/.test(clean)
            ) {
              continue;
            }


            if (
              /^\d{4}$/.test(clean)
            ) {
              continue;
            }


            if (
              clean.length < 2 ||
              clean.length > 100
            ) {
              continue;
            }


            if (
              /\svs\s/i.test(clean) ||
              /-vs-/i.test(clean)
            ) {
              continue;
            }


            if (
              clean === "SuccessR" ||
              clean === "def"
            ) {
              continue;
            }


            competitionName =
              clean;

            competitionLogo =
              localLogo;

            break;
          }
        }


        if (!competitionName) {

          walk(
            nested,
            depth + 1
          );
        }


        if (competitionName) {
          return;
        }
      }
    }


    walk(buf, 0);


    return {

      name:
        rbCleanText(
          competitionName
        ),

      logo:
        competitionLogo
    };
  }


  /* =========================================================
     FIND MATCH TITLE
  ========================================================= */

  function rbFindTitle(strings) {

    let title = "";


    for (const x of strings) {

      const s =
        rbCleanText(x.text);


      if (!s) {
        continue;
      }


      if (
        /\svs\s/i.test(s)
      ) {

        if (
          s.length > title.length &&
          s.length < 250
        ) {

          title = s;
        }
      }
    }


    return title;
  }


  /* =========================================================
     FIND SLUG
  ========================================================= */

  function rbFindSlug(strings) {

    for (const x of strings) {

      const s =
        x.text.trim();


      if (
        /^[a-z0-9-]+-vs-[a-z0-9-]+$/i.test(s)
      ) {

        return s;
      }
    }


    return "";
  }


  /* =========================================================
     SPLIT HOME / AWAY
  ========================================================= */

  function rbSplitTeams(
    title,
    slug
  ) {

    let home = "";
    let away = "";


    const cleanTitle =
      rbCleanText(title);


    const m =
      cleanTitle.match(
        /^(.+?)\s+vs\s+(.+)$/i
      );


    if (m) {

      home =
        rbCleanText(m[1]);

      away =
        rbCleanText(m[2]);

    }


    if (
      (!home || !away) &&
      slug
    ) {

      const parts =
        slug.split(/-vs-/i);


      if (
        parts.length === 2
      ) {

        if (!home) {

          home =
            rbCleanText(
              parts[0]
                .replace(/-/g, " ")
            );
        }


        if (!away) {

          away =
            rbCleanText(
              parts[1]
                .replace(/-/g, " ")
            );
        }
      }
    }


    return {
      home,
      away
    };
  }


  /* =========================================================
     MATCH DATE
  ========================================================= */

  function rbGetMatchDate(
    recordBytes
  ) {

    const fields =
      rbReadFields(recordBytes);


    for (const f of fields) {

      if (
        f.fieldNo === 3 &&
        f.wireType === 0
      ) {

        const n =
          Number(f.value);


        if (
          Number.isFinite(n) &&
          n > 1000000000000 &&
          n < 3000000000000
        ) {

          return n;
        }
      }
    }


    return null;
  }


  /* =========================================================
     BUILD MATCH
  ========================================================= */

  function rbBuildMatch(
    recordBytes,
    recordStart,
    recordLength
  ) {

    const matchDate =
      rbGetMatchDate(
        recordBytes
      );


    if (!matchDate) {
      return null;
    }


    const strings =
      rbCollectStrings(
        recordBytes
      );


    const title =
      rbFindTitle(strings);


    if (!title) {
      return null;
    }


    const slug =
      rbFindSlug(strings);


    const teams =
      rbSplitTeams(
        title,
        slug
      );


    let home =
      teams.home;

    let away =
      teams.away;


    if (!home || !away) {
      return null;
    }


    /* TEAM OBJECTS */

    const teamObjects =
      rbFindTeamObjects(
        recordBytes
      );


    const uniqueTeams = [];


    for (const t of teamObjects) {

      if (!t.logo) {
        continue;
      }


      const exists =
        uniqueTeams.some(
          x =>
            x.name === t.name &&
            x.logo === t.logo
        );


      if (!exists) {

        uniqueTeams.push(t);

      }

    }


    /* MATCH TEAM LOGO */

    let homeLogo = "";
    let awayLogo = "";


    const homeLower =
      home
        .toLowerCase()
        .trim();


    const awayLower =
      away
        .toLowerCase()
        .trim();


    /* Exact match */

    for (const t of uniqueTeams) {

      const name =
        rbCleanText(
          t.name
        );


      if (!name) {
        continue;
      }


      const nameLower =
        name
          .toLowerCase()
          .trim();


      if (
        !homeLogo &&
        nameLower === homeLower
      ) {

        homeLogo =
          t.logo;

      }


      if (
        !awayLogo &&
        nameLower === awayLower
      ) {

        awayLogo =
          t.logo;

      }

    }


    /* Partial match */

    if (!homeLogo) {

      for (const t of uniqueTeams) {

        const name =
          rbCleanText(
            t.name
          );


        if (!name) {
          continue;
        }


        const nameLower =
          name
            .toLowerCase()
            .trim();


        if (
          homeLower.includes(nameLower) ||
          nameLower.includes(homeLower)
        ) {

          homeLogo =
            t.logo;

          break;

        }

      }

    }


    if (!awayLogo) {

      for (const t of uniqueTeams) {

        const name =
          rbCleanText(
            t.name
          );


        if (!name) {
          continue;
        }


        const nameLower =
          name
            .toLowerCase()
            .trim();


        if (
          awayLower.includes(nameLower) ||
          nameLower.includes(awayLower)
        ) {

          if (
            t.logo !== homeLogo
          ) {

            awayLogo =
              t.logo;

            break;

          }

        }

      }

    }


    /* Logo fallback */

    const logos =
      uniqueTeams
        .map(x => x.logo)
        .filter(Boolean);


    if (
      !homeLogo &&
      logos[0]
    ) {

      homeLogo =
        logos[0];

    }


    if (!awayLogo) {

      const secondLogo =
        logos.find(
          logo =>
            logo !== homeLogo
        );


      if (secondLogo) {

        awayLogo =
          secondLogo;

      }

    }


    console.log(
      "%c[RBTV TEAM OBJECTS]",
      "color:#00d979;font-weight:bold"
    );


    console.log({

      home,
      away,
      teamObjects,
      uniqueTeams,
      homeLogo,
      awayLogo

    });


    /* COMPETITION */

    const competitionData =
      rbFindCompetition(
        recordBytes
      );


    const date =
      new Date(
        matchDate
      );


    return {

      matchDate,

      utc:
        date.toISOString(),

      wib:
        date.toLocaleString(
          "id-ID",
          {
            timeZone:
              "Asia/Jakarta",
            hour12: false
          }
        ),

      competition:
        rbCleanText(
          competitionData.name
        ),

      competitionLogo:
        competitionData.logo || "",

      title:
        `${home} vs ${away}`,

      home:
        rbCleanText(home),

      away:
        rbCleanText(away),

      homeLogo,

      awayLogo,

      slug,

      recordStart,

      recordLength

    };

  }


  /* =========================================================
     FIND PROTOBUF RECORDS
  ========================================================= */

  function rbFindRecords(
    buffer
  ) {

    const records = [];


    for (
      let i = 0;
      i < buffer.length;
      i++
    ) {

      if (
        buffer[i] !== 0x0A
      ) {
        continue;
      }


      const lenInfo =
        rbReadVarint(
          buffer,
          i + 1
        );


      if (!lenInfo) {
        continue;
      }


      const len =
        Number(
          lenInfo.value
        );


      const payloadStart =
        lenInfo.next;


      const payloadEnd =
        payloadStart + len;


      if (
        !Number.isFinite(len) ||
        len <= 100 ||
        payloadEnd >
          buffer.length
      ) {
        continue;
      }


      const payload =
        buffer.slice(
          payloadStart,
          payloadEnd
        );


      let hasSlug = false;


      const strings =
        rbCollectStrings(
          payload,
          0,
          []
        );


      for (
        const x of strings
      ) {

        if (
          /-vs-/i.test(
            x.text
          )
        ) {

          hasSlug = true;

          break;
        }

      }


      if (!hasSlug) {
        continue;
      }


      records.push({

        start: i,

        length:
          len,

        payload

      });


      if (
        payloadEnd > i
      ) {

        i =
          payloadEnd - 1;

      }

    }


    return records;
  }


  /* =========================================================
     RENDER RBTV SCHEDULE
  ========================================================= */

  function rbRenderSchedule(matches) {

    const container =
      document.querySelector(
        "#rbtvSchedule"
      );


    if (!container) {

      console.error(
        "%c[RBTV] #rbtvSchedule TIDAK DITEMUKAN",
        "color:red;font-weight:bold"
      );

      return;

    }


    if (
      !matches ||
      !matches.length
    ) {

      container.innerHTML = `
        <div class="iko-loading">
          Match not found
        </div>
      `;

      return;

    }


    let html = "";


    matches.forEach(
      match => {

        const date =
          new Date(
            match.matchDate
          );


        const time =
          date.toLocaleTimeString(
            "id-ID",
            {
              timeZone:
                "Asia/Jakarta",

              hour:
                "2-digit",

              minute:
                "2-digit",

              hour12:
                false
            }
          );


        let competitionHTML = "";


        if (
          match.competitionLogo
        ) {

          competitionHTML = `
            <img
              src="${match.competitionLogo}"
              alt=""
              class="rbtv-competition-logo"
              loading="lazy"
            >
          `;

        }


        html += `

          <div
            class="rbtv-match"
            data-match-no="${match.no}"
          >

            <div class="rbtv-match-header">

              <span class="rbtv-match-no">
                ${match.no}
              </span>


              <span class="rbtv-time">
                ${time}
              </span>


              <span class="rbtv-competition">

                ${competitionHTML}

                <span>
                  ${match.competition || "Football"}
                </span>

              </span>

            </div>


            <div class="rbtv-teams">


              <div class="rbtv-team">

                ${
                  match.homeLogo
                    ? `
                      <img
                        src="${match.homeLogo}"
                        alt="${match.home}"
                        loading="lazy"
                      >
                    `
                    : ""
                }


                <span>
                  ${match.home}
                </span>

              </div>


              <div class="rbtv-vs">
                VS
              </div>


              <div class="rbtv-team">

                ${
                  match.awayLogo
                    ? `
                      <img
                        src="${match.awayLogo}"
                        alt="${match.away}"
                        loading="lazy"
                      >
                    `
                    : ""
                }


                <span>
                  ${match.away}
                </span>

              </div>


            </div>

          </div>

        `;

      }
    );


    container.innerHTML =
      html;


    console.log(
      "%c[RBTV] SCHEDULE RENDERED:",
      "color:#00d979;font-weight:bold",
      matches.length
    );

  }


  /* =========================================================
     FETCH API
  ========================================================= */

  async function rbFetch() {

    const response =
      await fetch(
        RBTV_API,
        {

          method:
            "GET",

          headers: {

            "Accept":
              "application/json, text/plain, */*"

          },

          cache:
            "no-store"

        }
      );


    console.log(
      "%c[RBTV] HTTP:",
      "color:#00d979;font-weight:bold",
      response.status
    );


    if (!response.ok) {

      throw new Error(
        "RBTV API HTTP " +
        response.status
      );

    }


    const buffer =
      new Uint8Array(
        await response.arrayBuffer()
      );


    console.log(
      "%c[RBTV] SIZE:",
      "color:#00d979;font-weight:bold",
      buffer.length
    );


    return buffer;

  }


  /* =========================================================
     MAIN
  ========================================================= */

  async function init() {

    try {

      const buffer =
        await rbFetch();


      const records =
        rbFindRecords(
          buffer
        );


      console.log(
        "%c[RBTV] RECORDS FOUND:",
        "color:#00d979;font-weight:bold",
        records.length
      );


      const matches = [];


      for (
        const record of records
      ) {

        const match =
          rbBuildMatch(
            record.payload,
            record.start,
            record.length
          );


        if (!match) {
          continue;
        }


        matches.push(
          match
        );

      }


      /* SORT CHRONOLOGICAL */

      matches.sort(
        (a, b) =>
          a.matchDate -
          b.matchDate
      );


      /* NUMBER */

      matches.forEach(
        (match, index) => {

          match.no =
            index + 1;

        }
      );


      console.log(
        "%c[RBTV MATCHES]",
        "color:#00d979;font-weight:bold"
      );


      console.log(
        "TOTAL:",
        matches.length
      );


      console.log(
        matches
      );


      /* =====================================================
         DEBUG FIRST MATCH
      ===================================================== */

      console.log(
        "%c[RBTV FIRST MATCH]",
        "color:#00d979;font-weight:bold"
      );


      console.log(
        matches[0]
      );


      /* =====================================================
         DEBUG FIRST 5
      ===================================================== */

      console.log(
        "%c[RBTV FIRST 5 MATCH FULL]",
        "color:#00d979;font-weight:bold"
      );


      console.log(
        JSON.stringify(
          matches.slice(0, 5),
          null,
          2
        )
      );


      /* =====================================================
         DEBUG COMPETITION / LOGO
      ===================================================== */

      console.log(
        "%c[RBTV COMPETITION TEST]",
        "color:#00d979;font-weight:bold"
      );


      matches
        .slice(0, 10)
        .forEach(
          (m, i) => {

            console.log(
              i + 1,
              {

                competition:
                  m.competition,

                competitionLogo:
                  m.competitionLogo,

                home:
                  m.home,

                away:
                  m.away,

                homeLogo:
                  m.homeLogo,

                awayLogo:
                  m.awayLogo

              }
            );

          }
        );


      /* =====================================================
         GLOBAL
      ===================================================== */

      window.RBTV_MATCHES =
        matches;


      console.log(
        "%c[RBTV] window.RBTV_MATCHES READY",
        "color:#00d979;font-weight:bold"
      );


      /* =====================================================
         RENDER TO BLOGGER
      ===================================================== */

      rbRenderSchedule(
        matches
      );


    } catch (error) {

      console.error(
        "%c[RBTV ERROR]",
        "color:red;font-weight:bold",
        error
      );


      const container =
        document.querySelector(
          "#rbtvSchedule"
        );


      if (container) {

        container.innerHTML = `
          <div class="iko-loading">
            Failed to load RBTV schedule
          </div>
        `;

      }

    }

  }


  /* =========================================================
     WAIT FOR BLOGGER HTML
  ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();

  }


})();
```
