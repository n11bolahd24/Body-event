/*!
 * RBTV SCHEDULE 9
 * N11BOLAHD
 * Parse match records from RBTV protobuf response
 */

(function () {
  "use strict";

  const API =
    "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live?sportType=1&language=34&stream=true";

  function readVarint(bytes, pos) {
    let value = 0;
    let shift = 0;
    let i = pos;

    while (i < bytes.length) {
      const b = bytes[i++];
      value += (b & 0x7f) * Math.pow(2, shift);

      if (!(b & 0x80)) {
        return {
          value: value,
          next: i
        };
      }

      shift += 7;

      if (shift > 63) break;
    }

    return null;
  }

  function utf8(bytes) {
    try {
      return new TextDecoder("utf-8", {
        fatal: false
      }).decode(bytes);
    } catch (e) {
      return "";
    }
  }

  function isReadableText(text) {
    if (!text || text.length < 2) return false;

    let good = 0;

    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);

      if (
        c === 9 ||
        c === 10 ||
        c === 13 ||
        (c >= 32 && c <= 126)
      ) {
        good++;
      }
    }

    return good / text.length > 0.85;
  }

  function parseFields(bytes, start, end, depth) {
    depth = depth || 0;

    if (depth > 5) return [];

    const result = [];
    let pos = start;

    while (pos < end) {
      const keyInfo = readVarint(bytes, pos);

      if (!keyInfo) break;

      const key = keyInfo.value;
      const field = Math.floor(key / 8);
      const wire = key % 8;

      if (field <= 0 || field > 1000) break;

      pos = keyInfo.next;

      const item = {
        field: field,
        wire: wire,
        offset: pos
      };

      if (wire === 0) {
        const v = readVarint(bytes, pos);

        if (!v) break;

        item.value = v.value;
        item.next = v.next;

        result.push(item);

        pos = v.next;
        continue;
      }

      if (wire === 2) {
        const lenInfo = readVarint(bytes, pos);

        if (!lenInfo) break;

        const len = lenInfo.value;
        const dataStart = lenInfo.next;
        const dataEnd = dataStart + len;

        if (
          dataEnd > end ||
          len > bytes.length
        ) {
          break;
        }

        const data = bytes.slice(dataStart, dataEnd);
        const text = utf8(data);

        item.length = len;
        item.dataStart = dataStart;
        item.dataEnd = dataEnd;

        if (isReadableText(text)) {
          item.text = text;
        }

        if (depth < 5) {
          const nested = parseFields(
            bytes,
            dataStart,
            dataEnd,
            depth + 1
          );

          if (nested.length) {
            item.nested = nested;
          }
        }

        result.push(item);

        pos = dataEnd;
        continue;
      }

      if (wire === 1) {
        if (pos + 8 > end) break;

        item.next = pos + 8;
        result.push(item);

        pos += 8;
        continue;
      }

      if (wire === 5) {
        if (pos + 4 > end) break;

        item.next = pos + 4;
        result.push(item);

        pos += 4;
        continue;
      }

      // Unsupported wire type
      break;
    }

    return result;
  }

  function collectStrings(bytes, start, end) {
    const strings = [];

    function walk(a, b, depth) {
      if (depth > 6) return;

      const fields = parseFields(bytes, a, b, depth);

      for (const f of fields) {
        if (f.text) {
          strings.push({
            field: f.field,
            text: f.text,
            offset: f.dataStart
          });
        }

        if (f.nested) {
          walk(
            f.dataStart,
            f.dataEnd,
            depth + 1
          );
        }
      }
    }

    walk(start, end, 0);

    return strings;
  }

  function findMatchRecord(bytes, slugPos) {
    /*
     * Look backwards for a length-delimited field
     * whose payload contains this match slug.
     *
     * We do this instead of blindly scanning timestamps.
     */

    const min = Math.max(0, slugPos - 1500);

    for (let p = slugPos; p >= min; p--) {
      if (bytes[p] !== 0x0a) continue;

      const lenInfo = readVarint(bytes, p + 1);

      if (!lenInfo) continue;

      const dataStart = lenInfo.next;
      const dataEnd = dataStart + lenInfo.value;

      if (
        dataStart > slugPos ||
        dataEnd <= slugPos ||
        dataEnd > bytes.length
      ) {
        continue;
      }

      const data = bytes.slice(
        dataStart,
        dataEnd
      );

      const text = utf8(data);

      if (
        text.includes("-vs-") ||
        text.includes(" vs ")
      ) {
        return {
          start: p,
          dataStart: dataStart,
          end: dataEnd,
          length: lenInfo.value
        };
      }
    }

    return null;
  }

  function findAllSlugs(bytes) {
    const all = [];

    for (let i = 0; i < bytes.length - 4; i++) {
      if (bytes[i] !== 0x25) continue;

      const remain = bytes.slice(i + 1);

      let text = "";

      try {
        text = new TextDecoder().decode(remain);
      } catch (e) {
        continue;
      }

      const match = text.match(
        /^[a-z0-9]+(?:-[a-z0-9]+)*-vs-[a-z0-9]+(?:-[a-z0-9]+)*/
      );

      if (!match) continue;

      const slug = match[0];

      if (
        slug.length < 8 ||
        slug.length > 200
      ) {
        continue;
      }

      all.push({
        slug: slug,
        position: i + 1
      });
    }

    return all;
  }

  function findTimestamp(fields) {
    /*
     * Field 10 is currently the strongest candidate
     * for matchDate based on the protobuf structure.
     */

    for (const f of fields) {
      if (
        f.field === 10 &&
        f.wire === 0 &&
        typeof f.value === "number" &&
        f.value > 1000000000000 &&
        f.value < 3000000000000
      ) {
        return f.value;
      }
    }

    return null;
  }

  function flattenFields(fields, output) {
    output = output || [];

    for (const f of fields) {
      output.push(f);

      if (f.nested) {
        flattenFields(f.nested, output);
      }
    }

    return output;
  }

  function extractTeamLogos(strings) {
    return strings
      .map(x => x.text)
      .filter(x =>
        x.includes("/football/team/")
      );
  }

  function extractCompetitionLogo(strings) {
    return strings
      .map(x => x.text)
      .find(x =>
        x.includes("/football/competition/")
      ) || "";
  }

  function extractMatchTitle(strings) {
    const item = strings.find(x =>
      x.text.includes(" vs ")
    );

    return item ? item.text : "";
  }

  function cleanUrl(value) {
    if (!value) return "";

    /*
     * Logo URLs in protobuf sometimes end with
     * !w80 / !w120 etc.
     */
    return value
      .replace(/!w\d+$/i, "")
      .trim();
  }

  function formatWIB(ms) {
    if (!ms) return "";

    const d = new Date(ms);

    return d.toLocaleString(
      "id-ID",
      {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }
    );
  }

  function analyzeRecord(bytes, record) {
    const fields = parseFields(
      bytes,
      record.dataStart,
      record.end,
      0
    );

    const flat = flattenFields(fields);

    const strings = collectStrings(
      bytes,
      record.dataStart,
      record.end
    );

    const title = extractMatchTitle(strings);

    const teamLogos =
      extractTeamLogos(strings)
        .map(cleanUrl);

    const competitionLogo =
      cleanUrl(
        extractCompetitionLogo(strings)
      );

    let matchDate = null;

    /*
     * Search only fields parsed from THIS record.
     */
    for (const f of flat) {
      if (
        f.field === 10 &&
        f.wire === 0 &&
        typeof f.value === "number" &&
        f.value > 1000000000000 &&
        f.value < 3000000000000
      ) {
        matchDate = f.value;
        break;
      }
    }

    let home = "";
    let away = "";

    if (title.includes(" vs ")) {
      const parts = title.split(" vs ");

      home = parts.shift().trim();
      away = parts.join(" vs ").trim();
    }

    return {
      recordStart: record.start,
      recordLength: record.length,

      matchDate: matchDate,

      utc: matchDate
        ? new Date(matchDate).toISOString()
        : "",

      wib: formatWIB(matchDate),

      competitionLogo: competitionLogo,

      title: title,

      home: home,
      away: away,

      homeLogo: teamLogos[0] || "",
      awayLogo: teamLogos[1] || "",

      slug: ""
    };
  }

  async function run() {
    console.clear();

    console.log(
      "%c[RBTV SCHEDULE 9] START",
      "color:#00d979;font-weight:bold"
    );

    try {
      const response = await fetch(API, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Accept":
            "application/json, text/plain, */*"
        }
      });

      console.log(
        "[RBTV] HTTP:",
        response.status
      );

      const buffer =
        await response.arrayBuffer();

      const bytes =
        new Uint8Array(buffer);

      console.log(
        "[RBTV] SIZE:",
        bytes.length
      );

      /*
       * Find all match slugs.
       */
      const slugList =
        findAllSlugs(bytes);

      console.log(
        "[RBTV] SLUGS FOUND:",
        slugList.length
      );

      const records = [];
      const used = new Set();

      for (const s of slugList) {
        const record =
          findMatchRecord(
            bytes,
            s.position
          );

        if (!record) continue;

        const key =
          record.dataStart +
          ":" +
          record.end;

        if (used.has(key)) continue;

        used.add(key);

        const match =
          analyzeRecord(
            bytes,
            record
          );

        match.slug = s.slug;

        records.push(match);
      }

      /*
       * Sort chronologically.
       */
      records.sort(
        (a, b) =>
          (a.matchDate || 0) -
          (b.matchDate || 0)
      );

      console.log(
        "%c[RBTV MATCH RECORDS]",
        "color:#00d979;font-weight:bold"
      );

      console.log(
        "TOTAL RECORDS:",
        records.length
      );

      console.table(
        records.map((m, i) => ({
          no: i + 1,
          date: m.wib,
          home: m.home,
          away: m.away,
          slug: m.slug
        }))
      );

      /*
       * Detailed first 10 records.
       */
      console.log(
        "%c[RBTV MATCH DETAIL]",
        "color:#00d979;font-weight:bold"
      );

      console.log(
        records.slice(0, 10)
      );

      /*
       * First record only.
       */
      if (records.length) {
        console.log(
          "%c[RBTV FIRST MATCH]",
          "color:#00d979;font-weight:bold"
        );

        console.log(
          records[0]
        );
      }

      window.RBTV_MATCHES = records;

      console.log(
        "%c[RBTV] window.RBTV_MATCHES READY",
        "color:#00d979;font-weight:bold"
      );

    } catch (error) {
      console.error(
        "[RBTV SCHEDULE 9 ERROR]",
        error
      );
    }
  }

  window.RBTVSchedule9 = {
    run: run
  };

  run();

})();
