(function () {
  "use strict";

  console.log("[RBTV PROTO] SCRIPT START");

  const API =
    "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live";

  const PARAMS =
    "?sportType=1&language=34&stream=true";

  let buffer;
  let bytes;

  function readVarint(pos) {
    let value = 0n;
    let shift = 0n;

    while (pos.i < bytes.length) {
      const b = bytes[pos.i++];

      value |= BigInt(b & 0x7f) << shift;

      if (!(b & 0x80)) {
        return value;
      }

      shift += 7n;

      if (shift > 70n) {
        throw new Error("VARINT TERLALU PANJANG");
      }
    }

    throw new Error("EOF VARINT");
  }

  function utf8(data) {
    try {
      return new TextDecoder("utf-8", {
        fatal: false
      }).decode(data);
    } catch (e) {
      return "";
    }
  }

  function isReadableString(str) {
    if (!str || str.length < 2) return false;

    let good = 0;

    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);

      if (
        c === 9 ||
        c === 10 ||
        c === 13 ||
        (c >= 32 && c <= 126) ||
        c >= 160
      ) {
        good++;
      }
    }

    return good / str.length > 0.85;
  }

  function looksLikeMessage(data, depth) {
    if (depth >= 4 || data.length < 2) {
      return false;
    }

    try {
      const p = {
        i: 0
      };

      let fields = 0;

      while (p.i < data.length && fields < 20) {
        const key = readVarintFrom(data, p);

        const fieldNo = Number(key >> 3n);
        const wire = Number(key & 7n);

        if (
          fieldNo <= 0 ||
          fieldNo > 536870911
        ) {
          return false;
        }

        if (wire === 0) {
          readVarintFrom(data, p);
        } else if (wire === 1) {
          p.i += 8;
        } else if (wire === 2) {
          const len = Number(readVarintFrom(data, p));

          if (
            !Number.isSafeInteger(len) ||
            len < 0 ||
            p.i + len > data.length
          ) {
            return false;
          }

          p.i += len;
        } else if (wire === 5) {
          p.i += 4;
        } else {
          return false;
        }

        if (p.i > data.length) {
          return false;
        }

        fields++;
      }

      return fields > 0 && p.i === data.length;
    } catch (e) {
      return false;
    }
  }

  function readVarintFrom(data, pos) {
    let value = 0n;
    let shift = 0n;

    while (pos.i < data.length) {
      const b = data[pos.i++];

      value |= BigInt(b & 0x7f) << shift;

      if (!(b & 0x80)) {
        return value;
      }

      shift += 7n;

      if (shift > 70n) {
        throw new Error("VARINT");
      }
    }

    throw new Error("EOF");
  }

  function decodeMessage(data, depth, path) {
    if (depth > 5) return [];

    const result = [];
    const pos = {
      i: 0
    };

    while (pos.i < data.length) {
      const start = pos.i;

      let key;

      try {
        key = readVarintFrom(data, pos);
      } catch (e) {
        break;
      }

      const fieldNo = Number(key >> 3n);
      const wire = Number(key & 7n);

      if (
        fieldNo <= 0 ||
        fieldNo > 536870911
      ) {
        break;
      }

      const item = {
        field: fieldNo,
        wire: wire,
        path: path + "." + fieldNo
      };

      try {
        if (wire === 0) {
          const value = readVarintFrom(data, pos);

          item.type = "varint";
          item.value = value.toString();

          /*
           * Tandai angka yang terlihat seperti Unix timestamp
           */
          const n = Number(value);

          if (
            Number.isSafeInteger(n) &&
            n >= 1000000000 &&
            n <= 20000000000
          ) {
            item.timestamp = new Date(
              n < 10000000000
                ? n * 1000
                : n
            ).toISOString();
          }

        } else if (wire === 1) {
          if (pos.i + 8 > data.length) break;

          const view = new DataView(
            data.buffer,
            data.byteOffset + pos.i,
            8
          );

          item.type = "fixed64";
          item.value = view.getBigUint64(
            0,
            true
          ).toString();

          pos.i += 8;

        } else if (wire === 2) {
          const len = Number(
            readVarintFrom(data, pos)
          );

          if (
            !Number.isSafeInteger(len) ||
            len < 0 ||
            pos.i + len > data.length
          ) {
            break;
          }

          const value = data.slice(
            pos.i,
            pos.i + len
          );

          pos.i += len;

          const text = utf8(value);

          if (isReadableString(text)) {
            item.type = "string";
            item.value = text;
          } else if (
            looksLikeMessage(value, depth)
          ) {
            item.type = "message";
            item.length = len;
            item.children = decodeMessage(
              value,
              depth + 1,
              path + "." + fieldNo
            );
          } else {
            item.type = "bytes";
            item.length = len;
          }

        } else if (wire === 5) {
          if (pos.i + 4 > data.length) break;

          const view = new DataView(
            data.buffer,
            data.byteOffset + pos.i,
            4
          );

          item.type = "fixed32";
          item.value = view.getUint32(
            0,
            true
          );

          pos.i += 4;

        } else {
          break;
        }

        result.push(item);

      } catch (e) {
        console.warn(
          "[RBTV PROTO] FIELD ERROR:",
          path,
          fieldNo,
          e
        );

        break;
      }

      /*
       * Pengaman supaya parser tidak looping
       */
      if (pos.i <= start) {
        break;
      }
    }

    return result;
  }

  function collectStrings(nodes, output) {
    output = output || [];

    for (const node of nodes) {
      if (node.type === "string") {
        output.push({
          field: node.path,
          value: node.value
        });
      }

      if (node.children) {
        collectStrings(
          node.children,
          output
        );
      }
    }

    return output;
  }

  function findMatchCandidates(strings) {
    const result = [];

    for (let i = 0; i < strings.length; i++) {
      const value = strings[i].value;

      if (
        value.includes(" vs ") ||
        value.includes(" vs") ||
        value.includes("vs ")
      ) {
        result.push(strings[i]);
      }
    }

    return result;
  }

  function showProto(decoded) {
    console.log(
      "%c[RBTV PROTO] DECODED STRUCTURE",
      "font-weight:bold;font-size:14px;"
    );

    console.log(decoded);

    const strings =
      collectStrings(decoded);

    console.log(
      "%c[RBTV PROTO] STRING FIELDS:",
      "font-weight:bold;"
    );

    console.table(strings);

    const candidates =
      findMatchCandidates(strings);

    console.log(
      "%c[RBTV PROTO] MATCH CANDIDATES:",
      "font-weight:bold;"
    );

    console.table(candidates);

    /*
     * Cari beberapa field timestamp
     */
    const timestamps = [];

    function walk(nodes) {
      for (const node of nodes) {
        if (node.timestamp) {
          timestamps.push({
            field: node.path,
            value: node.value,
            date: node.timestamp
          });
        }

        if (node.children) {
          walk(node.children);
        }
      }
    }

    walk(decoded);

    console.log(
      "%c[RBTV PROTO] TIMESTAMP CANDIDATES:",
      "font-weight:bold;"
    );

    console.table(timestamps);
  }

  function showReadableMatches() {
    const text = new TextDecoder(
      "utf-8"
    ).decode(buffer);

    /*
     * Ambil semua string UTF-8 yang terlihat.
     */
    const matches = [];

    let current = "";

    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);

      if (
        c >= 32 &&
        c <= 126
      ) {
        current += text[i];
      } else {
        if (current.length >= 3) {
          matches.push(current);
        }

        current = "";
      }
    }

    if (current.length >= 3) {
      matches.push(current);
    }

    console.log(
      "%c[RBTV PROTO] ALL READABLE STRINGS:",
      "font-weight:bold;"
    );

    console.log(matches);

    const vs = matches.filter(function (x) {
      return (
        x.includes(" vs ") ||
        x.includes(" vs") ||
        x.includes("vs ")
      );
    });

    console.log(
      "%c[RBTV PROTO] VS STRINGS:",
      "font-weight:bold;"
    );

    console.log(vs);
  }

  async function start() {
    try {
      const url =
        API + PARAMS;

      console.log(
        "[RBTV PROTO] FETCH:",
        url
      );

      const response =
        await fetch(url, {
          method: "GET",
          cache: "no-store"
        });

      console.log(
        "[RBTV PROTO] HTTP:",
        response.status
      );

      console.log(
        "[RBTV PROTO] CONTENT TYPE:",
        response.headers.get(
          "content-type"
        )
      );

      buffer =
        await response.arrayBuffer();

      bytes =
        new Uint8Array(buffer);

      console.log(
        "[RBTV PROTO] SIZE:",
        bytes.length
      );

      /*
       * Decode dari root protobuf
       */
      const decoded =
        decodeMessage(
          bytes,
          0,
          "root"
        );

      showProto(decoded);

      /*
       * Backup string scanner
       */
      showReadableMatches();

      console.log(
        "%c[RBTV PROTO] SELESAI",
        "color:green;font-weight:bold;"
      );

    } catch (error) {
      console.error(
        "[RBTV PROTO] ERROR:",
        error
      );
    }
  }

  start();

})();
