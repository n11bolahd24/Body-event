// --- fungsi load SofaScore tetap ---
function loadSofaScore(matchId, matchKey) {
  console.log("Load SofaScore untuk matchId=" + matchId + " key=" + matchKey);
}


// --- fungsi renderMatch lengkap + countdown aman ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", tvStartTime = null) {
  const html = `
  <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox">
    <div class="countdown" id="countdown${matchKey}"></div>
    <div class="live-container" id="liveContainer${matchKey}" style="text-align:center; height:20px;">
      <span id="liveStatus${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
    </div>
    <div class="club1" style="position: relative; z-index: 1;">
      <br/>
      <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
        <br/><br/>
        <strong id="formattedTime${matchKey}" style="color: red;"></strong>
      </div>
    </div>
    <div class="club">
      <center>
        <span id="league${matchKey}" style="position:relative; top:5px; left:-11px; font-weight:bold; font-size:12px; color:white;">NAMA LIGA</span>
        <div id="liveScore${matchKey}" style="position:relative; top:0px; left:0px;font-size:20px; font-family:'Arial', sans-serif; font-weight:bold; color:orange; text-align:center;"></div>  
        <div id="matchStatus${matchKey}" style="font-family:'Courier New', monospace; font-size:10px; font-weight:bold; color:orange; text-align:center; margin:-1px 1px;"></div>   
        <font id="teams${matchKey}" style="font-size:15px; font-weight:bold">NAMA CLUB VS NAMA CLUB</font><br>
        <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;"></div>
      </center>
    </div>
    <img id="logoHome${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; left:10%; border-radius:5px;">
    <img id="logoAway${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; right:10%; border-radius:5px;">
    <center>
      <span style="font-size: large; display:none;" id="tvContainer${matchKey}">
        ${serverFuncs.map((fn, i) => `
          <a class="tv" href="javascript:${fn}();" style="display:inline-block;"><b><span>SERVER ${i+1}</span></b></a>
        `).join(" ")}
      </span>
      <div id="tvCountdown${matchKey}" style="font-size:12px; color:yellow; margin-top:5px;"></div>
    </center><br>
  </div>
  <script>loadSofaScore(${matchId}, "${matchKey}");<\/script>
  `;

  document.write(html);

  // --- countdown hanya kalau ada waktu start ---
  if (tvStartTime) {
    const target = new Date(tvStartTime).getTime();

    function setupCountdown() {
      const container = document.getElementById(`tvContainer${matchKey}`);
      const countdownEl = document.getElementById(`tvCountdown${matchKey}`);
      if (!container || !countdownEl) {
        setTimeout(setupCountdown, 300);
        return;
      }

      function updateCountdown() {
        const now = Date.now();
        const diff = target - now;

        if (diff <= 0) {
          countdownEl.innerHTML = "<span style='color:red;font-weight:bold;'>SERVER AKTIF 🔴</span>";
          container.style.display = "inline"; // baru tampilkan TV server
          clearInterval(timer);
          return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        countdownEl.innerHTML = `Server aktif dalam ${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
      }

      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
    }

    setupCountdown();
  }
}
// activateTVServerAt - versi robust: sembunyikan semua tombol .tv dalam match box sampai waktunya
function activateTVServerAt(matchKey, targetTime) {
  const target = new Date(targetTime).getTime();

  // retry sampai #match{matchKey} muncul
  function waitForMatchBox() {
    const matchBox = document.getElementById(`match${matchKey}`);
    if (!matchBox) {
      setTimeout(waitForMatchBox, 300);
      return;
    }
    setupCountdownForMatch(matchBox);
  }

  function setupCountdownForMatch(matchBox) {
    // cari semua tombol server di dalam matchBox (selector bebas: a.tv, .tv, button.tv)
    const tvButtons = Array.from(matchBox.querySelectorAll('a.tv, button.tv, .tv'));
    // jika gak ketemu tombol sama sekali, kita mencoba mencari <a> yang berisi "SERVER" teks
    if (tvButtons.length === 0) {
      const maybe = Array.from(matchBox.querySelectorAll('a,button,span'));
      maybe.forEach(el => {
        if (typeof el.textContent === 'string' && /SERVER\s*\d+/i.test(el.textContent.trim())) {
          tvButtons.push(el);
        }
      });
    }

    // jika masih kosong, buat log dan tetap lanjut buat countdown di area tvCountdown{key}
    console.log('activateTVServerAt:', matchKey, 'found tvButtons count=', tvButtons.length);

    // sembunyikan tombol-tombol langsung (pakai inline style + data attr utk restore)
    tvButtons.forEach(btn => {
      // simpan display lama supaya bisa restore; gunakan data attribute
      if (!btn.dataset._origDisplay) {
        btn.dataset._origDisplay = btn.style.display || '';
      }
      btn.style.display = 'none';
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.0';
    });

    // siapkan element countdown: jika sudah ada gunakan, kalau tidak buat di bawah matchBox
    let countdownEl = document.getElementById(`tvCountdown${matchKey}`);
    if (!countdownEl) {
      // coba tempatkan di lokasi yang wajar: cari container center atau akhir matchBox
      const placeAfter = matchBox.querySelector(`#tvContainer${matchKey}`) || matchBox.querySelector('center') || matchBox;
      countdownEl = document.createElement('div');
      countdownEl.id = `tvCountdown${matchKey}`;
      countdownEl.style.fontSize = '12px';
      countdownEl.style.color = 'yellow';
      countdownEl.style.marginTop = '5px';
      placeAfter.appendChild(countdownEl);
    }

    // fungsi update
    function updateCountdown() {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        countdownEl.innerHTML = "<span style='color:red;font-weight:bold;'>SERVER AKTIF 🔴</span>";
        // tampilkan lagi semua tombol (restore display)
        tvButtons.forEach(btn => {
          // restore original display or inline-block as fallback
          const orig = btn.dataset._origDisplay;
          btn.style.display = orig === '' ? 'inline-block' : orig;
          btn.style.pointerEvents = '';
          btn.style.opacity = '';
          // cleanup data attr
          try { delete btn.dataset._origDisplay; } catch(e){ btn.removeAttribute('data-_orig-display'); }
        });
        clearInterval(timer);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      countdownEl.innerHTML = `Server aktif dalam ${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
  }

  waitForMatchBox();
}
