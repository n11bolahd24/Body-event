(function () {
  "use strict";

  const API =
    "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live?sportType=1&language=34&stream=true";

  console.log(
    "%c[RBTV PROTO MAP] START",
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

  function isPrintable(bytes, start, length) {

    if (
      length <= 0 ||
      length > 10000
    ) {
      return false;
    }

    let good = 0;

    for (
      let i = start;
      i < start + length;
      i++
    ) {

      const b = bytes[i];

      if (
        b === 9 ||
        b === 10 ||
        b === 13 ||
        (b >= 32 && b <= 126)
      ) {
        good++;
      }

    }

    return good / length > 0.90;
  }

  function getText(bytes, start, length) {

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

  /*
   * Membaca protobuf secara longgar.
   * Tidak memaksa nested message.
   */
  function scan(bytes, start, end, depth) {

    const result = [];

    let pos = start;

    while (
      pos < end &&
      result.length < 500
    ) {

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

      // -----------------------------
      // VARINT
      // -----------------------------

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

      // -----------------------------
      // FIXED64
      // -----------------------------

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

          item.value =
            "unavailable";

        }

        pos += 8;

        result.push(item);

        continue;
      }

      // -----------------------------
      // LENGTH DELIMITED
      // -----------------------------

      if (wire === 2) {

        const lenInfo =
          readVarint(
            bytes,
            pos
          );

        const length =
          lenInfo.value;

        pos =
          lenInfo.next;

        if (
          length < 0 ||
          pos + length > end
        ) {
          break;
        }

        item.type = "length";
        item.length = length;

        if (
          isPrintable(
            bytes,
            pos,
            length
          )
        ) {

          item.text =
            getText(
              bytes,
              pos,
              length
            );

        } else {

          item.text = "";

        }

        pos += length;

        result.push(item);

        continue;
      }

      // -----------------------------
      // FIXED32
      // -----------------------------

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

  function findBytes(bytes, text) {

    const target =
      new TextEncoder().encode(text);

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

  function decodeDateCandidates(value) {

    const values = [];

    /*
     * protobuf varint kemungkinan:
     *
     * seconds
     * milliseconds
     * microseconds
     */

    if (
      value >= 1000000000 &&
      value <= 5000000000
    ) {

      values.push({
        unit: "seconds",
        date:
          new Date(
            value * 1000
          ).toISOString()
      });

    }

    if (
      value >= 1000000000000 &&
      value <= 5000000000000
    ) {

      values.push({
        unit: "milliseconds",
        date:
          new Date(
            value
          ).toISOString()
      });

    }

    return values;
  }

  function showNumericCandidates(
    fields
  ) {

    const candidates = [];

    fields.forEach(function (item) {

      if (
        item.type !== "varint" &&
        item.type !== "fixed32" &&
        item.type !== "fixed64"
      ) {
        return;
      }

      const value =
        Number(item.value);

      if (
        !Number.isFinite(value)
      ) {
        return;
      }

      const dates =
        decodeDateCandidates(
          value
        );

      if (dates.length) {

        candidates.push({
          offset: item.offset,
          field: item.field,
          wire: item.wire,
          value: value,
          dates: dates
        });

      }

    });

    console.log(
      "%c[RBTV PROTO MAP] TIMESTAMP CANDIDATES",
      "font-weight:bold;color:green;"
    );

    console.table(candidates);

    return candidates;
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
        "[RBTV PROTO MAP] SIZE:",
        bytes.length
      );

      const positions =
        findBytes(
          bytes,
          "real-salt-lake-vs-vancouver-whitecaps"
        );

      console.log(
        "[RBTV PROTO MAP] SLUG POSITIONS:",
        positions
      );

      /*
       * Baca dari awal response.
       *
       * Tujuannya bukan langsung decode
       * sebagai satu message, tetapi mencari
       * field-field numerik yang masuk akal
       * sebagai timestamp.
       */

      const root =
        scan(
          bytes,
          0,
          bytes.length,
          0
        );

      console.log(
        "%c[RBTV PROTO MAP] ROOT FIELDS:",
        "font-weight:bold;"
      );

      console.table(
        root.map(function (x) {

          return {
            offset: x.offset,
            field: x.field,
            wire: x.wire,
            type: x.type,
            length: x.length,
            value: x.value,
            text:
              x.text
                ? x.text.substring(0, 150)
                : ""
          };

        })
      );

      showNumericCandidates(
        root
      );

      /*
       * Cari angka timestamp langsung
       * dari seluruh byte stream dengan
       * asumsi varint.
       */

      const numeric = [];

      for (
        let i = 0;
        i < bytes.length;
        i++
      ) {

        let b = bytes[i];

        /*
         * Hanya coba posisi yang mungkin
         * merupakan protobuf key.
         */

        const field =
          Math.floor(b / 8);

        const wire =
          b % 8;

        if (
          field <= 0 ||
          field > 200 &&
          wire !== 0
        ) {
          continue;
        }

        if (wire !== 0) {
          continue;
        }

        try {

          const v =
            readVarint(
              bytes,
              i + 1
            );

          const value =
            v.value;

          if (
            value >= 1000000000 &&
            value <= 5000000000000
          ) {

            numeric.push({
              offset: i,
              field: field,
              value: value,
              dates:
                decodeDateCandidates(
                  value
                )
            });

          }

        } catch (e) {}

      }

      console.log(
        "%c[RBTV PROTO MAP] ALL NUMERIC DATE CANDIDATES:",
        "font-weight:bold;"
      );

      console.table(
        numeric
      );

      /*
       * Tampilkan kandidat yang lokasinya
       * dekat record Real Salt Lake.
       */

      if (positions.length) {

        const matchPos =
          positions[0];

        const nearby =
          numeric.filter(
            function (x) {

              return (
                Math.abs(
                  x.offset - matchPos
                ) < 1000
              );

            }
          );

        console.log(
          "%c[RBTV PROTO MAP] NEAR MATCH:",
          "font-weight:bold;color:blue;"
        );

        console.table(
          nearby
        );

      }

      window.RBTVProtoMap = {
        buffer: buffer,
        bytes: bytes,
        root: root,
        timestamps: numeric
      };

      console.log(
        "%c[RBTV PROTO MAP] READY",
        "color:green;font-weight:bold;"
      );

    } catch (error) {

      console.error(
        "[RBTV PROTO MAP] ERROR:",
        error
      );

    }

  }

  start();

})();
