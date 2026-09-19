(function () {
  "use strict";

  const API =
    "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live?sportType=1&language=34&stream=true";

  console.log("%c[RBTV FIELD] START", "font-weight:bold;");

  function readVarint(bytes, pos) {

    let value = 0;
    let shift = 0;
    let i = pos;

    while (i < bytes.length) {

      const b = bytes[i++];

      value += (b & 0x7f) * Math.pow(2, shift);

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

  function readString(bytes, pos, length) {

    const decoder = new TextDecoder("utf-8");

    return decoder.decode(
      bytes.slice(pos, pos + length)
    );
  }

  function printable(text) {

    if (!text) return false;

    let count = 0;

    for (let i = 0; i < text.length; i++) {

      const c = text.charCodeAt(i);

      if (
        c === 9 ||
        c === 10 ||
        c === 13 ||
        (c >= 32 && c <= 126)
      ) {
        count++;
      }

    }

    return count / text.length > 0.85;
  }

  function scanMessage(bytes, start, end, depth) {

    const rows = [];

    let pos = start;

    while (pos < end) {

      const fieldStart = pos;

      let key;

      try {
        key = readVarint(bytes, pos);
      } catch (e) {
        break;
      }

      pos = key.next;

      const fieldNumber = Math.floor(key.value / 8);
      const wireType = key.value % 8;

      if (
        fieldNumber <= 0 ||
        fieldNumber > 10000
      ) {
        break;
      }

      const row = {
        offset: fieldStart,
        field: fieldNumber,
        wire: wireType,
        depth: depth
      };

      // -----------------------------------------
      // VARINT
      // -----------------------------------------

      if (wireType === 0) {

        const value = readVarint(bytes, pos);

        row.type = "varint";
        row.value = value.value;

        row.hex =
          value.value.toString(16);

        pos = value.next;

        rows.push(row);

        continue;
      }

      // -----------------------------------------
      // FIXED64
      // -----------------------------------------

      if (wireType === 1) {

        if (pos + 8 > end) break;

        row.type = "fixed64";

        const dv =
          new DataView(
            bytes.buffer,
            bytes.byteOffset + pos,
            8
          );

        row.value =
          dv.getBigUint64(0, true).toString();

        pos += 8;

        rows.push(row);

        continue;
      }

      // -----------------------------------------
      // LENGTH DELIMITED
      // -----------------------------------------

      if (wireType === 2) {

        const lengthInfo =
          readVarint(bytes, pos);

        const length =
          lengthInfo.value;

        pos = lengthInfo.next;

        if (
          length < 0 ||
          pos + length > end
        ) {
          break;
        }

        const dataStart = pos;
        const dataEnd = pos + length;

        const text =
          readString(
            bytes,
            dataStart,
            length
          );

        row.type = "length";
        row.length = length;

        if (printable(text)) {

          row.text = text;

        } else {

          row.text = "";

          // coba sebagai nested protobuf
          if (depth < 5) {

            const nested =
              scanMessage(
                bytes,
                dataStart,
                dataEnd,
                depth + 1
              );

            if (nested.length) {
              row.nested = nested;
            }

          }

        }

        pos = dataEnd;

        rows.push(row);

        continue;
      }

      // -----------------------------------------
      // FIXED32
      // -----------------------------------------

      if (wireType === 5) {

        if (pos + 4 > end) break;

        row.type = "fixed32";

        const dv =
          new DataView(
            bytes.buffer,
            bytes.byteOffset + pos,
            4
          );

        row.value =
          dv.getUint32(0, true);

        pos += 4;

        rows.push(row);

        continue;
      }

      // unknown wire type
      break;
    }

    return rows;
  }

  function findBytes(buffer, text) {

    const bytes =
      new Uint8Array(buffer);

    const target =
      new TextEncoder().encode(text);

    const result = [];

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

      result.push(i);
    }

    return result;
  }

  function showMatch(buffer, target) {

    const positions =
      findBytes(buffer, target);

    console.log(
      "%c[RBTV FIELD] MATCH:",
      "font-weight:bold;font-size:15px;",
      target
    );

    console.log(
      "[RBTV FIELD] POSITIONS:",
      positions
    );

    const bytes =
      new Uint8Array(buffer);

    positions.forEach(function (pos) {

      /*
       * Mulai sedikit sebelum string
       * agar parent protobuf ikut terbaca.
       */
      const start =
        Math.max(0, pos - 500);

      const end =
        Math.min(
          bytes.length,
          pos + target.length + 100
        );

      const fields =
        scanMessage(
          bytes,
          start,
          end,
          0
        );

      console.log(
        "%c[RBTV FIELD] STRUCTURE",
        "font-weight:bold;"
      );

      console.log(fields);

      console.table(
        fields.map(function (x) {

          return {
            offset: x.offset,
            field: x.field,
            wire: x.wire,
            type: x.type,
            value: x.value,
            length: x.length,
            text: x.text || ""
          };

        })
      );

    });
  }

  async function start() {

    try {

      const response =
        await fetch(API, {
          method: "GET",
          cache: "no-store"
        });

      console.log(
        "[RBTV FIELD] HTTP:",
        response.status
      );

      console.log(
        "[RBTV FIELD] TYPE:",
        response.headers.get(
          "content-type"
        )
      );

      const buffer =
        await response.arrayBuffer();

      console.log(
        "[RBTV FIELD] SIZE:",
        buffer.byteLength
      );

      showMatch(
        buffer,
        "real-salt-lake-vs-vancouver-whitecaps"
      );

      console.log(
        "%c[RBTV FIELD] READY",
        "color:green;font-weight:bold;"
      );

      window.RBTVFieldAnalyzer = {
        buffer: buffer,
        scanMessage: function (
          start,
          end
        ) {
          return scanMessage(
            new Uint8Array(buffer),
            start,
            end,
            0
          );
        }
      };

    } catch (error) {

      console.error(
        "[RBTV FIELD] ERROR:",
        error
      );

    }

  }

  start();

})();
