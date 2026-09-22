
/*!
 * RBTV+ Auto Schedule
 * N11BOLAHD
 * SCHEDULE / API DECODER + RENDER
 * API STATUS FILTER
 */

(function () {

  "use strict";

  console.log(
    "%c[RBTV SCHEDULE STATUS FIX] START",
    "color:#00d979;font-weight:bold"
  );


  /* =========================================================
     CONFIG
  ========================================================= */

  const RBTV_API =
    "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live?sportType=1&language=34&stream=true";

  const SCHEDULE_SELECTOR =
    "#rbtvSchedule";

  const STATUS_REFRESH_MS =
    30000;


  /* =========================================================
     BASIC PROTOBUF READER
  ========================================================= */

  function rbReadVarint(buf, pos) {

    let value = 0n;
    let shift = 0n;

    while (pos < buf.length) {

      const b = buf[pos++];

      value |=
        BigInt(b & 0x7F) << shift;

      if (!(b & 0x80)) {

        return {
          value,
          next: pos
        };

      }

      shift += 7n;

      if (shift > 70n) {
        break;
      }

    }

    return null;

  }


  function rbReadFields(buf) {

    const fields = [];

    let p = 0;

    while (p < buf.length) {

      const keyInfo =
        rbReadVarint(buf, p);

      if (!keyInfo) {
        break;
      }

      p =
        keyInfo.next;

      const key =
        Number(keyInfo.value);

      const fieldNo =
        key >>> 3;

      const wireType =
        key & 7;

      if (!fieldNo) {
        break;
      }

      let value = null;

      const start =
        p;

      let end =
        p;

      try {

        if (wireType === 0) {

          const v =
            rbReadVarint(
              buf,
              p
            );

          if (!v) {
            break;
          }

          value =
            v.value;

          p =
            v.next;

          end =
            p;

        }

        else if (wireType === 1) {

          if (
            p + 8 >
            buf.length
          ) {
            break;
          }

          value =
            buf.slice(
              p,
              p + 8
            );

          p += 8;

          end =
            p;

        }

        else if (wireType === 2) {

          const lenInfo =
            rbReadVarint(
              buf,
              p
            );

          if (!lenInfo) {
            break;
          }

          p =
            lenInfo.next;

          const len =
            Number(
              lenInfo.value
            );

          if (
            !Number.isFinite(len) ||
            len < 0 ||
            p + len > buf.length
          ) {
            break;
          }

          value =
            buf.slice(
              p,
              p + len
            );

          p += len;

          end =
            p;

        }

        else if (wireType === 5) {

          if (
            p + 4 >
            buf.length
          ) {
            break;
          }

          value =
            buf.slice(
              p,
              p + 4
            );

          p += 4;

          end =
            p;

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

      }

      catch (e) {

        break;

      }

    }

    return fields;

  }


  function rbBytesToString(bytes) {

    try {

      return new TextDecoder(
        "utf-8",
        {
          fatal: false
        }
      ).decode(bytes);

    }

    catch (e) {

      return "";

    }

  }


  /* =========================================================
     TEXT CLEANER
  ========================================================= */

  function rbCleanText(str) {

    if (
      typeof str !== "string"
    ) {
      return "";
    }

    let s =
      str
        .replace(
          /^\uFEFF/,
          ""
        )
        .replace(
          /[\u200B-\u200D\u2060]/g,
          ""
        )
        .replace(
          /[\x00-\x1F\x7F]/g,
          ""
        )
        .trim();

    s =
      s.replace(
        /^[^A-Za-zÀ-ÿ0-9]+/,
        ""
      );

    s =
      s.replace(
        /^&+/,
        ""
      );

    s =
      s.replace(
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

    if (
      !rbLooksLikeUrl(str)
    ) {
      return false;
    }

    const s =
      str.toLowerCase();

    return (

      /\/football\/team\//i.test(s) ||

      /\/football\/teams\//i.test(s) ||

      /\/team\//i.test(s) ||

      /\/teams\//i.test(s) ||

      /\/team[^/]*\/image/i.test(s) ||

      /\/teams?\/[^/]+\/image/i.test(s) ||

      /\/football\/.*\/image/i.test(s) ||

      /team.*image/i.test(s) ||

      /team.*logo/i.test(s) ||

      /logo.*team/i.test(s) ||

      /\.(png|jpg|jpeg|webp|svg)(\?.*)?$/i.test(s)

    );

  }


  function rbIsCompetitionLogo(str) {

    return (

      rbLooksLikeUrl(str) &&

      (

        /\/football\/competition\//i.test(str) ||

        /\/football\/competitions\//i.test(str) ||

        /competition.*logo/i.test(str) ||

        /logo.*competition/i.test(str)

      )

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

    if (
      !buf ||
      depth > 12
    ) {
      return result;
    }

    const fields =
      rbReadFields(buf);

    for (
      const f of fields
    ) {

      if (
        f.wireType !== 2
      ) {
        continue;
      }

      const bytes =
        f.value;

      const str =
        rbBytesToString(
          bytes
        );

      if (str) {

        const clean =
          rbCleanText(str);

        if (
          clean &&
          !clean.includes(
            "\u0000"
          )
        ) {

          result.push({
            field:
              f.fieldNo,
            text:
              clean,
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
     LOGOS
  ========================================================= */

  function rbCollectLogoUrls(
    buf,
    depth = 0,
    result = []
  ) {

    if (
      !buf ||
      depth > 12
    ) {
      return result;
    }

    const fields =
      rbReadFields(buf);

    for (
      const f of fields
    ) {

      if (
        f.wireType !== 2
      ) {
        continue;
      }

      const bytes =
        f.value;

      const str =
        rbBytesToString(
          bytes
        ).trim();

      if (
        rbLooksLikeUrl(str) &&
        rbIsTeamLogo(str)
      ) {

        if (
          !result.includes(str)
        ) {

          result.push(
            str
          );

        }

      }

      rbCollectLogoUrls(
        bytes,
        depth + 1,
        result
      );

    }

    return result;

  }


  /* =========================================================
     TEAM OBJECTS
  ========================================================= */

  function rbFindTeamObjects(
    buf,
    depth = 0,
    result = []
  ) {

    if (
      !buf ||
      depth > 12
    ) {
      return result;
    }

    const fields =
      rbReadFields(buf);

    const directStrings =
      [];

    for (
      const f of fields
    ) {

      if (
        f.wireType !== 2
      ) {
        continue;
      }

      const text =
        rbBytesToString(
          f.value
        );

      if (!text) {
        continue;
      }

      const clean =
        rbCleanText(
          text
        );

      if (!clean) {
        continue;
      }

      directStrings.push({
        field:
          f.fieldNo,
        text:
          clean,
        bytes:
          f.value
      });

    }

    const directLogo =
      directStrings.find(
        x =>
          rbIsTeamLogo(
            x.text
          )
      );

    if (directLogo) {

      const possibleNames =
        [];

      for (
        const x of directStrings
      ) {

        const clean =
          rbCleanText(
            x.text
          );

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

        possibleNames.push(
          clean
        );

      }

      if (
        possibleNames.length
      ) {

        result.push({
          name:
            possibleNames[
              possibleNames.length - 1
            ],
          logo:
            directLogo.text,
          depth
        });

      }

    }

    for (
      const f of fields
    ) {

      if (
        f.wireType !== 2
      ) {
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
     COMPETITION
  ========================================================= */

  function rbFindCompetition(
    buf
  ) {

    let competitionName =
      "";

    let competitionLogo =
      "";

    function walk(
      current,
      depth
    ) {

      if (
        !current ||
        depth > 12 ||
        competitionName
      ) {
        return;
      }

      const fields =
        rbReadFields(
          current
        );

      for (
        const f of fields
      ) {

        if (
          f.wireType !== 2
        ) {
          continue;
        }

        const nested =
          f.value;

        const localFields =
          rbReadFields(
            nested
          );

        let localLogo =
          "";

        const localStrings =
          [];

        for (
          const nf of localFields
        ) {

          if (
            nf.wireType !== 2
          ) {
            continue;
          }

          const text =
            rbBytesToString(
              nf.value
            );

          if (!text) {
            continue;
          }

          const clean =
            rbCleanText(
              text
            );

          localStrings.push({
            field:
              nf.fieldNo,
            text:
              clean
          });

          if (
            rbIsCompetitionLogo(
              clean
            )
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
              rbCleanText(
                x.text
              );

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

        if (
          !competitionName
        ) {

          walk(
            nested,
            depth + 1
          );

        }

        if (
          competitionName
        ) {
          return;
        }

      }

    }

    walk(
      buf,
      0
    );

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
     TITLE
  ========================================================= */

  function rbFindTitle(
    strings
  ) {

    let title =
      "";

    for (
      const x of strings
    ) {

      const s =
        rbCleanText(
          x.text
        );

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

          title =
            s;

        }

      }

    }

    return title;

  }


  /* =========================================================
     SLUG
  ========================================================= */

  function rbFindSlug(
    strings
  ) {

    for (
      const x of strings
    ) {

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
     SPLIT TEAMS
  ========================================================= */

  function rbSplitTeams(
    title,
    slug
  ) {

    let home =
      "";

    let away =
      "";

    const cleanTitle =
      rbCleanText(
        title
      );

    const m =
      cleanTitle.match(
        /^(.+?)\s+vs\s+(.+)$/i
      );

    if (m) {

      home =
        rbCleanText(
          m[1]
        );

      away =
        rbCleanText(
          m[2]
        );

    }

    if (
      (!home || !away) &&
      slug
    ) {

      const parts =
        slug.split(
          /-vs-/i
        );

      if (
        parts.length === 2
      ) {

        if (!home) {

          home =
            rbCleanText(
              parts[0]
                .replace(
                  /-/g,
                  " "
                )
            );

        }

        if (!away) {

          away =
            rbCleanText(
              parts[1]
                .replace(
                  /-/g,
                  " "
                )
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
      rbReadFields(
        recordBytes
      );

    for (
      const f of fields
    ) {

      if (
        f.fieldNo === 3 &&
        f.wireType === 0
      ) {

        const n =
          Number(
            f.value
          );

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
     API STATUS
     
     ROOT:
       field 1 = match id
       field 2 = API status
       field 3 = kickoff timestamp
       field 4 = sport/type

     Yang dipakai sebagai status HANYA root field 2.
  ========================================================= */

  function rbGetApiStatus(
    recordBytes
  ) {

    const fields =
      rbReadFields(
        recordBytes
      );

    for (
      const f of fields
    ) {

      if (
        f.fieldNo !== 2 ||
        f.wireType !== 0
      ) {
        continue;
      }

      const value =
        Number(
          f.value
        );

      if (
        Number.isFinite(value)
      ) {

        return value;

      }

    }

    return null;

  }


  /* =========================================================
     STATUS
     
     1 = UPCOMING
     2 = LIVE
     selain itu = FINISHED / NON ACTIVE
  ========================================================= */

  function rbGetStatus(
    match
  ) {

    const apiStatus =
      Number(
        match.apiStatus
      );

    if (
      apiStatus === 2
    ) {

      return {
        type:
          "live",
        label:
          "LIVE"
      };

    }

    if (
      apiStatus === 1
    ) {

      return {
        type:
          "upcoming",
        label:
          "UPCOMING"
      };

    }

    return {
      type:
        "finished",
      label:
        "FINISHED"
    };

  }


  function rbIsActiveMatch(
    match
  ) {

    const status =
      rbGetStatus(
        match
      );

    return (
      status.type === "upcoming" ||
      status.type === "live"
    );

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
      rbFindTitle(
        strings
      );

    if (!title) {
      return null;
    }

    const slug =
      rbFindSlug(
        strings
      );

    const teams =
      rbSplitTeams(
        title,
        slug
      );

    const home =
      teams.home;

    const away =
      teams.away;

    if (
      !home ||
      !away
    ) {
      return null;
    }

    const apiStatus =
      rbGetApiStatus(
        recordBytes
      );

    console.log(
      "%c[RBTV API STATUS]",
      "color:#ffff00;font-weight:bold",
      home + " vs " + away,
      {
        apiStatus,
        date:
          new Date(
            matchDate
          ).toISOString()
      }
    );


    /* =====================================================
       TEAM LOGOS
    ===================================================== */

    const teamObjects =
      rbFindTeamObjects(
        recordBytes
      );

    const allLogoUrls =
      rbCollectLogoUrls(
        recordBytes
      );

    const uniqueTeams =
      [];

    for (
      const t of teamObjects
    ) {

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

        uniqueTeams.push(
          t
        );

      }

    }


    let homeLogo =
      "";

    let awayLogo =
      "";


    const homeLower =
      home
        .toLowerCase()
        .trim();

    const awayLower =
      away
        .toLowerCase()
        .trim();


    for (
      const t of uniqueTeams
    ) {

      const name =
        rbCleanText(
          t.name
        );

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


    if (!homeLogo) {

      for (
        const t of uniqueTeams
      ) {

        const name =
          rbCleanText(
            t.name
          );

        const nameLower =
          name
            .toLowerCase()
            .trim();

        if (
          nameLower.length >= 3 &&
          (
            homeLower.includes(
              nameLower
            ) ||
            nameLower.includes(
              homeLower
            )
          )
        ) {

          homeLogo =
            t.logo;

          break;

        }

      }

    }


    if (!awayLogo) {

      for (
        const t of uniqueTeams
      ) {

        const name =
          rbCleanText(
            t.name
          );

        const nameLower =
          name
            .toLowerCase()
            .trim();

        if (
          nameLower.length >= 3 &&
          (
            awayLower.includes(
              nameLower
            ) ||
            nameLower.includes(
              awayLower
            )
          )
        ) {

          if (
            t.logo !==
            homeLogo
          ) {

            awayLogo =
              t.logo;

            break;

          }

        }

      }

    }


    if (
      !homeLogo &&
      uniqueTeams[0]
    ) {

      homeLogo =
        uniqueTeams[0].logo;

    }


    if (
      !awayLogo &&
      uniqueTeams.length > 1
    ) {

      const fallbackAway =
        uniqueTeams.find(
          t =>
            t.logo !==
            homeLogo
        );

      if (fallbackAway) {

        awayLogo =
          fallbackAway.logo;

      }

    }


    if (
      !homeLogo &&
      allLogoUrls[0]
    ) {

      homeLogo =
        allLogoUrls[0];

    }


    if (!awayLogo) {

      const secondLogo =
        allLogoUrls.find(
          logo =>
            logo !==
            homeLogo
        );

      if (secondLogo) {

        awayLogo =
          secondLogo;

      }

    }


    /* =====================================================
       COMPETITION
    ===================================================== */

    const competitionData =
      rbFindCompetition(
        recordBytes
      );


    return {

      matchDate,

      apiStatus,

      competition:
        rbCleanText(
          competitionData.name
        ),

      competitionLogo:
        competitionData.logo ||
        "",

      home:
        rbCleanText(
          home
        ),

      away:
        rbCleanText(
          away
        ),

      homeLogo,

      awayLogo,

      slug,

      recordStart,

      recordLength

    };

  }


  /* =========================================================
     FIND MATCH RECORDS
  ========================================================= */

  function rbFindRecords(
    buffer
  ) {

    const records =
      [];

    for (
      let i = 0;
      i < buffer.length;
      i++
    ) {

      if (
        buffer[i] !==
        0x0A
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
        payloadStart +
        len;

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

      const strings =
        rbCollectStrings(
          payload
        );

      const hasSlug =
        strings.some(
          x =>
            /-vs-/i.test(
              x.text
            )
        );

      if (!hasSlug) {
        continue;
      }

      records.push({
        start:
          i,
        length:
          len,
        payload
      });

      i =
        payloadEnd - 1;

    }

    return records;

  }


  /* =========================================================
     DATE / TIME
  ========================================================= */

  function rbDateKey(
    timestamp
  ) {

    return new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Jakarta",
        weekday:
          "long",
        year:
          "numeric",
        month:
          "long",
        day:
          "2-digit"
      }
    ).format(
      new Date(
        timestamp
      )
    );

  }


  function rbFormatTime(
    timestamp
  ) {

    return new Intl.DateTimeFormat(
      "en-GB",
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
    ).format(
      new Date(
        timestamp
      )
    );

  }


  /* =========================================================
     COUNTDOWN
  ========================================================= */

  function rbCountdown(
    timestamp
  ) {

    const diff =
      timestamp -
      Date.now();

    if (
      diff <= 0
    ) {
      return "";
    }

    const totalSeconds =
      Math.floor(
        diff / 1000
      );

    const days =
      Math.floor(
        totalSeconds /
        86400
      );

    const hours =
      Math.floor(
        (
          totalSeconds %
          86400
        ) / 3600
      );

    const minutes =
      Math.floor(
        (
          totalSeconds %
          3600
        ) / 60
      );

    const seconds =
      totalSeconds %
      60;

    if (
      days > 0
    ) {

      return (
        days +
        "d " +
        String(hours).padStart(
          2,
          "0"
        ) +
        ":" +
        String(minutes).padStart(
          2,
          "0"
        ) +
        ":" +
        String(seconds).padStart(
          2,
          "0"
        )
      );

    }

    return (
      String(hours).padStart(
        2,
        "0"
      ) +
      ":" +
      String(minutes).padStart(
        2,
        "0"
      ) +
      ":" +
      String(seconds).padStart(
        2,
        "0"
      )
    );

  }


  /* =========================================================
     ESCAPE
  ========================================================= */

  function rbEscape(
    value
  ) {

    return String(
      value || ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  /* =========================================================
     RENDER
  ========================================================= */

  function rbRenderSchedule(
    matches
  ) {

    const container =
      document.querySelector(
        SCHEDULE_SELECTOR
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
        <div class="rbtv-empty">
          Match not found
        </div>
      `;

      return;

    }


    let html =
      "";

    let currentDate =
      "";


    matches.forEach(
      match => {

        const dateKey =
          rbDateKey(
            match.matchDate
          );


        if (
          dateKey !==
          currentDate
        ) {

          currentDate =
            dateKey;

          html += `
            <div class="rbtv-date">
              ${rbEscape(
                dateKey
              )}
            </div>
          `;

        }


        const status =
          rbGetStatus(
            match
          );


        const countdown =
          rbCountdown(
            match.matchDate
          );


        html += `

          <div
            class="rbtv-match"
            data-match-time="${match.matchDate}"
            data-api-status="${match.apiStatus ?? ""}"
          >

            <div class="rbtv-competition">

              ${
                match.competitionLogo
                  ? `
                    <img
                      src="${rbEscape(
                        match.competitionLogo
                      )}"
                      alt=""
                      loading="lazy"
                      onerror="this.style.display='none'"
                    >
                  `
                  : ""
              }

              <span>
                ${rbEscape(
                  match.competition ||
                  "Football"
                )}
              </span>

            </div>


            <div class="rbtv-time">

              ${rbEscape(
                rbFormatTime(
                  match.matchDate
                )
              )}

            </div>


            <div class="rbtv-teams">

              <div class="rbtv-team">

                ${
                  match.homeLogo
                    ? `
                      <img
                        src="${rbEscape(
                          match.homeLogo
                        )}"
                        alt="${rbEscape(
                          match.home
                        )}"
                        loading="eager"
                        decoding="async"
                        referrerpolicy="no-referrer"
                        onerror="
                          console.error(
                            '[RBTV HOME LOGO ERROR]',
                            this.src
                          );
                          this.style.display='none';
                        "
                      >
                    `
                    : ""
                }

                <span>
                  ${rbEscape(
                    match.home
                  )}
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
                        src="${rbEscape(
                          match.awayLogo
                        )}"
                        alt="${rbEscape(
                          match.away
                        )}"
                        loading="eager"
                        decoding="async"
                        referrerpolicy="no-referrer"
                        onerror="
                          console.error(
                            '[RBTV AWAY LOGO ERROR]',
                            this.src
                          );
                          this.style.display='none';
                        "
                      >
                    `
                    : ""
                }

                <span>
                  ${rbEscape(
                    match.away
                  )}
                </span>

              </div>

            </div>


            <div
              class="rbtv-status ${status.type}"
            >
              ${status.label}
            </div>


            ${
              countdown
                ? `
                  <div class="rbtv-countdown">
                    ${countdown}
                  </div>
                `
                : ""
            }

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
     UPDATE COUNTDOWN
     
     PENTING:
     Jangan lagi menentukan LIVE hanya dari waktu.
     Status LIVE harus berasal dari API.
  ========================================================= */

  function rbUpdateCountdowns() {

    const items =
      document.querySelectorAll(
        "#rbtvSchedule .rbtv-match"
      );


    items.forEach(
      item => {

        const timestamp =
          Number(
            item.dataset.matchTime
          );

        if (
          !Number.isFinite(
            timestamp
          )
        ) {
          return;
        }


        const apiStatus =
          Number(
            item.dataset.apiStatus
          );


        const isLive =
          apiStatus === 2;


        const statusElement =
          item.querySelector(
            ".rbtv-status"
          );


        if (
          statusElement
        ) {

          if (isLive) {

            statusElement.classList.remove(
              "upcoming"
            );

            statusElement.classList.add(
              "live"
            );

            statusElement.textContent =
              "LIVE";

          }

          else {

            statusElement.classList.remove(
              "live"
            );

            statusElement.classList.add(
              "upcoming"
            );

            statusElement.textContent =
              "UPCOMING";

          }

        }


        const countdown =
          rbCountdown(
            timestamp
          );


        let countdownElement =
          item.querySelector(
            ".rbtv-countdown"
          );


        if (
          countdown
        ) {

          if (
            !countdownElement
          ) {

            countdownElement =
              document.createElement(
                "div"
              );

            countdownElement.className =
              "rbtv-countdown";

            item.appendChild(
              countdownElement
            );

          }

          countdownElement.textContent =
            countdown;

        }

        else if (
          countdownElement
        ) {

          countdownElement.remove();

        }

      }
    );

  }


  /* =========================================================
     FETCH RBTV API
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
     BUILD ACTIVE MATCHES FROM API
  ========================================================= */

  async function rbLoadMatches() {

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


    const allMatches =
      [];


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


      allMatches.push(
        match
      );

    }


    console.log(
      "%c[RBTV API STATUS FILTER]",
      "color:#ffff00;font-weight:bold"
    );


    const activeMatches =
      allMatches.filter(
        match => {

          const status =
            rbGetStatus(
              match
            );

          console.log(
            "[RBTV MATCH STATUS]",
            match.home +
            " vs " +
            match.away,
            {
              apiStatus:
                match.apiStatus,
              status:
                status.label
            }
          );


          return rbIsActiveMatch(
            match
          );

        }
      );


    activeMatches.sort(
      (
        a,
        b
      ) =>
        a.matchDate -
        b.matchDate
    );


    activeMatches.forEach(
      (
        match,
        index
      ) => {

        match.no =
          index + 1;

      }
    );


    console.log(
      "%c[RBTV FILTER RESULT]",
      "color:#00d979;font-weight:bold",
      {
        total:
          allMatches.length,

        active:
          activeMatches.length,

        removed:
          allMatches.length -
          activeMatches.length
      }
    );


    window.RBTV_MATCHES =
      activeMatches;


    return activeMatches;

  }


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  async function init() {

    const container =
      document.querySelector(
        SCHEDULE_SELECTOR
      );


    if (container) {

      container.innerHTML = `
        <div class="rbtv-loading">
          Loading schedule...
        </div>
      `;

    }


    try {

      const matches =
        await rbLoadMatches();


      rbRenderSchedule(
        matches
      );


      console.log(
        "%c[RBTV] SCHEDULE READY",
        "color:#00d979;font-weight:bold",
        matches.length
      );

    }

    catch (error) {

      console.error(
        "%c[RBTV ERROR]",
        "color:red;font-weight:bold",
        error
      );


      if (container) {

        container.innerHTML = `
          <div class="rbtv-error">
            Failed to load RBTV schedule
          </div>
        `;

      }

    }

  }


  /* =========================================================
     PERIODIC API STATUS CHECK
     
     30 detik:
       UPCOMING -> LIVE
       LIVE -> FINISHED
       
     Match finished akan hilang dari schedule.
  ========================================================= */

  let rbRefreshBusy =
    false;


  async function rbRefreshStatus() {

    if (
      rbRefreshBusy
    ) {
      return;
    }


    rbRefreshBusy =
      true;


    try {

      const matches =
        await rbLoadMatches();


      rbRenderSchedule(
        matches
      );


      console.log(
        "%c[RBTV STATUS REFRESH] UPDATED",
        "color:#00d979;font-weight:bold",
        matches.length
      );

    }

    catch (error) {

      console.warn(
        "%c[RBTV STATUS REFRESH] FAILED - KEEP CURRENT SCHEDULE",
        "color:#ff9900;font-weight:bold",
        error
      );

    }

    finally {

      rbRefreshBusy =
        false;

    }

  }


  /* =========================================================
     START
  ========================================================= */

  function rbStart() {

    const container =
      document.querySelector(
        SCHEDULE_SELECTOR
      );


    if (container) {

      init();

      return;

    }


    let attempts =
      0;


    const timer =
      setInterval(
        () => {

          attempts++;


          const target =
            document.querySelector(
              SCHEDULE_SELECTOR
            );


          if (target) {

            clearInterval(
              timer
            );

            init();

            return;

          }


          if (
            attempts >= 50
          ) {

            clearInterval(
              timer
            );

            console.error(
              "%c[RBTV] #rbtvSchedule TIDAK DITEMUKAN",
              "color:red;font-weight:bold"
            );

          }

        },
        200
      );

  }


  /* =========================================================
     START SCRIPT
  ========================================================= */

  rbStart();


  /* =========================================================
     COUNTDOWN LOOP
  ========================================================= */

  setInterval(
    rbUpdateCountdowns,
    1000
  );


  /* =========================================================
     API STATUS LOOP
  ========================================================= */

  setInterval(
    rbRefreshStatus,
    STATUS_REFRESH_MS
  );


})();
