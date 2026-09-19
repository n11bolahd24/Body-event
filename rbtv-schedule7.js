(function () {
  "use strict";

  const API =
    "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live?sportType=1&language=34&stream=true";

  console.log(
    "%c[RBTV RECORD] START",
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
      value: value,
      next: i
    };
  }

  function decodeText(bytes, start, length) {

    try {

      return new TextDecoder("utf-8")
        .decode(
          bytes.slice(
            start,
            start + length
          )
        );

    } catch (e) {

      return "";

    }
  }

  function printable(text) {

    if (!text || text.length < 2) {
      return false;
    }

    let good = 0;

    for (let i = 0; i < text.length; i++) {

      const c =
        text.charCodeAt(i);

      if (
        c === 9 ||
        c === 10 ||
        c === 13 ||
        (c >= 32 && c <= 126)
      ) {
        good++;
      }

    }

    return (
      good / text.length >= 0.90
    );
  }

  function scanFields(
    bytes,
    start,
    end,
    depth
  ) {

    const result = [];

    let pos = start;

    while (pos < end) {

      const fieldOffset = pos;

      let key;

      try {

        key =
          readVarint(
            bytes,
            pos
          );

      } catch (e) {

        break;

      }

      pos = key.next;

      const field =
        Math.floor(
          key.value / 8
        );

      const wire =
        key.value % 8;

      if (
        field <= 0 ||
        field > 10000
      ) {
        break;
      }

      const item = {
        offset: fieldOffset,
        field: field,
        wire: wire,
        depth: depth
      };

      // VARINT
      if (wire === 0) {

        const v =
          readVarint(
            bytes,
            pos
          );

        item.type = "varint";
        item.value = v.value;

        pos = v.next;

        result.push(item);

        continue;
      }

      // FIXED64
      if (wire === 1) {

        if (pos + 8 > end) {
          break;
        }

        const dv =
          new DataView(
            bytes.buffer,
            bytes.byteOffset + pos,
            8
          );

        item.type = "fixed64";

        try {

          item.value =
            dv.getBigUint64(
              0,
              true
            ).toString();

        } catch (e) {

          item.value = "";

        }

        pos += 8;

        result.push(item);

        continue;
      }

      // LENGTH DELIMITED
      if (wire === 2) {

        const lengthInfo =
          readVarint(
            bytes,
            pos
          );

        const length =
          lengthInfo.value;

        pos =
          lengthInfo.next;

        if (
          length < 0 ||
          pos + length > end
        ) {
          break;
        }

        const dataStart = pos;
        const dataEnd =
          pos + length;

        item.type = "length";
        item.length = length;

        const text =
          decodeText(
            bytes,
            dataStart,
            length
          );

        if (printable(text)) {

          item.text = text;

        } else {

          item.text = "";

          /*
           * Simpan juga posisi nested
           * supaya bisa kita analisa.
           */

          item.dataStart =
            dataStart;

          item.dataEnd =
            dataEnd;

        }

        pos = dataEnd;

        result.push(item);

        continue;
      }

      // FIXED32
      if (wire === 5) {

        if (pos + 4 > end) {
          break;
        }

        const dv =
          new DataView(
            bytes.buffer,
            bytes.byteOffset + pos,
            4
          );

        item.type = "fixed32";

        item.value =
          dv.getUint32(
            0,
            true
          );

        pos += 4;

        result.push(item);

        continue;
      }

      break;
    }

    return result;
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

  function showHex(
    bytes,
    start,
    end
  ) {

    const lines = [];

    start =
      Math.max(
        0,
        start
      );

    end =
      Math.min(
        bytes.length,
        end
      );

    for (
      let i = start;
      i < end;
      i += 16
    ) {

      const part = [];

      for (
        let j = i;
        j < Math.min(i + 16, end);
        j++
      ) {

        part.push(
          bytes[j]
            .toString(16)
            .padStart(2, "0")
        );

      }

      lines.push(
        i
          .toString(16)
          .padStart(6, "0") +
        "  " +
        part.join(" ")
      );

    }

    return lines.join("\n");
  }

  function timestampInfo(value) {

    if (
      value >= 1000000000000 &&
      value <= 5000000000000
    ) {

      const d =
        new Date(value);

      return {
        timestamp: value,
        iso: d.toISOString(),
        local:
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
        "[RBTV RECORD] SIZE:",
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
        "[RBTV RECORD] SLUG:",
        slug
      );

      console.log(
        "[RBTV RECORD] POSITIONS:",
        slugPositions
      );

      /*
       * Cari semua timestamp yang valid.
       */

      const timestamps = [];

      for (
        let i = 0;
        i < bytes.length;
        i++
      ) {

        const b =
          bytes[i];

        /*
         * hanya protobuf varint
         */

        if (
          b % 8 !== 0
        ) {
          continue;
        }

        const field =
          Math.floor(b / 8);

        if (
          field <= 0 ||
          field > 200
        ) {
          continue;
        }

        try {

          const v =
            readVarint(
              bytes,
              i + 1
            );

          const info =
            timestampInfo(
              v.value
            );

          if (info) {

            timestamps.push({
              offset: i,
              field: field,
              value: v.value,
              iso: info.iso,
              local: info.local
            });

          }

        } catch (e) {}

      }

      console.log(
        "%c[RBTV RECORD] TIMESTAMPS",
        "font-weight:bold;"
      );

      console.table(
        timestamps
      );

      /*
       * Sekarang tampilkan hex lengkap
       * dari awal sampai slug pertama.
       */

      if (slugPositions.length) {

        const slugPos =
          slugPositions[0];

        console.log(
          "%c[RBTV RECORD] SLUG OFFSET:",
          "font-weight:bold;",
          slugPos
        );

        console.log(
          "%c[RBTV RECORD] HEX 0 → SLUG",
          "font-weight:bold;"
        );

        console.log(
          showHex(
            bytes,
            0,
            slugPos +
            slug.length +
            50
          )
        );

      }

      /*
       * Cari timestamp yang posisinya
       * sebelum slug tetapi paling dekat.
       */

      if (slugPositions.length) {

        const slugPos =
          slugPositions[0];

        const before =
          timestamps
            .filter(function (x) {
              return x.offset < slugPos;
            })
            .sort(function (a, b) {
              return (
                b.offset -
                a.offset
              );
            })
            .slice(0, 10);

        console.log(
          "%c[RBTV RECORD] TIMESTAMP BEFORE SLUG",
          "font-weight:bold;color:blue;"
        );

        console.table(
          before
        );

      }

      window.RBTVRecordAnalyzer = {
        bytes: bytes,
        timestamps: timestamps,
        slugPositions: slugPositions
      };

      console.log(
        "%c[RBTV RECORD] READY",
        "color:green;font-weight:bold;"
      );

    } catch (error) {

      console.error(
        "[RBTV RECORD] ERROR:",
        error
      );

    }

  }

  start();

})();
