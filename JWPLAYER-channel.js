// Fungsi pembuat tombol & dropdown
function initChannelButton(player, streams) {
  const container = player.getContainer();
  container.style.position = "relative";

  // Tombol utama
  const button = document.createElement("div");
  Object.assign(button.style, {
    position: "absolute",
    top: "8px",
    right: "20px",
    background: "#FFD54F",
    color: "#000",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer"
  });
  button.innerHTML = "📺 Pilih Channel ▾";

  // Dropdown
  const dropdown = document.createElement("div");
  Object.assign(dropdown.style, {
    display: "none",
    position: "absolute",
    top: "38px",
    right: "10px",
    background: "rgba(0,0,0,0.9)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "6px",
    overflow: "hidden",
    zIndex: "9999",
    minWidth: "160px"
  });

  // Daftar channel
  streams.forEach((s) => {
    const item = document.createElement("div");
    item.innerText = s.title;
    Object.assign(item.style, {
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: "13px",
      color: "#FFD54F",
      textAlign: "center"
    });
    item.onmouseover = () => (item.style.background = "#333");
    item.onmouseout = () => (item.style.background = "transparent");
    item.onclick = () => {
      player.load([{ file: s.file, title: s.title }]);
      player.play();
      dropdown.style.display = "none";
    };
    dropdown.appendChild(item);
  });

  // Tombol reload
  const reloadItem = document.createElement("div");
  reloadItem.innerText = "🔄 RELOAD CHANNEL";
  Object.assign(reloadItem.style, {
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "11px",
    color: "#00E676",
    borderTop: "1px solid rgba(255,255,255,0.2)",
    textAlign: "center"
  });
  reloadItem.onmouseover = () => (reloadItem.style.background = "#333");
  reloadItem.onmouseout = () => (reloadItem.style.background = "transparent");
  reloadItem.onclick = () => location.reload();
  dropdown.appendChild(reloadItem);

  // Event buka/tutup dropdown
  button.onclick = () => {
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
  };

  document.addEventListener("click", (e) => {
    if (!button.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });

  // Tambahkan ke player
  container.appendChild(button);
  container.appendChild(dropdown);
}
