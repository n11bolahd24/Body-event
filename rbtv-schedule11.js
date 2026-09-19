/*!
 * RBTV SCHEDULE 11
 * N11BOLAHD
 *
 * FINAL MATCH RECORD PARSER
 */

(function () {
  "use strict";

  const API =
    "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live?sportType=1&language=34&stream=true";

  const decoder =
    new TextDecoder("utf-8");

  function readVarint(bytes, pos) {

    let value = 0;
    let shift = 0;
    let p = pos;

    while (p < bytes.length) {

      const b = bytes[p++];

      value +=
        (b & 0x7f) *
        Math.pow(2, shift);

      if (!(b & 0x80)) {
        return {
          value,
          next: p
        };
      }

      shift += 7;

      if (shift > 63) {
        return null;
      }
    }

    return null;
  }

  function readField(
    bytes,
    pos,
    end
  ) {

    const keyInfo =
      readVarint(
        bytes,
        pos
      );

    if (!keyInfo) {
      return null;
    }

    const key =
      keyInfo.value;

    const field =
      Math.floor(key / 8);

    const wire =
      key % 8;

    if (
      field <= 0 ||
      field > 1000
    ) {
      return null;
    }

    let p =
      keyInfo.next;

    const result = {
      field,
      wire,
      key,
      start: pos
    };

    // VARINT
    if (wire === 0) {

      const v =
        readVarint(
          bytes,
          p
        );

      if (!v) {
        return null;
      }

      result.value =
        v.value;

      result.end =
        v.next;

      return result;
    }

    // FIXED64
    if (wire === 1) {

      if (
        p + 8 > end
      ) {
        return null;
      }

      result.dataStart = p;
      result.dataEnd =
        p + 8;
      result.end =
        p + 8;

      return result;
    }

    // LENGTH DELIMITED
    if (wire === 2) {

      const lenInfo =
        readVarint(
          bytes,
          p
        );

      if (!lenInfo) {
        return null;
      }

      const dataStart =
        lenInfo.next;

      const dataEnd =
        dataStart +
        lenInfo.value;

      if (
        dataEnd > end
      ) {
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

      if (
        p + 4 > end
      ) {
        return null;
      }

      result.dataStart = p;
      result.dataEnd =
        p + 4;

      result.end =
        p + 4;

      return result;
    }

    return null;
  }

  function parseMessage(
    bytes,
    start,
    end
  ) {

    const fields = [];

    let pos = start;

    while (
      pos < end
    ) {

      const f =
        readField(
          bytes,
          pos,
          end
        );

      if (!f) {
        break;
      }

      fields.push(f);

      pos =
        f.end;
    }

    return fields;
  }

  function getText(
    bytes,
    field
  ) {

    if (
      !field ||
      field.wire !== 2
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

  function cleanText(
    text
  ) {

    return (text || "")
      .replace(
        /^[\x00-\x20]+/,
        ""
      )
      .trim();
  }

  function findMatchRecord(
    bytes,
    pos
  ) {

    if (
      bytes[pos] !== 0x0a
    ) {
      return null;
    }

    const lenInfo =
      readVarint(
        bytes,
        pos + 1
      );

    if (!lenInfo) {
      return null;
    }

    const dataStart =
      lenInfo.next;

    const dataEnd =
      dataStart +
      lenInfo.value;

    if (
      dataEnd > bytes.length
    ) {
      return null;
    }

    const raw =
      decoder.decode(
        bytes.slice(
          dataStart,
          dataEnd
        )
      );

    if (
      !raw.includes("-vs-")
    ) {
      return null;
    }

    return {
      start: pos,
      dataStart,
      end: dataEnd,
      length:
        lenInfo.value
    };
  }

  function findRecords(
    bytes
  ) {

    const records = [];
    const seen =
      new Set();

    for (
      let i = 0;
      i < bytes.length - 10;
      i++
    ) {

      if (
        bytes[i] !== 0x0a
      ) {
        continue;
      }

      const record =
        findMatchRecord(
          bytes,
          i
        );

      if (!record) {
        continue;
      }

      const key =
        record.dataStart +
        ":" +
        record.end;

      if (
        seen.has(key)
      ) {
        continue;
      }

      seen.add(key);

      records.push(
        record
      );
    }

    return records;
  }

  /*
   * -------------------------------------------------------
   * GET MATCH DATE
   * -------------------------------------------------------
   *
   * FIELD 3 = MATCH DATE
   *
   * This is read ONLY at the top level
   * of the match record.
   */

  function getMatchDate(
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

    for (
      const f of fields
    ) {

      if (
        f.field === 3 &&
        f.wire === 0 &&
        typeof f.value ===
          "number" &&
        f.value >
          1500000000000 &&
        f.value <
          3000000000000
      ) {

        return f.value;
      }
    }

    return null;
  }

  /*
   * -------------------------------------------------------
   * FIND ALL STRINGS
   * -------------------------------------------------------
   */

  function collectStrings(
    bytes,
    start,
    end,
    output = [],
    depth = 0
  ) {

    if (
      depth > 8
    ) {
      return output;
    }

    const fields =
      parseMessage(
        bytes,
        start,
        end
      );

    for (
      const f of fields
    ) {

      if (
        f.wire !== 2
      ) {
        continue;
      }

      const text =
        cleanText(
          getText(
            bytes,
            f
          )
        );

      if (
        text
      ) {

        output.push({
          field:
            f.field,
          text,
          depth,
          offset:
            f.dataStart
        });
      }

      collectStrings(
        bytes,
        f.dataStart,
        f.dataEnd,
        output,
        depth + 1
      );
    }

    return output;
  }

  /*
   * -------------------------------------------------------
   * FIND TITLE
   * -------------------------------------------------------
   */

  function getTitle(
    strings
  ) {

    const item =
      strings.find(
        x =>
          x.text.includes(
            " vs "
          )
      );

    return item
      ? item.text
      : "";
  }

  /*
   * -------------------------------------------------------
   * FIND SLUG
   * -------------------------------------------------------
   */

  function getSlug(
    strings
  ) {

    const item =
      strings.find(
        x =>
          x.text.includes(
            "-vs-"
          ) &&
          /^[a-z0-9-]+$/i.test(
            x.text
          )
      );

    return item
      ? item.text
      : "";
  }

  /*
   * -------------------------------------------------------
   * FIND LOGOS
   * -------------------------------------------------------
   */

  function getUrls(
    strings
  ) {

    return strings
      .map(
        x => x.text
      )
      .filter(
        x =>
          /^https?:\/\//i.test(
            x
          )
      );
  }

  function cleanLogo(
    url
  ) {

    return (
      url || ""
    )
      .replace(
        /!w\d+$/i,
        ""
      )
      .trim();
  }

  /*
   * -------------------------------------------------------
   * COMPETITION
   * -------------------------------------------------------
   */

  function getCompetition(
    strings,
    title
  ) {

    const titleIndex =
      strings.findIndex(
        x =>
          x.text === title
      );

    if (
      titleIndex < 0
    ) {
      return "";
    }

    /*
     * Search backwards from
     * the match title.
     */

    for (
      let i =
        titleIndex - 1;
      i >= 0;
      i--
    ) {

      const text =
        strings[i].text;

      if (
        !text ||
        text.includes(
          "http"
        ) ||
        text.includes(
          "-vs-"
        ) ||
        text.includes(
          " vs "
        )
      ) {
        continue;
      }

      /*
       * Ignore year.
       */

      if (
        /^\d{4}$/.test(
          text
        )
      ) {
        continue;
      }

      /*
       * Ignore generic labels.
       */

      if (
        text === "def" ||
        text === "SuccessR"
      ) {
        continue;
      }

      if (
        text.length >= 3 &&
        text.length <= 100
      ) {
        return text;
      }
    }

    return "";
  }

  /*
   * -------------------------------------------------------
   * BUILD MATCH
   * -------------------------------------------------------
   */

  function buildMatch(
    bytes,
    record
  ) {

    const strings =
      collectStrings(
        bytes,
        record.dataStart,
        record.end
      );

    const title =
      getTitle(
        strings
      );

    const slug =
      getSlug(
        strings
      );

    const matchDate =
      getMatchDate(
        bytes,
        record.dataStart,
        record.end
      );

    let home = "";
    let away = "";

    if (
      title &&
      title.includes(
        " vs "
      )
    ) {

      const parts =
        title.split(
          " vs "
        );

      home =
        parts
          .shift()
          .trim();

      away =
        parts
          .join(
            " vs "
          )
          .trim();
    }

    /*
     * Remove protobuf field marker
     * such as \x12 from team names.
     */

    home =
      home.replace(
        /^[\x00-\x1f]+/,
        ""
      );

    away =
      away.replace(
        /^[\x00-\x1f]+/,
        ""
      );

    const urls =
      getUrls(
        strings
      );

    const teamLogos =
      urls.filter(
        x =>
          x.includes(
            "/football/team/"
          )
      );

    const competitionLogo =
      urls.find(
        x =>
          x.includes(
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
        getCompetition(
          strings,
          title
        ),

      competitionLogo:
        cleanLogo(
          competitionLogo
        ),

      title,

      home,

      away,

      homeLogo:
        cleanLogo(
          teamLogos[0]
        ),

      awayLogo:
        cleanLogo(
          teamLogos[1]
        ),

      slug,

      recordStart:
        record.start,

      recordLength:
        record.length
    };
  }

  async function run() {

    console.clear();

    console.log(
      "%c[RBTV SCHEDULE 11] START",
      "color:#00d979;font-weight:bold"
    );

    try {

      const response =
        await fetch(
          API,
          {
            cache:
              "no-store",
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
        findRecords(
          bytes
        );

      console.log(
        "%c[RBTV] RECORDS FOUND:",
        "color:#00d979;font-weight:bold",
        records.length
      );

      const matches =
        records
          .map(
            record =>
              buildMatch(
                bytes,
                record
              )
          )
          .filter(
            m =>
              m.matchDate &&
              m.home &&
              m.away &&
              m.slug
          );

      /*
       * Sort chronological
       */

      matches.sort(
        (a, b) =>
          a.matchDate -
          b.matchDate
      );

      matches.forEach(
        (m, i) => {
          m.no =
            i + 1;
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

      console.table(
        matches.map(
          m => ({
            no:
              m.no,

            date:
              m.wib,

            competition:
              m.competition,

            home:
              m.home,

            away:
              m.away,

            slug:
              m.slug
          })
        )
      );

      console.log(
        "%c[RBTV FIRST MATCH]",
        "color:#00d979;font-weight:bold"
      );

      console.log(
        matches[0]
      );

      console.log(
        "%c[RBTV MATCH 2]",
        "color:#00d979;font-weight:bold"
      );

      console.log(
        matches[1]
      );

      console.log(
        "%c[RBTV MATCH 3]",
        "color:#00d979;font-weight:bold"
      );

      console.log(
        matches[2]
      );

      window.RBTV_MATCHES =
        matches;

      console.log(
        "%c[RBTV] window.RBTV_MATCHES READY",
        "color:#00d979;font-weight:bold"
      );

    } catch (error) {

      console.error(
        "[RBTV SCHEDULE 11 ERROR]",
        error
      );
    }
  }

  window.RBTVSchedule11 = {
    run
  };

  run();

})();
