/*!
 * RBTV+ Auto Schedule
 * N11BOLAHD
 * CSS + JAVASCRIPT
 * SEARCH MATCH + UPDATE
 */

(function () {

  "use strict";


  /* =========================================================
     START
  ========================================================= */

  console.log(
    "%c[RBTV SCHEDULE 49] START",
    "color:#00d979;font-weight:bold"
  );


  /* =========================================================
     CONFIG
  ========================================================= */

  const RBTV_API =
    "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live?sportType=1&language=34&stream=true";

  const SCHEDULE_SELECTOR =
    "#rbtvSchedule";

  const RBTV_STATUS_API =
    "https://apis-data10.tcllu137fien.ru/api/common/bs?code=100&sportType=1&stream=true";

  const RBTV_STATUS_CHECK_MS =
    30000;


  /* =========================================================
     STATE
  ========================================================= */

  let rbStatusItems = [];

  let rbStatusLoading =
    false;

  let rbStatusMonitorStarted =
    false;

  let rbCurrentSearch =
    "";


  /* =========================================================
     CSS
  ========================================================= */

  function rbInjectCSS() {

    if (
      document.getElementById(
        "rbtvScheduleStyle"
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "rbtvScheduleStyle";

    style.textContent = `

/* =========================================================
   RBTV SCHEDULE
========================================================= */

#rbtvSchedule {
    width: 95%;
    margin: 0 auto;

    font-family: "Courier New", monospace;

    color: #fff;
    background: #111;
}


/* =========================================================
   DATE HEADER
========================================================= */

.rbtv-date {
    position: sticky;
    top: 0;
    z-index: 5;

    padding: 10px;

    background: #181818;
    color: #00d979;

    font-size: 13px;
    font-family: "Courier New", monospace;
    font-weight: bold;

    border-bottom: 1px solid #292929;

    display: flex;
    align-items: center;

    gap: 6px;

    box-sizing: border-box;
}

.rbtv-date-title {
    flex: 1;
    min-width: 0;
}


/* =========================================================
   SEARCH + UPDATE
========================================================= */

.rbtv-date-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    gap: 5px;

    flex-shrink: 0;
}

.rbtv-search-input {
    width: 130px;
    height: 28px;

    padding: 4px 7px;

    box-sizing: border-box;

    border: 1px solid #00d979;
    border-radius: 5px;

    outline: none;

    background: #101010;
    color: #fff;

    font-family: "Courier New", monospace;
    font-size: 8px;

    transition:
        border-color .2s ease,
        background .2s ease,
        box-shadow .2s ease;
}

.rbtv-search-input::placeholder {
    color: #777;
}

.rbtv-search-input:focus {
    border-color: #00d979;

    background: #151515;

    box-shadow:
        0 0 4px rgba(0,217,121,.25);
}


.rbtv-update-btn {
    height: 28px;

    padding: 0 8px;

    box-sizing: border-box;

    border: 1px solid #00d979;
    border-radius: 5px;

    outline: none;

    background: #101010;
    color: #00d979;

    font-family: "Courier New", monospace;
    font-size: 9px;
    font-weight: bold;

    cursor: pointer;

    white-space: nowrap;

    transition:
        background .2s ease,
        border-color .2s ease,
        color .2s ease,
        box-shadow .2s ease;
}

.rbtv-update-btn:hover {
    background: #00d979;
    border-color: #00d979;
    color: #111;

    box-shadow:
        0 0 5px rgba(0,217,121,.25);
}

.rbtv-update-btn:active {
    transform: translateY(1px);
}

.rbtv-update-btn.loading {
    opacity: .65;
    pointer-events: none;
}


/* =========================================================
   MATCH BOX
========================================================= */

.rbtv-match {
    width: 100%;

    margin: 5px 0;
    padding: 10px 10px 12px;

    box-sizing: border-box;

    background: #151515;

    border: 1px solid #242424;
    border-radius: 4px;

    text-align: center;

    transition:
        background .2s ease,
        border-color .2s ease,
        box-shadow .2s ease;
}


/* =========================================================
   MATCH HOVER
========================================================= */

.rbtv-match:hover {
    background: #191919;

    border-color: #00d979;

    box-shadow:
        0 0 6px rgba(0,217,121,.12);
}


/* =========================================================
   COMPETITION
========================================================= */

.rbtv-competition {
    display: flex;
    align-items: center;
    justify-content: center;

    gap: 5px;

    margin-bottom: 5px;

    color: #fff;

    font-family: "Courier New", monospace;
    font-size: 10px;
    font-weight: normal;

    line-height: 1.2;
}

.rbtv-competition img {
    width: 16px;
    height: 16px;

    object-fit: contain;

    flex-shrink: 0;
}


/* =========================================================
   TIME
========================================================= */

.rbtv-time {
    margin-bottom: 7px;

    color: #fff;

    font-family: "Courier New", monospace;
    font-size: 14px;
    font-weight: bold;

    line-height: 1.2;
}


/* =========================================================
   TEAMS
========================================================= */

.rbtv-teams {
    display: grid;

    grid-template-columns:
        minmax(0,1fr)
        auto
        minmax(0,1fr);

    align-items: center;

    width: 100%;
    max-width: 650px;

    margin: 0 auto;

    gap: 8px;
}


/* =========================================================
   TEAM
========================================================= */

.rbtv-team {
    display: flex;

    align-items: center;
    justify-content: center;

    gap: 6px;

    min-width: 0;

    color: #fff;

    /* FONT STANDAR */
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    font-weight: 600;

    line-height: 1.25;

    text-align: center;
}

.rbtv-team img {
    width: 30px;
    height: 30px;

    object-fit: contain;

    flex-shrink: 0;
}

.rbtv-team span {
    min-width: 0;

    overflow-wrap: anywhere;
}


/* =========================================================
   VS
========================================================= */

.rbtv-vs {
    color: #fff;

    font-family: "Courier New", monospace;
    font-size: 12px;
    font-weight: bold;

    white-space: nowrap;
}


/* =========================================================
   STATUS
========================================================= */

.rbtv-status {
    display: inline-block;

    margin-top: 7px;

    padding: 2px 7px;

    font-family: "Courier New", monospace;
    font-size: 9px;
    font-weight: bold;

    line-height: 1.2;

    border-radius: 2px;
}

.rbtv-status.upcoming {
    color: #fff;

    background: #696969;

    border: 1px solid #333;
}

.rbtv-status.live {
    color: #00d979;

    background: rgba(0,217,121,.08);

    border: 1px solid rgba(0,217,121,.30);
}

.rbtv-status.finished {
    color: #666;

    background: #181818;

    border: 1px solid #222;
}


/* =========================================================
   COUNTDOWN
========================================================= */

.rbtv-countdown {
    margin-top: 5px;

    color: #00d979;

    font-family: "Courier New", monospace;
    font-size: 15px;

    line-height: 1.2;
}


/* =========================================================
   LOADING / EMPTY / ERROR
========================================================= */

.rbtv-loading,
.rbtv-empty,
.rbtv-search-empty,
.rbtv-error {
    padding: 15px 10px;

    color: #888;

    font-family: "Courier New", monospace;
    font-size: 10px;

    text-align: center;
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 600px) {

    #rbtvSchedule {
        width: 95%;
    }

    .rbtv-date {
        padding: 8px;

        font-size: 12px;

        flex-wrap: wrap;
    }

    .rbtv-date-title {
        width: 100%;

        flex: 1 1 100%;
    }

    .rbtv-date-actions {
        width: 100%;

        justify-content: flex-end;
    }

    .rbtv-search-input {
        flex: 1;

        width: auto;

        min-width: 0;
    }

    .rbtv-update-btn {
        flex-shrink: 0;
    }

    .rbtv-match {
        margin: 4px 0;

        padding: 9px 5px 11px;
    }

    .rbtv-team {
        font-family: Arial, Helvetica, sans-serif;

        font-size: 11px;
    }

    .rbtv-team img {
        width: 27px;
        height: 27px;
    }

    .rbtv-vs {
        font-size: 12px;
    }
}


/* =========================================================
   SMALL MOBILE
========================================================= */

@media (max-width: 380px) {

    #rbtvSchedule {
        width: 98%;
    }

    .rbtv-team {
        font-size: 10px;
    }

    .rbtv-team img {
        width: 24px;
        height: 24px;
    }

    .rbtv-teams {
        gap: 5px;
    }
}
`;

    (
      document.head ||
      document.documentElement
    ).appendChild(
      style
    );

    console.log(
      "%c[RBTV CSS] INJECTED",
      "color:#00d979;font-weight:bold"
    );
  }


  /* =========================================================
     INJECT CSS
  ========================================================= */

  rbInjectCSS();


  /* =========================================================
     VARINT
  ========================================================= */

  function rbReadVarint(
    buf,
    pos
  ) {

    let value = 0n;
    let shift = 0n;

    while (
      pos < buf.length
    ) {

      const b =
        buf[pos++];

      value |=
        BigInt(
          b & 0x7F
        ) << shift;

      if (
        !(b & 0x80)
      ) {

        return {
          value,
          next: pos
        };

      }

      shift += 7n;

      if (
        shift > 70n
      ) {
        break;
      }

    }

    return null;
  }


  /* =========================================================
     READ FIELDS
  ========================================================= */

  function rbReadFields(
    buf
  ) {

    const fields = [];

    let p = 0;

    while (
      p < buf.length
    ) {

      const keyInfo =
        rbReadVarint(
          buf,
          p
        );

      if (!keyInfo) {
        break;
      }

      p =
        keyInfo.next;

      const key =
        Number(
          keyInfo.value
        );

      const fieldNo =
        key >>> 3;

      const wireType =
        key & 7;

      if (!fieldNo) {
        break;
      }

      let value = null;

      const start = p;

      let end = p;

      try {

        if (
          wireType === 0
        ) {

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

        else if (
          wireType === 1
        ) {

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

        else if (
          wireType === 2
        ) {

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
            !Number.isFinite(
              len
            ) ||
            len < 0 ||
            p + len >
              buf.length
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

        else if (
          wireType === 5
        ) {

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


  /* =========================================================
     BYTES TO STRING
  ========================================================= */

  function rbBytesToString(
    bytes
  ) {

    try {

      return new TextDecoder(
        "utf-8",
        {
          fatal: false
        }
      ).decode(
        bytes
      );

    }

    catch (e) {

      return "";

    }

  }


  /* =========================================================
     CLEAN TEXT
  ========================================================= */

  function rbCleanText(
    str
  ) {

    if (
      typeof str !==
      "string"
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
     URL
  ========================================================= */

  function rbLooksLikeUrl(
    str
  ) {

    return (
      typeof str ===
      "string" &&
      /^https?:\/\//i.test(
        str
      )
    );

  }


  /* =========================================================
     TEAM LOGO
  ========================================================= */

  function rbIsTeamLogo(
    str
  ) {

    if (
      !rbLooksLikeUrl(
        str
      )
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


  /* =========================================================
     COMPETITION LOGO
  ========================================================= */

  function rbIsCompetitionLogo(
    str
  ) {

    return (
      rbLooksLikeUrl(
        str
      ) &&
      (
        /\/football\/competition\//i.test(str) ||
        /\/football\/competitions\//i.test(str) ||
        /competition.*logo/i.test(str) ||
        /logo.*competition/i.test(str)
      )
    );

  }


  /* =========================================================
     COLLECT STRINGS
  ========================================================= */

  function rbCollectStrings(
    buf,
    depth = 0,
    result = []
  ) {

    if (
      !buf ||
      depth > 10
    ) {

      return result;

    }

    const fields =
      rbReadFields(
        buf
      );

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
          str.trim();

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
     COLLECT LOGOS
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
      rbReadFields(
        buf
      );

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
        rbLooksLikeUrl(
          str
        ) &&
        rbIsTeamLogo(
          str
        )
      ) {

        if (
          !result.includes(
            str
          )
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
     FIND TEAM OBJECTS
  ========================================================= */

  function rbFindTeamObjects(
    buf,
    depth = 0,
    result = []
  ) {

    if (
      !buf ||
      depth > 10
    ) {

      return result;

    }

    const fields =
      rbReadFields(
        buf
      );

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

        if (!clean) continue;

        if (
          rbLooksLikeUrl(
            clean
          )
        ) continue;

        if (
          /^\d+$/.test(
            clean
          )
        ) continue;

        if (
          /^\d{4}$/.test(
            clean
          )
        ) continue;

        if (
          clean.length < 2 ||
          clean.length > 120
        ) continue;

        if (
          /\svs\s/i.test(
            clean
          ) ||
          /-vs-/i.test(
            clean
          )
        ) continue;

        if (
          clean === "SuccessR" ||
          clean === "def"
        ) continue;

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
     FIND COMPETITION
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
        depth > 10 ||
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

          const s =
            rbBytesToString(
              nf.value
            );

          if (!s) {
            continue;
          }

          localStrings.push({
            field:
              nf.fieldNo,
            text:
              s.trim()
          });

          if (
            rbIsCompetitionLogo(
              s.trim()
            )
          ) {

            localLogo =
              s.trim();

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

            if (!clean) continue;

            if (
              rbLooksLikeUrl(
                clean
              )
            ) continue;

            if (
              /^\d+$/.test(
                clean
              )
            ) continue;

            if (
              /^\d{4}$/.test(
                clean
              )
            ) continue;

            if (
              clean.length < 2 ||
              clean.length > 100
            ) continue;

            if (
              /\svs\s/i.test(
                clean
              ) ||
              /-vs-/i.test(
                clean
              )
            ) continue;

            if (
              clean === "SuccessR" ||
              clean === "def"
            ) continue;

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

      if (!s) continue;

      if (
        /\svs\s/i.test(
          s
        )
      ) {

        if (
          s.length >
            title.length &&
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
        /^[a-z0-9-]+-vs-[a-z0-9-]+$/i.test(
          s
        )
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
          Number.isFinite(
            n
          ) &&
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

    const competitionData =
      rbFindCompetition(
        recordBytes
      );

    return {

      matchDate,

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

      recordLength,

      apiStatus:
        null,

      apiStatusObject:
        null

    };
  }


  /* =========================================================
     FIND RECORDS
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
        !Number.isFinite(
          len
        ) ||
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
     DATE KEY
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


  /* =========================================================
     FORMAT TIME
  ========================================================= */

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
     NORMALIZE NAME
  ========================================================= */

  function rbNormalizeName(
    value
  ) {

    return String(
      value || ""
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .replace(
        /\([^)]*\)/g,
        " "
      )
      .replace(
        /\b(fc|cf|sc|ac|afc|women|woman|w|u\d+)\b/g,
        " "
      )
      .replace(
        /[^a-z0-9]+/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }


  /* =========================================================
     TEAM SCORE
  ========================================================= */

  function rbTeamNameScore(
    a,
    b
  ) {

    const x =
      rbNormalizeName(
        a
      );

    const y =
      rbNormalizeName(
        b
      );

    if (
      !x ||
      !y
    ) {
      return 0;
    }

    if (
      x === y
    ) {
      return 100;
    }

    if (
      x.includes(y) ||
      y.includes(x)
    ) {
      return 80;
    }

    const xt =
      new Set(
        x.split(" ")
      );

    const yt =
      new Set(
        y.split(" ")
      );

    let common = 0;

    xt.forEach(
      token => {

        if (
          token.length >= 3 &&
          yt.has(token)
        ) {

          common++;

        }

      }
    );

    if (
      common >= 2
    ) {
      return 60;
    }

    if (
      common === 1
    ) {
      return 30;
    }

    return 0;
  }


  /* =========================================================
     EXTRACT STATUS
  ========================================================= */

  function rbExtractStatusItems(
    json
  ) {

    const data =
      json &&
      json.data &&
      typeof json.data ===
        "object"
        ? json.data
        : {};

    const result =
      [];

    Object.keys(
      data
    ).forEach(
      key => {

        const item =
          data[key];

        if (
          !item ||
          typeof item !==
            "object"
        ) {
          return;
        }

        const home =
          item.homeTeamName ||
          item.home_team?.name ||
          item.home?.name ||
          item.raw?.home_team?.name ||
          "";

        const away =
          item.awayTeamName ||
          item.away_team?.name ||
          item.away?.name ||
          item.raw?.away_team?.name ||
          "";

        const matchTime =
          Number(
            item.matchTime ??
            item.match_time ??
            item.raw?.match_time
          );

        const matchStatus =
          Number(
            item.matchStatus ??
            item.status_id ??
            item.raw?.status_id
          );

        if (
          !home ||
          !away ||
          !Number.isFinite(
            matchTime
          ) ||
          !Number.isFinite(
            matchStatus
          )
        ) {

          return;

        }

        result.push({

          key,

          matchId:
            item.matchId ||
            item.match_id ||
            "",

          home,

          away,

          matchTime,

          matchStatus,

          matchStatusText:
            String(
              item.match_status ||
              item.status_name ||
              ""
            ).toLowerCase(),

          raw:
            item

        });

      }
    );

    return result;
  }


  /* =========================================================
     FETCH STATUS
  ========================================================= */

    /* =========================================================
     FETCH STATUS - PROTOBUF + JSON
  ========================================================= */

  async function rbFetchStatusAPI() {

    if (
      rbStatusLoading
    ) {

      return rbStatusItems;

    }

    rbStatusLoading =
      true;

    try {

      const response =
        await fetch(
          RBTV_STATUS_API,
          {
            method:
              "GET",

            headers: {
              "Accept":
                "application/json, application/octet-stream, application/x-protobuf"
            },

            cache:
              "no-store"
          }
        );


      console.log(
        "%c[RBTV STATUS API] HTTP:",
        "color:#00d979;font-weight:bold",
        response.status
      );


      if (
        !response.ok
      ) {

        throw new Error(
          "RBTV STATUS API HTTP " +
          response.status
        );

      }


      /*
       * Endpoint ini bisa mengembalikan
       * protobuf, bukan JSON.
       *
       * Jadi kita baca sebagai bytes terlebih dahulu.
       */

      const buffer =
        new Uint8Array(
          await response.arrayBuffer()
        );


      console.log(
        "%c[RBTV STATUS API] BYTES:",
        "color:#00d979;font-weight:bold",
        buffer.length
      );


      /*
       * Coba JSON terlebih dahulu.
       * Kalau bukan JSON, lanjut protobuf.
       */

      let json = null;


      try {

        const text =
          new TextDecoder(
            "utf-8",
            {
              fatal: false
            }
          ).decode(
            buffer
          ).trim();


        if (
          text.startsWith("{") ||
          text.startsWith("[")
        ) {

          json =
            JSON.parse(
              text
            );

        }

      }

      catch (e) {

        json =
          null;

      }


      /*
       * MODE JSON
       */

      if (json) {

        rbStatusItems =
          rbExtractStatusItems(
            json
          );


        console.log(
          "%c[RBTV STATUS API] MODE: JSON",
          "color:#00d979;font-weight:bold"
        );


        console.log(
          "%c[RBTV STATUS API] MATCHES:",
          "color:#00d979;font-weight:bold",
          rbStatusItems.length
        );


        return rbStatusItems;

      }


      /*
       * MODE PROTOBUF
       */

      rbStatusItems =
        rbDecodeStatusProtobuf(
          buffer
        );


      console.log(
        "%c[RBTV STATUS API] MODE: PROTOBUF",
        "color:#00d979;font-weight:bold"
      );


      console.log(
        "%c[RBTV STATUS API] MATCHES:",
        "color:#00d979;font-weight:bold",
        rbStatusItems.length
      );


      return rbStatusItems;

    }

    catch (error) {

      console.warn(
        "%c[RBTV STATUS API] GAGAL:",
        "color:#ff6600;font-weight:bold",
        error
      );


      return rbStatusItems;

    }

    finally {

      rbStatusLoading =
        false;

    }

  }


  /* =========================================================
     STATUS PROTOBUF DECODER
  ========================================================= */

  function rbDecodeStatusProtobuf(
    buffer
  ) {

    const result =
      [];


    /*
     * Cari semua kemungkinan message protobuf
     * di dalam response.
     */

    function walk(
      bytes,
      depth = 0
    ) {

      if (
        !bytes ||
        !bytes.length ||
        depth > 12
      ) {

        return;

      }


      const fields =
        rbReadFields(
          bytes
        );


      if (
        !fields.length
      ) {

        return;

      }


      const strings =
        [];


      const numbers =
        [];


      fields.forEach(
        field => {

          if (
            field.wireType === 0
          ) {

            const n =
              Number(
                field.value
              );


            if (
              Number.isFinite(
                n
              )
            ) {

              numbers.push({
                field:
                  field.fieldNo,

                value:
                  n
              });

            }

          }


          else if (
            field.wireType === 2
          ) {

            const text =
              rbBytesToString(
                field.value
              ).trim();


            if (
              text &&
              !text.includes(
                "\u0000"
              )
            ) {

              strings.push({
                field:
                  field.fieldNo,

                text
              });

            }

          }

        }
      );


      /*
       * Ambil nama-nama yang terlihat seperti
       * nama tim.
       */

      const teamStrings =
        strings
          .map(
            x =>
              rbCleanText(
                x.text
              )
          )
          .filter(
            x =>
              x &&
              x.length >= 2 &&
              x.length <= 120 &&
              !rbLooksLikeUrl(x) &&
              !/^\d+$/.test(x) &&
              !/SuccessR/i.test(x) &&
              !/^def$/i.test(x) &&
              !/-vs-/i.test(x) &&
              !/\svs\s/i.test(x)
          );


      /*
       * Cari timestamp yang masuk akal.
       *
       * matchTime pada endpoint ini biasanya
       * berupa Unix timestamp dalam detik.
       */

      const timestamps =
        numbers
          .map(
            x => {

              const n =
                x.value;


              if (
                n > 1000000000 &&
                n < 3000000000
              ) {

                return n;

              }


              if (
                n > 1000000000000 &&
                n < 3000000000000
              ) {

                return n / 1000;

              }


              return null;

            }
          )
          .filter(
            Number.isFinite
          );


      /*
       * Status umum yang kita perlukan:
       *
       * 1 = UPCOMING
       * 2 = LIVE
       *
       * Jangan mengambil angka lain sebagai status
       * kecuali memang 1 atau 2.
       */

      const statusCandidates =
        numbers
          .filter(
            x =>
              x.value === 1 ||
              x.value === 2
          )
          .map(
            x =>
              x.value
          );


      /*
       * Kalau message memiliki minimal:
       * - 2 string
       * - timestamp
       * - status 1/2
       *
       * simpan sebagai kandidat.
       */

      if (
        teamStrings.length >= 2 &&
        timestamps.length &&
        statusCandidates.length
      ) {

        const uniqueStrings =
          [];


        teamStrings.forEach(
          name => {

            if (
              !uniqueStrings.includes(
                name
              )
            ) {

              uniqueStrings.push(
                name
              );

            }

          }
        );


        /*
         * Buat pasangan kemungkinan home/away.
         */

        for (
          let i = 0;
          i < uniqueStrings.length;
          i++
        ) {

          for (
            let j = i + 1;
            j < uniqueStrings.length;
            j++
          ) {

            const home =
              uniqueStrings[i];

            const away =
              uniqueStrings[j];


            if (
              !home ||
              !away ||
              home === away
            ) {

              continue;

            }


            const matchTime =
              timestamps[0];


            const matchStatus =
              statusCandidates[
                0
              ];


            result.push({

              key:
                "protobuf-" +
                result.length,

              matchId:
                "",

              home,

              away,

              matchTime,

              matchStatus,

              matchStatusText:
                matchStatus === 2
                  ? "live"
                  : "scheduled",

              raw:
                {
                  protobuf:
                    true
                }

            });

          }

        }

      }


      /*
       * Terus turun ke nested protobuf.
       */

      fields.forEach(
        field => {

          if (
            field.wireType !== 2
          ) {

            return;

          }


          walk(
            field.value,
            depth + 1
          );

        }
      );

    }


    walk(
      buffer,
      0
    );


    /*
     * Hilangkan duplikat.
     */

    const unique =
      [];


    result.forEach(
      item => {

        const exists =
          unique.some(
            x =>
              rbNormalizeName(
                x.home
              ) ===
              rbNormalizeName(
                item.home
              ) &&

              rbNormalizeName(
                x.away
              ) ===
              rbNormalizeName(
                item.away
              ) &&

              Math.abs(
                Number(
                  x.matchTime
                ) -
                Number(
                  item.matchTime
                )
              ) < 10
          );


        if (!exists) {

          unique.push(
            item
          );

        }

      }
    );


    console.log(
      "%c[RBTV STATUS PROTOBUF] CANDIDATES:",
      "color:#00d979;font-weight:bold",
      unique.length
    );


    return unique;

  }
  /* =========================================================
     FIND API STATUS
  ========================================================= */

  function rbFindApiStatus(
    match
  ) {

    if (
      !rbStatusItems.length ||
      !match
    ) {

      return null;

    }

    const targetTime =
      Number(
        match.matchDate
      ) / 1000;

    if (
      !Number.isFinite(
        targetTime
      )
    ) {

      return null;

    }

    let best = null;

    let bestScore = 0;

    for (
      const item of rbStatusItems
    ) {

      const timeDiff =
        Math.abs(
          Number(
            item.matchTime
          ) -
          targetTime
        );

      if (
        !Number.isFinite(
          timeDiff
        ) ||
        timeDiff > 300
      ) {

        continue;

      }

      const homeScore =
        rbTeamNameScore(
          match.home,
          item.home
        );

      const awayScore =
        rbTeamNameScore(
          match.away,
          item.away
        );

      if (
        !homeScore ||
        !awayScore
      ) {

        continue;

      }

      const timeScore =
        Math.max(
          0,
          30 -
          Math.min(
            30,
            timeDiff / 10
          )
        );

      const totalScore =
        homeScore +
        awayScore +
        timeScore;

      if (
        totalScore >
        bestScore
      ) {

        bestScore =
          totalScore;

        best =
          item;

      }

    }

    return (
      best &&
      bestScore >= 90
    )
      ? best
      : null;
  }


  /* =========================================================
     APPLY STATUS
  ========================================================= */

  function rbApplyApiStatuses(
    matches
  ) {

    if (
      !Array.isArray(
        matches
      )
    ) {

      return;

    }

    matches.forEach(
      match => {

        const apiStatus =
          rbFindApiStatus(
            match
          );

        match.apiStatusObject =
          apiStatus;

        match.apiStatus =
          apiStatus
            ? apiStatus.matchStatus
            : null;

        if (apiStatus) {

          console.log(
            "%c[RBTV API STATUS] " +
            match.home +
            " vs " +
            match.away,

            "color:#00d9ff;font-weight:bold",

            apiStatus.raw
          );

        }

      }
    );
  }


   /* =========================================================
     GET STATUS
  ========================================================= */

  function rbGetStatus(
    match
  ) {

    const matchDate =
      Number(
        match?.matchDate
      );


    const apiStatus =
      Number(
        match?.apiStatus
      );


    const apiText =
      String(
        match?.apiStatusObject
          ?.matchStatusText ||
        ""
      ).toLowerCase();


    /*
     * API STATUS 2
     * = LIVE
     */

    if (
      apiStatus === 2 ||
      apiText === "live" ||
      apiText === "in_play" ||
      apiText === "playing"
    ) {

      return {

        type:
          "live",

        label:
          "LIVE"

      };

    }


    /*
     * API STATUS 1
     * = UPCOMING
     */

    if (
      apiStatus === 1 ||
      apiText === "scheduled" ||
      apiText === "upcoming" ||
      apiText === "not_started"
    ) {

      return {

        type:
          "upcoming",

        label:
          "UPCOMING"

      };

    }


    /*
     * Kalau waktu pertandingan belum lewat,
     * tetap UPCOMING meskipun API status belum
     * berhasil terbaca.
     */

    if (
      Number.isFinite(
        matchDate
      ) &&
      matchDate >
        Date.now()
    ) {

      return {

        type:
          "upcoming",

        label:
          "UPCOMING"

      };

    }


    /*
     * Kalau sudah lewat dan API tidak mengatakan LIVE,
     * anggap FINISHED.
     */

    return {

      type:
        "finished",

      label:
        "FINISHED"

    };

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
        String(
          hours
        ).padStart(
          2,
          "0"
        ) +
        ":" +
        String(
          minutes
        ).padStart(
          2,
          "0"
        ) +
        ":" +
        String(
          seconds
        ).padStart(
          2,
          "0"
        )
      );

    }

    return (
      String(
        hours
      ).padStart(
        2,
        "0"
      ) +
      ":" +
      String(
        minutes
      ).padStart(
        2,
        "0"
      ) +
      ":" +
      String(
        seconds
      ).padStart(
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
     SEARCH
  ========================================================= */

  function rbSearchMatches(
    matches,
    keyword
  ) {

    const q =
      String(
        keyword || ""
      )
      .trim()
      .toLowerCase();

    if (!q) {

      return matches;

    }

    return matches.filter(
      match => {

        const text =
          [
            match.home,
            match.away,
            match.competition,
            match.slug
          ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(
          q
        );

      }
    );
  }


  /* =========================================================
     RENDER DATE HEADER
  ========================================================= */

  function rbDateHeader(
    dateKey
  ) {

    return `
      <div class="rbtv-date">

        <div class="rbtv-date-title">
          ${rbEscape(
            dateKey
          )}
        </div>

        <div class="rbtv-date-actions">

          <input
            type="search"
            class="rbtv-search-input"
            placeholder="Search match..."
            value="${rbEscape(
              rbCurrentSearch
            )}"
            autocomplete="off"
            spellcheck="false"
          >

          <button
            type="button"
            class="rbtv-update-btn"
          >
            ↻ UPDATE
          </button>

        </div>

      </div>
    `;
  }


  /* =========================================================
     RENDER SCHEDULE
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
        <div class="rbtv-date">

          <div class="rbtv-date-title">
            RBTV SCHEDULE
          </div>

          <div class="rbtv-date-actions">

            <input
              type="search"
              class="rbtv-search-input"
              placeholder="Search match..."
              value="${rbEscape(
                rbCurrentSearch
              )}"
              autocomplete="off"
              spellcheck="false"
            >

            <button
              type="button"
              class="rbtv-update-btn"
            >
              ↻ UPDATE
            </button>

          </div>

        </div>

        <div class="rbtv-empty">
          Match not found
        </div>
      `;

      rbBindControls();

      return;
    }


    const visibleMatches =
      matches.filter(
        match =>
          rbGetStatus(
            match
          ).type !==
          "finished"
      );


    const filteredMatches =
      rbSearchMatches(
        visibleMatches,
        rbCurrentSearch
      );


    if (
      !filteredMatches.length
    ) {

      container.innerHTML = `

        <div class="rbtv-date">

          <div class="rbtv-date-title">
            RBTV SCHEDULE
          </div>

          <div class="rbtv-date-actions">

            <input
              type="search"
              class="rbtv-search-input"
              placeholder="Search match..."
              value="${rbEscape(
                rbCurrentSearch
              )}"
              autocomplete="off"
              spellcheck="false"
            >

            <button
              type="button"
              class="rbtv-update-btn"
            >
              ↻ UPDATE
            </button>

          </div>

        </div>

        <div class="rbtv-search-empty">
          Match not found
        </div>

      `;

      rbBindControls();

      return;
    }


    let html =
      "";

    let currentDate =
      "";


    filteredMatches.forEach(
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

          html +=
            rbDateHeader(
              dateKey
            );

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
                      onerror="
                        this.style.display='none'
                      "
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


    rbBindControls();


    console.log(
      "%c[RBTV] SCHEDULE RENDERED:",
      "color:#00d979;font-weight:bold",
      filteredMatches.length
    );

  }


  /* =========================================================
     BIND SEARCH + UPDATE
  ========================================================= */

  function rbBindControls() {

    const container =
      document.querySelector(
        SCHEDULE_SELECTOR
      );

    if (!container) {
      return;
    }


    const searchInputs =
      container.querySelectorAll(
        ".rbtv-search-input"
      );


    searchInputs.forEach(
      input => {

        input.oninput =
          function () {

            rbCurrentSearch =
              this.value || "";


            const allMatches =
              window.RBTV_ALL_MATCHES ||
              [];


            rbRenderSchedule(
              allMatches
            );


            const newInput =
              container.querySelector(
                ".rbtv-search-input"
              );


            if (newInput) {

              newInput.focus();

              try {

                newInput.setSelectionRange(
                  rbCurrentSearch.length,
                  rbCurrentSearch.length
                );

              }

              catch (e) {}

            }

          };


        input.onkeydown =
          function (event) {

            if (
              event.key ===
              "Escape"
            ) {

              rbCurrentSearch =
                "";

              rbRenderSchedule(
                window.RBTV_ALL_MATCHES ||
                []
              );

            }

          };

      }
    );


    const updateButtons =
      container.querySelectorAll(
        ".rbtv-update-btn"
      );


    updateButtons.forEach(
      button => {

        button.onclick =
          async function () {

            await rbManualUpdate(
              this
            );

          };

      }
    );

  }


  /* =========================================================
     MANUAL UPDATE
  ========================================================= */

  async function rbManualUpdate(
    button
  ) {

    if (
      rbStatusLoading
    ) {
      return;
    }


    console.log(
      "%c[RBTV] MANUAL UPDATE",
      "color:#00d979;font-weight:bold"
    );


    if (button) {

      button.classList.add(
        "loading"
      );

      button.textContent =
        "↻ LOADING";

    }


    rbCurrentSearch =
      "";


    const container =
      document.querySelector(
        SCHEDULE_SELECTOR
      );


    if (container) {

      container.innerHTML = `
        <div class="rbtv-loading">
          Updating schedule...
        </div>
      `;

    }


    try {

      await rbLoadSchedule();

    }

    catch (error) {

      console.error(
        "%c[RBTV UPDATE ERROR]",
        "color:red;font-weight:bold",
        error
      );

      if (container) {

        container.innerHTML = `
          <div class="rbtv-error">
            Failed to update RBTV schedule
          </div>
        `;

      }

    }

  }


  /* =========================================================
     UPDATE COUNTDOWNS
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


        const countdown =
          rbCountdown(
            timestamp
          );


        let countdownElement =
          item.querySelector(
            ".rbtv-countdown"
          );


        if (countdown) {

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
     STATUS SIGNATURE
  ========================================================= */

  function rbStatusSignature(
    matches
  ) {

    return matches
      .map(
        match => {

          const status =
            rbGetStatus(
              match
            ).type;

          return (
            String(
              match.home
            ) +
            "|" +
            String(
              match.away
            ) +
            "|" +
            status
          );

        }
      )
      .sort()
      .join(
        "||"
      );

  }


  /* =========================================================
     STATUS MONITOR
  ========================================================= */

  function startRBTVStatusMonitor() {

    if (
      rbStatusMonitorStarted
    ) {

      return;

    }


    rbStatusMonitorStarted =
      true;


    setInterval(
      async () => {

        if (
          rbStatusLoading
        ) {

          return;

        }


        try {

          const allMatches =
            window.RBTV_ALL_MATCHES ||
            window.RBTV_MATCHES ||
            [];


          const before =
            rbStatusSignature(
              allMatches
            );


          await rbFetchStatusAPI();


          rbApplyApiStatuses(
            allMatches
          );


          const after =
            rbStatusSignature(
              allMatches
            );


          if (
            before !==
            after
          ) {

            console.log(
              "%c[RBTV STATUS] STATUS BERUBAH - RENDER ULANG",
              "color:#00d979;font-weight:bold"
            );


            rbRenderSchedule(
              allMatches
            );


            window.RBTV_MATCHES =
              allMatches.filter(
                match =>
                  rbGetStatus(
                    match
                  ).type !==
                  "finished"
              );

          }

        }

        catch (error) {

          console.warn(
            "%c[RBTV STATUS] AUTO CHECK GAGAL:",
            "color:#ff6600;font-weight:bold",
            error
          );

        }

      },

      RBTV_STATUS_CHECK_MS
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
              "application/json"
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


    if (
      !response.ok
    ) {

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
     LOAD SCHEDULE
  ========================================================= */

  async function rbLoadSchedule() {

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


    window.RBTV_STATUS_DEBUG =
      [];


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


    await rbFetchStatusAPI();


    const matches =
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


      matches.push(
        match
      );

    }


    rbApplyApiStatuses(
      matches
    );


    matches.sort(
      (
        a,
        b
      ) =>
        a.matchDate -
        b.matchDate
    );


    matches.forEach(
      (
        match,
        index
      ) => {

        match.no =
          index + 1;

      }
    );


    window.RBTV_ALL_MATCHES =
      matches;


    window.RBTV_MATCHES =
      matches.filter(
        match =>
          rbGetStatus(
            match
          ).type !==
          "finished"
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


    rbRenderSchedule(
      matches
    );


    console.log(
      "%c[RBTV] SCHEDULE RENDERED TO #rbtvSchedule",
      "color:#00d979;font-weight:bold"
    );

  }


  /* =========================================================
     INIT
  ========================================================= */

  async function init() {

    try {

      await rbLoadSchedule();

    }

    catch (error) {

      console.error(
        "%c[RBTV ERROR]",
        "color:red;font-weight:bold",
        error
      );


      const container =
        document.querySelector(
          SCHEDULE_SELECTOR
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
     RUN
  ========================================================= */

  rbStart();


  startRBTVStatusMonitor();


  setInterval(
    rbUpdateCountdowns,
    1000
  );


})();
