(function () {
  "use strict";

  const API =
    "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live?sportType=1&language=34&stream=true";

  console.log(
    "%c[RBTV MATCH DATE] START",
    "font-weight:bold;font-size:15px;"
  );

  function readVarint(bytes, pos) {

    let value = 0;
    let shift = 0;
    let i = pos;

    while (i < bytes.length) {

      const b = bytes[i++];

      value +=
        (b & 0x7f) *
        Math.pow(2, shift);

      if (!(b & 0x80)) {
        break;
      }

      shift += 7;

      if (shift > 63) {
        break;
      }
    }

    return {
      value,
      next: i
    };
  }

  function findText(bytes, text) {

    const target =
      new TextEncoder()
        .encode(text);

    const positions = [];

    outer:

    for (
      let i = 0;
      i <= bytes.length - target.length;
      i++
    ) {

      for (
        let j = 0;
        j < target.length;
        j++
      ) {

        if (
          bytes[i + j] !== target[j]
        ) {
          continue outer;
        }

      }

      positions.push(i);
    }

    return positions;
  }

  function timestamp(value) {

    if (
      value >= 1700000000000 &&
      value <= 2000000000000
    ) {

      const d =
        new Date(value);

      return {
        value: value,
        utc:
          d.toISOString(),
        wib:
          d.toLocaleString(
            "id-ID",
            {
              timeZone:
                "Asia/Jakarta"
            }
          )
      };

    }

    return null;
  }

  function scanAllVarints(bytes) {

    const result = [];

    for (
      let i = 0;
      i < bytes.length - 1;
      i++
    ) {

      try {

        const v =
          readVarint(
            bytes,
            i + 1
          );

        const info =
          timestamp(v.value);

        if (!info) {
          continue;
        }

        result.push({
          offset: i,
          key: bytes[i],
          field:
            Math.floor(
              bytes[i] / 8
            ),
          value: v.value,
          utc: info.utc,
          wib: info.wib
        });

      } catch (e) {}

    }

    return result;
  }

  function showContext(
    bytes,
    offset,
    radius
  ) {

    const start =
      Math.max(
        0,
        offset - radius
      );

    const end =
      Math.min(
        bytes.length,
        offset + radius
      );

    let text = "";

    for (
      let i = start;
      i < end;
      i++
    ) {

      const b = bytes[i];

      if (
        b >= 32 &&
        b <= 126
      ) {

        text +=
          String.fromCharCode(b);

      } else {

        text += " ";

      }

    }

    /*
     * Bersihkan whitespace panjang.
     */

    return text
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  }

  async function start() {

    try {

      const response =
        await fetch(API, {
          method: "GET",
          cache: "no-store"
        });

      const buffer =
        await response.arrayBuffer();

      const bytes =
        new Uint8Array(buffer);

      console.log(
        "[RBTV MATCH DATE] SIZE:",
        bytes.length
      );

      const slug =
        "real-salt-lake-vs-vancouver-whitecaps";

      const slugPositions =
        findText(
          bytes,
          slug
        );

      console.log(
        "[RBTV MATCH DATE] SLUG POSITIONS:",
        slugPositions
      );

      const timestamps =
        scanAllVarints(bytes);

      console.log(
        "%c[RBTV MATCH DATE] TIMESTAMP COUNT:",
        "font-weight:bold;",
        timestamps.length
      );

      /*
       * Cari timestamp yang berada
       * di sekitar record pertandingan.
       */

      slugPositions.forEach(function (slugPos) {

        console.log(
          "%c[RBTV MATCH DATE] MATCH SLUG OFFSET:",
          "font-weight:bold;",
          slugPos
        );

        const related =
          timestamps
            .filter(function (item) {

              return (
                item.offset >=
                  slugPos - 1000 &&
                item.offset <=
                  slugPos + 1000
              );

            })
            .map(function (item) {

              return Object.assign(
                {},
                item,
                {
                  distance:
                    item.offset -
                    slugPos,
                  context:
                    showContext(
                      bytes,
                      item.offset,
                      100
                    )
                }
              );

            });

        console.log(
          "%c[RBTV MATCH DATE] RELATED TIMESTAMPS",
          "font-weight:bold;color:green;"
        );

        console.table(
          related
        );

      });

      /*
       * Cari semua tanggal 2026
       * yang ada dalam response.
       */

      const future =
        timestamps.filter(
          function (x) {

            return (
              x.value >=
                1780000000000 &&
              x.value <=
                1800000000000
            );

          }
        );

      console.log(
        "%c[RBTV MATCH DATE] 2026 TIMESTAMPS",
        "font-weight:bold;"
      );

      console.table(
        future
      );

      window.RBTVMatchDate = {
        bytes: bytes,
        timestamps: timestamps
      };

      console.log(
        "%c[RBTV MATCH DATE] READY",
        "color:green;font-weight:bold;"
      );

    } catch (error) {

      console.error(
        "[RBTV MATCH DATE] ERROR:",
        error
      );

    }

  }

  start();

})();
