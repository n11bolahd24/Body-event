

/*!
 * RBTV+ Auto Schedule
 * N11BOLAHD
 * SCHEDULE / API DECODER ONLY
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

    /*
     * Buang BOM / zero-width
     */

    s = s
      .replace(/^\uFEFF/, "")
      .replace(/[\u200B-\u200D\u2060]/g, "");


    /*
     * Buang karakter kontrol
     */

    s = s.replace(
      /[\x00-\x1F\x7F]/g,
      ""
    );


    s = s.trim();


    /*
     * Karakter protobuf yang kadang
     * terbaca sebagai bagian nama.
     *
     * Contoh:
     * &TGE Dieppe Bay Eagles
     * 1New York City Football Club
     */

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


      /*
       * Nested protobuf
       */

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
   FIX TEAM LOGO MATCHING
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


  /*
   * Cari logo TEAM yang berada
   * di message ini / child langsung.
   *
   * Jangan menggunakan semua string
   * recursive sekaligus karena logo team
   * lain bisa ikut terbaca.
   */

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


  /*
   * Logo team yang ditemukan
   * langsung di message ini.
   */

  const directLogo =
    directStrings.find(x =>
      rbIsTeamLogo(x.text)
    );


  if (directLogo) {

    const possibleNames = [];


    /*
     * Nama team harus berasal dari
     * message yang sama.
     */

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


    /*
     * Ambil kandidat nama terakhir.
     */

    let possibleName = "";


    if (possibleNames.length) {

      possibleName =
        possibleNames[
          possibleNames.length - 1
        ];

    }


    /*
     * Simpan hanya kalau memang
     * ada nama team.
     */

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


  /*
   * Sekarang baru turun ke nested
   * message satu per satu.
   */

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


        /*
         * Jika message ini mempunyai
         * competition logo, cari nama
         * pada message yang sama.
         */

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


            /*
             * Hindari data seperti:
             * SuccessR
             * 2026
             * def
             */

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


        /*
         * Kalau belum ketemu,
         * turun ke nested message.
         */

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


    /*
     * Fallback menggunakan slug.
     */

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
     IMPORTANT:
     TOP LEVEL FIELD 3 ONLY
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


/*
 * Team objects
 */

const teamObjects =
  rbFindTeamObjects(
    recordBytes
  );


/*
 * Deduplicate berdasarkan
 * pasangan nama + logo.
 */

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


/*
 * =========================================================
 * MATCH TEAM LOGO
 * =========================================================
 */

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


/*
 * Exact match terlebih dahulu.
 */

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


/*
 * Partial match sebagai fallback.
 */

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

      /*
       * Jangan gunakan logo yang sama
       * kalau sebenarnya ada object team
       * lain yang cocok.
       */

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


/*
 * Fallback berdasarkan urutan
 * hanya kalau pencocokan nama gagal.
 */

const logos =
  uniqueTeams
    .map(x => x.logo)
    .filter(Boolean);


/*
 * Home fallback.
 */

if (
  !homeLogo &&
  logos[0]
) {

  homeLogo =
    logos[0];

}


/*
 * Away fallback.
 *
 * Jangan pernah sengaja membuat
 * awayLogo = homeLogo.
 */

if (
  !awayLogo
) {

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


/*
 * DEBUG TEAM OBJECTS
 */

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


    /*
     * Competition
     */

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

      /*
       * field 1 length-delimited
       *
       * 0A <length> <payload>
       */

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


      /*
       * Match record harus mempunyai
       * slug -vs-
       */

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


      /*
       * Lompat melewati record.
       */

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
     FETCH API
  ========================================================= */

  async function rbFetch() {

    const response =
      await fetch(
        RBTV_API,
        {
          method: "GET",

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


      /*
       * Sort chronological
       */

      matches.sort(
        (a, b) =>
          a.matchDate -
          b.matchDate
      );


      /*
       * Number
       */

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


      /*
       * Global
       */

      window.RBTV_MATCHES =
        matches;

```javascript
      /* =====================================================
         RBTV WEB SCHEDULE RENDER
      ===================================================== */

      function rbEscapeHtml(value) {

        if (value === null || value === undefined) {
          return "";
        }

        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }


      function rbCreateScheduleContainer() {

  const container =
    document.getElementById("rbtvSchedule");

  if (!container) {

    console.error(
      "%c[RBTV] #rbtvSchedule TIDAK DITEMUKAN DI HTML",
      "color:red;font-weight:bold"
    );

    return null;
  }

  return container;
}

      function rbInjectScheduleCSS() {

        if (
          document.getElementById(
            "rbtvScheduleCSS"
          )
        ) {
          return;
        }


        const style =
          document.createElement("style");


        style.id =
          "rbtvScheduleCSS";


        style.textContent = `

          #rbtvSchedule {
            width: 95%;
            max-width: 1000px;
            margin: 10px auto;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
          }


          .rbtv-date {
            margin: 14px 0 6px;
            padding: 8px 10px;
            background: #111;
            border-left: 3px solid #00d979;
            color: #fff;
            font-size: 12px;
            font-weight: bold;
          }


          .rbtv-match {
            position: relative;
            display: grid;
            grid-template-columns: 55px 1fr 70px 1fr;
            align-items: center;
            gap: 8px;
            margin-bottom: 5px;
            padding: 8px;
            background: #111;
            border: 1px solid #242424;
            border-radius: 4px;
            box-sizing: border-box;
          }


          .rbtv-no {
            color: #777;
            font-size: 10px;
            text-align: center;
          }


          .rbtv-time {
            color: #00d979;
            font-family: "Courier New", monospace;
            font-size: 13px;
            font-weight: bold;
            text-align: center;
          }


          .rbtv-team {
            display: flex;
            align-items: center;
            gap: 7px;
            min-width: 0;
            color: #fff;
            font-size: 12px;
          }


          .rbtv-team.home {
            justify-content: flex-end;
            text-align: right;
          }


          .rbtv-team.away {
            justify-content: flex-start;
            text-align: left;
          }


          .rbtv-team img {
            width: 30px;
            height: 30px;
            object-fit: contain;
            flex: 0 0 30px;
          }


          .rbtv-vs {
            color: #777;
            font-family: "Courier New", monospace;
            font-size: 10px;
            text-align: center;
          }


          .rbtv-competition {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            padding-top: 5px;
            border-top: 1px solid #202020;
            color: #aaa;
            font-size: 9px;
            text-align: center;
          }


          .rbtv-competition img {
            width: 18px;
            height: 18px;
            object-fit: contain;
          }


          .rbtv-empty {
            padding: 20px;
            background: #111;
            border: 1px solid #242424;
            color: #777;
            text-align: center;
            font-family: "Courier New", monospace;
            font-size: 11px;
          }


          @media (max-width: 600px) {

            #rbtvSchedule {
              width: 98%;
              margin: 8px auto;
            }


            .rbtv-match {
              grid-template-columns:
                38px 1fr 35px 1fr;

              gap: 4px;

              padding: 7px 5px;
            }


            .rbtv-no {
              font-size: 8px;
            }


            .rbtv-time {
              font-size: 10px;
            }


            .rbtv-team {
              font-size: 10px;
              gap: 4px;
            }


            .rbtv-team img {
              width: 25px;
              height: 25px;
              flex-basis: 25px;
            }


            .rbtv-vs {
              font-size: 8px;
            }


            .rbtv-competition {
              font-size: 8px;
            }


            .rbtv-competition img {
              width: 16px;
              height: 16px;
            }

          }

        `;


        document.head.appendChild(
          style
        );
      }


      function rbFormatDate(matchDate) {

        const date =
          new Date(matchDate);


        return date.toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "Asia/Jakarta"
          }
        );
      }


      function rbFormatTime(matchDate) {

        const date =
          new Date(matchDate);


        return date.toLocaleTimeString(
          "id-ID",
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Jakarta"
          }
        );
      }


      function rbRenderSchedule(
        matches
      ) {

        rbInjectScheduleCSS();


        const container =
          rbCreateScheduleContainer();


        if (!container) {
          return;
        }


        container.innerHTML = "";


        if (
          !Array.isArray(matches) ||
          !matches.length
        ) {

          container.innerHTML = `
            <div class="rbtv-empty">
              No matches found
            </div>
          `;

          return;
        }


        /*
         * Pastikan tetap chronological.
         */

        const sortedMatches =
          [...matches].sort(
            (a, b) =>
              a.matchDate -
              b.matchDate
          );


        let currentDate = "";


        sortedMatches.forEach(
          (match, index) => {

            const dateLabel =
              rbFormatDate(
                match.matchDate
              );


            /*
             * Date header
             */

            if (
              dateLabel !==
              currentDate
            ) {

              currentDate =
                dateLabel;


              const dateHeader =
                document.createElement(
                  "div"
                );


              dateHeader.className =
                "rbtv-date";


              dateHeader.textContent =
                dateLabel;


              container.appendChild(
                dateHeader
              );
            }


            const row =
              document.createElement(
                "div"
              );


            row.className =
              "rbtv-match";


            const no =
              document.createElement(
                "div"
              );


            no.className =
              "rbtv-no";


            no.textContent =
              "#" +
              (
                match.no ||
                index + 1
              );


            const home =
              document.createElement(
                "div"
              );


            home.className =
              "rbtv-team home";


            const homeName =
              document.createElement(
                "span"
              );


            homeName.textContent =
              match.home || "";


            if (
              match.homeLogo
            ) {

              const img =
                document.createElement(
                  "img"
                );


              img.src =
                match.homeLogo;

              img.alt =
                match.home || "";


              img.loading =
                "lazy";


              home.appendChild(
                homeName
              );


              home.appendChild(
                img
              );

            } else {

              home.appendChild(
                homeName
              );
            }


            const center =
              document.createElement(
                "div"
              );


            center.innerHTML = `
              <div class="rbtv-time">
                ${rbEscapeHtml(
                  rbFormatTime(
                    match.matchDate
                  )
                )}
              </div>

              <div class="rbtv-vs">
                VS
              </div>
            `;


            const away =
              document.createElement(
                "div"
              );


            away.className =
              "rbtv-team away";


            if (
              match.awayLogo
            ) {

              const img =
                document.createElement(
                  "img"
                );


              img.src =
                match.awayLogo;

              img.alt =
                match.away || "";


              img.loading =
                "lazy";


              away.appendChild(
                img
              );
            }


            const awayName =
              document.createElement(
                "span"
              );


            awayName.textContent =
              match.away || "";


            away.appendChild(
              awayName
            );


            /*
             * Competition
             */

            const competition =
              document.createElement(
                "div"
              );


            competition.className =
              "rbtv-competition";


            if (
              match.competitionLogo
            ) {

              const competitionImg =
                document.createElement(
                  "img"
                );


              competitionImg.src =
                match.competitionLogo;


              competitionImg.alt =
                match.competition || "";


              competitionImg.loading =
                "lazy";


              competition.appendChild(
                competitionImg
              );
            }


            const competitionName =
              document.createElement(
                "span"
              );


            competitionName.textContent =
              match.competition ||
              "Football";


            competition.appendChild(
              competitionName
            );


            row.appendChild(
              no
            );


            row.appendChild(
              home
            );


            row.appendChild(
              center
            );


            row.appendChild(
              away
            );


            row.appendChild(
              competition
            );


            container.appendChild(
              row
            );

          }
        );


        console.log(
          "%c[RBTV] WEB SCHEDULE RENDERED:",
          "color:#00d979;font-weight:bold",
          sortedMatches.length
        );
      }


      /*
       * Global
       */

      window.RBTV_MATCHES =
        matches;


      /*
       * Render ke halaman web.
       */

      rbRenderSchedule(
        matches
      );


      console.log(
        "%c[RBTV] window.RBTV_MATCHES READY",
        "color:#00d979;font-weight:bold"
      );
```
      

      console.log(
        "%c[RBTV] window.RBTV_MATCHES READY",
        "color:#00d979;font-weight:bold"
      );


    } catch (error) {

      console.error(
        "%c[RBTV ERROR]",
        "color:red;font-weight:bold",
        error
      );

    }

  }


  init();

})();
