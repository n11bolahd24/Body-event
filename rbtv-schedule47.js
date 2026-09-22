(function () {
  "use strict";

  console.log(
    "%c[RBTV SCHEDULE 47] START",
    "color:#00d979;font-weight:bold"
  );

  const RBTV_API =
    "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live?sportType=1&language=34&stream=true";

  const SCHEDULE_SELECTOR =
    "#rbtvSchedule";

  const RBTV_STATUS_API =
    "https://apis-data10.tcllu137fien.ru/api/common/bs?code=100&sportType=1&stream=true";

  const RBTV_STATUS_CHECK_MS =
    30000;

  let rbStatusItems = [];
  let rbStatusLoading = false;
  let rbStatusMonitorStarted = false;

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

      if (!keyInfo) break;

      p = keyInfo.next;

      const key =
        Number(keyInfo.value);

      const fieldNo =
        key >>> 3;

      const wireType =
        key & 7;

      if (!fieldNo) break;

      let value = null;

      const start = p;
      let end = p;

      try {
        if (wireType === 0) {
          const v =
            rbReadVarint(buf, p);

          if (!v) break;

          value =
            v.value;

          p =
            v.next;

          end =
            p;
        }

        else if (wireType === 1) {
          if (p + 8 > buf.length) break;

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
            rbReadVarint(buf, p);

          if (!lenInfo) break;

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
          if (p + 4 > buf.length) break;

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
      rbReadFields(buf);

    const directStrings = [];

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
        rbCleanText(text);

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
      const possibleNames = [];

      for (
        const x of directStrings
      ) {
        const clean =
          rbCleanText(
            x.text
          );

        if (!clean) continue;

        if (
          rbLooksLikeUrl(clean)
        ) continue;

        if (
          /^\d+$/.test(clean)
        ) continue;

        if (
          /^\d{4}$/.test(clean)
        ) continue;

        if (
          clean.length < 2 ||
          clean.length > 120
        ) continue;

        if (
          /\svs\s/i.test(clean) ||
          /-vs-/i.test(clean)
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
              /^\d+$/.test(clean)
            ) continue;

            if (
              /^\d{4}$/.test(clean)
            ) continue;

            if (
              clean.length < 2 ||
              clean.length > 100
            ) continue;

            if (
              /\svs\s/i.test(clean) ||
              /-vs-/i.test(clean)
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

  function rbNormalizeName(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ")
      .replace(/\b(fc|cf|sc|ac|afc|women|woman|w|u\d+)\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function rbTeamNameScore(a, b) {
    const x =
      rbNormalizeName(a);

    const y =
      rbNormalizeName(b);

    if (!x || !y) return 0;

    if (x === y) return 100;

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

    if (common >= 2) return 60;

    if (common === 1) return 30;

    return 0;
  }

  function rbExtractStatusItems(
    json
  ) {
    const data =
      json &&
      json.data &&
      typeof json.data === "object"
        ? json.data
        : {};

    const result = [];

    Object.keys(
      data
    ).forEach(
      key => {
        const item =
          data[key];

        if (
          !item ||
          typeof item !== "object"
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
          !Number.isFinite(matchTime) ||
          !Number.isFinite(matchStatus)
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

  async function rbFetchStatusAPI() {
    if (rbStatusLoading) {
      return rbStatusItems;
    }

    rbStatusLoading = true;

    try {
      const response =
        await fetch(
          RBTV_STATUS_API,
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
        "%c[RBTV STATUS API] HTTP:",
        "color:#00d979;font-weight:bold",
        response.status
      );

      if (!response.ok) {
        throw new Error(
          "RBTV STATUS API HTTP " +
          response.status
        );
      }

      const json =
        await response.json();

      rbStatusItems =
        rbExtractStatusItems(
          json
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
      rbStatusLoading = false;
    }
  }

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

  function rbApplyApiStatuses(
    matches
  ) {
    if (
      !Array.isArray(matches)
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

    return {
      type:
        "finished",
      label:
        "FINISHED"
    };
  }

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

    const visibleMatches =
      matches.filter(
        match =>
          rbGetStatus(
            match
          ).type !==
          "finished"
      );

    if (
      !visibleMatches.length
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

    visibleMatches.forEach(
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
      .join("||");
  }

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

  rbStart();

  startRBTVStatusMonitor();

  setInterval(
    rbUpdateCountdowns,
    1000
  );

})();
