/*!
 * RBTV SCHEDULE 10
 * N11BOLAHD
 * Strict protobuf match-record analyzer
 */

(function () {
  "use strict";

  const API =
    "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live?sportType=1&language=34&stream=true";

  const decoder = new TextDecoder("utf-8");

  function readVarint(bytes, pos) {
    let value = 0;
    let shift = 0;
    let p = pos;

    while (p < bytes.length) {
      const b = bytes[p++];

      value += (b & 0x7f) * Math.pow(2, shift);

      if ((b & 0x80) === 0) {
        return {
          value,
          next: p
        };
      }

      shift += 7;

      if (shift > 63) return null;
    }

    return null;
  }

  function readField(bytes, pos, end) {
    const keyInfo = readVarint(bytes, pos);

    if (!keyInfo) return null;

    const key = keyInfo.value;

    const field =
      Math.floor(key / 8);

    const wire =
      key % 8;

    if (field <= 0 || field > 1000) {
      return null;
    }

    let p = keyInfo.next;

    const result = {
      field,
      wire,
      key,
      start: pos
    };

    // VARINT
    if (wire === 0) {
      const v = readVarint(bytes, p);

      if (!v || v.next > end) {
        return null;
      }

      result.value = v.value;
      result.end = v.next;

      return result;
    }

    // FIXED64
    if (wire === 1) {
      if (p + 8 > end) return null;

      result.dataStart = p;
      result.dataEnd = p + 8;
      result.end = p + 8;

      return result;
    }

    // LENGTH DELIMITED
    if (wire === 2) {
      const lenInfo =
        readVarint(bytes, p);

      if (!lenInfo) return null;

      const dataStart =
        lenInfo.next;

      const dataEnd =
        dataStart + lenInfo.value;

      if (dataEnd > end) {
        return null;
      }

      result.length =
        lenInfo.value;

      result.dataStart =
        dataStart;

      result.dataEnd =
        dataEnd;

      result.end =
        dataEnd;

      return result;
    }

    // FIXED32
    if (wire === 5) {
      if (p + 4 > end) return null;

      result.dataStart = p;
      result.dataEnd = p + 4;
      result.end = p + 4;

      return result;
    }

    return null;
  }

  function parseMessage(bytes, start, end) {
    const fields = [];

    let pos = start;

    while (pos < end) {
      const f =
        readField(
          bytes,
          pos,
          end
        );

      if (!f) break;

      fields.push(f);

      pos = f.end;
    }

    return fields;
  }

  function textOf(bytes, field) {
    if (
      !field ||
      field.wire !== 2 ||
      field.dataStart == null
    ) {
      return "";
    }

    try {
      return decoder
        .decode(
          bytes.slice(
            field.dataStart,
            field.dataEnd
          )
        );
    } catch (e) {
      return "";
    }
  }

  function cleanText(text) {
    if (!text) return "";

    return text
      .replace(/^[\x00-\x20]+/, "")
      .trim();
  }

  function looksLikeUrl(text) {
    return /^https?:\/\//i.test(
      text.trim()
    );
  }

  function looksLikeSlug(text) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(
      text.trim()
    );
  }

  function isTimestamp(value) {
    return (
      typeof value === "number" &&
      value >= 1500000000000 &&
      value <= 3000000000000
    );
  }

  function findNestedText(
    bytes,
    start,
    end,
    predicate,
    depth = 0
  ) {
    if (depth > 8) return null;

    const fields =
      parseMessage(
        bytes,
        start,
        end
      );

    for (const f of fields) {

      if (f.wire === 2) {

        const text =
          cleanText(
            textOf(
              bytes,
              f
            )
          );

        if (
          text &&
          predicate(text)
        ) {
          return {
            text,
            field: f,
            depth
          };
        }

        const nested =
          findNestedText(
            bytes,
            f.dataStart,
            f.dataEnd,
            predicate,
            depth + 1
          );

        if (nested) {
          return nested;
        }
      }
    }

    return null;
  }

  function findAllNestedUrls(
    bytes,
    start,
    end,
    result = [],
    depth = 0
  ) {
    if (depth > 8) return result;

    const fields =
      parseMessage(
        bytes,
        start,
        end
      );

    for (const f of fields) {

      if (f.wire !== 2) continue;

      const text =
        cleanText(
          textOf(
            bytes,
            f
          )
        );

      if (
        looksLikeUrl(text)
      ) {
        result.push(text);
      }

      findAllNestedUrls(
        bytes,
        f.dataStart,
        f.dataEnd,
        result,
        depth + 1
      );
    }

    return result;
  }

  function findMatchTitle(
    bytes,
    start,
    end
  ) {
    const found =
      findNestedText(
        bytes,
        start,
        end,
        text =>
          text.includes(" vs ")
      );

    return found
      ? found.text
      : "";
  }

  function findSlug(
    bytes,
    start,
    end
  ) {
    const found =
      findNestedText(
        bytes,
        start,
        end,
        text =>
          text.includes("-vs-") &&
          looksLikeSlug(text)
      );

    return found
      ? found.text
      : "";
  }

  function findCompetition(
    bytes,
    start,
    end
  ) {
    const fields =
      parseMessage(
        bytes,
        start,
        end
      );

    const strings = [];

    function walk(a, b, depth) {

      if (depth > 7) return;

      const fs =
        parseMessage(
          bytes,
          a,
          b
        );

      for (const f of fs) {

        if (f.wire !== 2) continue;

        const text =
          cleanText(
            textOf(
              bytes,
              f
            )
          );

        if (
          text &&
          !looksLikeUrl(text) &&
          !text.includes(" vs ") &&
          !text.includes("-vs-") &&
          text.length >= 3 &&
          text.length <= 100
        ) {
          strings.push(text);
        }

        walk(
          f.dataStart,
          f.dataEnd,
          depth + 1
        );
      }
    }

    walk(
      start,
      end,
      0
    );

    /*
     * Competition name is normally located
     * before the match title.
     */

    return strings.length
      ? strings[0]
      : "";
  }

  function findMainTimestamp(
    bytes,
    start,
    end
  ) {
    /*
     * IMPORTANT:
     *
     * Only inspect fields at the CURRENT
     * match-message level.
     *
     * Do NOT recursively inspect nested
     * field 10 values.
     */

    const fields =
      parseMessage(
        bytes,
        start,
        end
      );

    const candidates = [];

    for (const f of fields) {

      if (
        f.wire === 0 &&
        isTimestamp(f.value)
      ) {
        candidates.push({
          field: f.field,
          value: f.value,
          offset: f.start
        });
      }
    }

    return candidates;
  }

  function extractMatchRecord(
    bytes,
    start,
    end
  ) {
    const fields =
      parseMessage(
        bytes,
        start,
        end
      );

    const timestamps =
      findMainTimestamp(
        bytes,
        start,
        end
      );

    const title =
      findMatchTitle(
        bytes,
        start,
        end
      );

    const slug =
      findSlug(
        bytes,
        start,
        end
      );

    let matchDate = null;

    /*
     * Field 10 is the expected matchDate.
     */

    const field10 =
      timestamps.find(
        x => x.field === 10
      );

    if (field10) {
      matchDate =
        field10.value;
    }

    /*
     * If field 10 is not present,
     * show all top-level timestamps
     * for debugging.
     */

    let home = "";
    let away = "";

    if (
      title &&
      title.includes(" vs ")
    ) {
      const p =
        title.split(" vs ");

      home =
        p.shift().trim();

      away =
        p.join(" vs ").trim();
    }

    const urls =
      findAllNestedUrls(
        bytes,
        start,
        end
      );

    const teamLogos =
      urls.filter(
        url =>
          url.includes(
            "/football/team/"
          )
      );

    const competitionLogo =
      urls.find(
        url =>
          url.includes(
            "/football/competition/"
          )
      ) || "";

    return {
      matchDate,

      utc:
        matchDate
          ? new Date(
              matchDate
            ).toISOString()
          : "",

      wib:
        matchDate
          ? new Date(
              matchDate
            ).toLocaleString(
              "id-ID",
              {
                timeZone:
                  "Asia/Jakarta",
                year:
                  "numeric",
                month:
                  "2-digit",
                day:
                  "2-digit",
                hour:
                  "2-digit",
                minute:
                  "2-digit",
                second:
                  "2-digit",
                hour12:
                  false
              }
            )
          : "",

      competition:
        findCompetition(
          bytes,
          start,
          end
        ),

      competitionLogo,

      title,

      home,

      away,

      homeLogo:
        teamLogos[0] || "",

      awayLogo:
        teamLogos[1] || "",

      slug,

      topLevelTimestamps:
        timestamps
    };
  }

  function findCandidateRecords(bytes) {

    const records = [];
    const seen = new Set();

    /*
     * Search for:
     *
     * 0A <length> <match message>
     *
     * but validate that the payload actually
     * contains a match slug.
     */

    for (
      let pos = 0;
      pos < bytes.length - 10;
      pos++
    ) {

      if (bytes[pos] !== 0x0a) {
        continue;
      }

      const lenInfo =
        readVarint(
          bytes,
          pos + 1
        );

      if (!lenInfo) continue;

      const start =
        lenInfo.next;

      const end =
        start + lenInfo.value;

      if (
        end > bytes.length ||
        lenInfo.value < 100 ||
        lenInfo.value > 5000
      ) {
        continue;
      }

      const raw =
        decoder.decode(
          bytes.slice(
            start,
            end
          )
        );

      if (
        !raw.includes("-vs-")
      ) {
        continue;
      }

      const key =
        start + ":" + end;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      records.push({
        start: pos,
        dataStart: start,
        end,
        length:
          lenInfo.value
      });
    }

    return records;
  }

  async function run() {

    console.clear();

    console.log(
      "%c[RBTV SCHEDULE 10] START",
      "color:#00d979;font-weight:bold"
    );

    try {

      const response =
        await fetch(
          API,
          {
            cache: "no-store",
            headers: {
              Accept:
                "application/json, text/plain, */*"
            }
          }
        );

      console.log(
        "[RBTV] HTTP:",
        response.status
      );

      const buffer =
        await response.arrayBuffer();

      const bytes =
        new Uint8Array(
          buffer
        );

      console.log(
        "[RBTV] SIZE:",
        bytes.length
      );

      const records =
        findCandidateRecords(
          bytes
        );

      console.log(
        "%c[RBTV] CANDIDATE RECORDS:",
        "color:#00d979;font-weight:bold",
        records.length
      );

      const matches =
        records.map(
          (record, index) => {

            const match =
              extractMatchRecord(
                bytes,
                record.dataStart,
                record.end
              );

            return {
              no: index + 1,
              recordStart:
                record.start,
              recordLength:
                record.length,
              ...match
            };
          }
        );

      /*
       * Only retain records with an actual
       * match title / slug.
       */

      const valid =
        matches.filter(
          m =>
            m.title &&
            m.slug
        );

      /*
       * Sort by real match date.
       */

      valid.sort(
        (a, b) =>
          (a.matchDate || 0) -
          (b.matchDate || 0)
      );

      valid.forEach(
        (m, i) => {
          m.no = i + 1;
        }
      );

      console.log(
        "%c[RBTV MATCHES]",
        "color:#00d979;font-weight:bold"
      );

      console.log(
        "VALID MATCHES:",
        valid.length
      );

      console.table(
        valid.map(
          m => ({
            no: m.no,
            date: m.wib,
            competition:
              m.competition,
            home: m.home,
            away: m.away,
            slug: m.slug
          })
        )
      );

      console.log(
        "%c[RBTV FIRST 10 MATCH DETAIL]",
        "color:#00d979;font-weight:bold"
      );

      console.log(
        valid.slice(
          0,
          10
        )
      );

      /*
       * Debug the first record's top-level
       * timestamps.
       */

      if (valid[0]) {

        console.log(
          "%c[RBTV FIRST MATCH TIMESTAMPS]",
          "color:#00d979;font-weight:bold"
        );

        console.table(
          valid[0]
            .topLevelTimestamps
        );
      }

      window.RBTV_MATCHES =
        valid;

      window.RBTVSchedule10 = {
        run
      };

      console.log(
        "%c[RBTV] window.RBTV_MATCHES READY",
        "color:#00d979;font-weight:bold"
      );

    } catch (error) {

      console.error(
        "[RBTV SCHEDULE 10 ERROR]",
        error
      );
    }
  }

  window.RBTVSchedule10 = {
    run
  };

  run();

})();
