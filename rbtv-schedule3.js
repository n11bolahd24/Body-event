(function () {
  "use strict";

  const API =
    "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live?sportType=1&language=34&stream=true";

  console.log("[RBTV ANALYZER] START");

  function extractStrings(buffer) {
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder("utf-8");

    const result = [];

    let start = -1;

    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];

      const readable =
        b === 9 ||
        b === 10 ||
        b === 13 ||
        (b >= 32 && b <= 126);

      if (readable) {
        if (start === -1) {
          start = i;
        }
      } else {
        if (start !== -1) {
          const chunk = bytes.slice(start, i);

          const text = decoder
            .decode(chunk)
            .trim();

          if (text.length >= 2) {
            result.push({
              index: result.length,
              offset: start,
              length: chunk.length,
              text: text
            });
          }

          start = -1;
        }
      }
    }

    if (start !== -1) {
      const chunk = bytes.slice(start);

      const text = decoder
        .decode(chunk)
        .trim();

      if (text.length >= 2) {
        result.push({
          index: result.length,
          offset: start,
          length: chunk.length,
          text: text
        });
      }
    }

    return result;
  }

  function analyse(strings) {

    console.log(
      "%c[RBTV ANALYZER] TOTAL STRINGS: " +
      strings.length,
      "font-weight:bold;"
    );

    /*
     * Semua string yang terlihat.
     */
    console.table(strings);

    /*
     * Cari URL logo.
     */
    const logos = strings.filter(function (item) {
      return (
        item.text.includes("/football/team/") ||
        item.text.includes("/football/competition/") ||
        item.text.includes("/aelogo/")
      );
    });

    console.log(
      "%c[RBTV ANALYZER] LOGO STRINGS: " +
      logos.length,
      "font-weight:bold;"
    );

    console.table(logos);

    /*
     * Cari slug pertandingan.
     */
    const slugs = strings.filter(function (item) {
      return (
        item.text.includes("-vs-") ||
        item.text.includes("_vs_")
      );
    });

    console.log(
      "%c[RBTV ANALYZER] SLUG MATCH: " +
      slugs.length,
      "font-weight:bold;"
    );

    console.table(slugs);

    /*
     * Cari nama pertandingan.
     */
    const vs = strings.filter(function (item) {
      const t = item.text.toLowerCase();

      return (
        t.includes(" vs ") ||
        t.includes(" vs") ||
        t.includes("vs ")
      );
    });

    console.log(
      "%c[RBTV ANALYZER] VS STRING: " +
      vs.length,
      "font-weight:bold;"
    );

    console.table(vs);

    /*
     * Cari tanggal 2026.
     */
    const years = strings.filter(function (item) {
      return (
        item.text.includes("2026") ||
        item.text.includes("2027")
      );
    });

    console.log(
      "%c[RBTV ANALYZER] DATE/YEAR STRINGS: " +
      years.length,
      "font-weight:bold;"
    );

    console.table(years);

    /*
     * Buat window sekitar slug pertandingan.
     *
     * Ini sangat penting untuk melihat
     * urutan field protobuf sebenarnya.
     */
    const windows = [];

    slugs.forEach(function (slug) {

      const index = slug.index;

      const before =
        strings.slice(
          Math.max(0, index - 15),
          index
        );

      const after =
        strings.slice(
          index + 1,
          Math.min(
            strings.length,
            index + 16
          )
        );

      windows.push({
        slug: slug.text,
        index: index,
        before: before.map(x => x.text),
        after: after.map(x => x.text)
      });
    });

    console.log(
      "%c[RBTV ANALYZER] MATCH WINDOWS",
      "font-weight:bold;"
    );

    console.log(windows);

    /*
     * Tampilkan match pertama dengan jelas.
     */
    if (windows.length) {

      console.log(
        "%c[RBTV ANALYZER] FIRST MATCH WINDOW",
        "font-weight:bold;font-size:15px;"
      );

      console.log(
        windows[0]
      );
    }

    window.RBTVAnalyzer = {
      strings: strings,
      logos: logos,
      slugs: slugs,
      vs: vs,
      years: years,
      windows: windows
    };
  }

  async function start() {

    try {

      console.log(
        "[RBTV ANALYZER] FETCH:",
        API
      );

      const response =
        await fetch(API, {
          method: "GET",
          cache: "no-store"
        });

      console.log(
        "[RBTV ANALYZER] HTTP:",
        response.status
      );

      console.log(
        "[RBTV ANALYZER] TYPE:",
        response.headers.get(
          "content-type"
        )
      );

      const buffer =
        await response.arrayBuffer();

      console.log(
        "[RBTV ANALYZER] SIZE:",
        buffer.byteLength
      );

      const strings =
        extractStrings(buffer);

      analyse(strings);

      console.log(
        "%c[RBTV ANALYZER] READY",
        "color:green;font-weight:bold;"
      );

    } catch (error) {

      console.error(
        "[RBTV ANALYZER] ERROR:",
        error
      );

    }
  }

  start();

})();
