


  const API_BASE =
    "https://anonview.novendibagus5.workers.dev";


  let currentPlatform = "instagram";
  let currentUsername = "";
  let currentProfile = null;
  let currentList = [];


  function setPlatform(platform){

    currentPlatform = platform;

    document
      .getElementById("platformInstagram")
      .classList.toggle(
        "active",
        platform === "instagram"
      );

    document
      .getElementById("platformTiktok")
      .classList.toggle(
        "active",
        platform === "tiktok"
      );

    document.getElementById(
      "avSearch"
    ).value = "";

    resetView();

  }


  function resetView(){

    document.getElementById(
      "avProfile"
    ).style.display = "none";

    document.getElementById(
      "avUserList"
    ).style.display = "none";

    document.getElementById(
      "avBack"
    ).style.display = "none";

    document.getElementById(
      "avMessage"
    ).style.display = "block";

    document.getElementById(
      "avMessage"
    ).className = "av-message";

    document.getElementById(
      "avMessage"
    ).textContent =
      "Enter a username to start.";

  }


  function cleanUsername(value){

    value =
      value
        .replace(
          /^https?:\/\/(www\.)?/i,
          ""
        )
        .replace(
          /^(instagram\.com|tiktok\.com)\//i,
          ""
        )
        .replace(
          /^@/,
          ""
        )
        .split(/[/?#]/)[0];

    return value.trim();

  }


  async function searchProfile(){

    let username =
      document
        .getElementById("avSearch")
        .value
        .trim();

    if(!username){

      showMessage(
        "Please enter a username.",
        true
      );

      return;

    }

    username =
      cleanUsername(username);

    currentUsername =
      username;

    showMessage(
      "Loading profile..."
    );


    try{

      const data =
        await apiRequest(
          "profile",
          username
        );


      if(
        !data ||
        data.success === false
      ){

        throw new Error(
          data && data.error
            ? data.error
            : "Profile not found."
        );

      }


      currentProfile =
        data.data || data;


      renderProfile(
        currentProfile
      );


      await openContent(
        "posts"
      );


    }catch(error){

      showMessage(
        error.message ||
        "Failed to load profile.",
        true
      );

    }

  }


  async function apiRequest(
    action,
    username
  ){

    const url =
      API_BASE +
      "/api/" +
      currentPlatform +
      "/" +
      action +
      "?username=" +
      encodeURIComponent(
        username
      );


    const response =
      await fetch(
        url,
        {
          method:"GET",
          cache:"no-store"
        }
      );


    let data;


    try{

      data =
        await response.json();

    }catch(e){

      throw new Error(
        "Invalid API response."
      );

    }


    if(!response.ok){

      throw new Error(
        data &&
        (
          data.error ||
          data.message
        )
          ? (
              data.error ||
              data.message
            )
          : "API error " +
            response.status
      );

    }


    return data;

  }


  function renderProfile(
    profile
  ){

    document.getElementById(
      "avMessage"
    ).style.display = "none";


    document.getElementById(
      "avProfile"
    ).style.display = "block";


    document.getElementById(
      "avUserList"
    ).style.display = "none";


    document.getElementById(
      "avBack"
    ).style.display = "none";


    const avatar =
      profile.avatar ||
      profile.avatar_url ||
      profile.profile_pic ||
      profile.profile_pic_url ||
      profile.hd_profile_pic_url ||
      "";


    document.getElementById(
      "avAvatar"
    ).src =
      avatar;


    document.getElementById(
      "avUsername"
    ).textContent =
      "@" +
      (
        profile.username ||
        profile.unique_id ||
        currentUsername
      );


    document.getElementById(
      "avDisplay"
    ).textContent =
      profile.display_name ||
      profile.nickname ||
      profile.full_name ||
      "";


    document.getElementById(
      "avBio"
    ).textContent =
      profile.bio ||
      profile.biography ||
      profile.signature ||
      "";


    renderStats(
      profile
    );

  }


  function renderStats(
    profile
  ){

    const box =
      document.getElementById(
        "avStats"
      );


    box.innerHTML = "";


    const stats =
      profile.stats || {};


    const followers =
      profile.followers ??
      profile.follower_count ??
      stats.followers ??
      0;


    const following =
      profile.following ??
      profile.following_count ??
      stats.following ??
      0;


    const posts =
      profile.posts ??
      profile.video_count ??
      stats.posts ??
      0;


    const likes =
      profile.likes ??
      profile.total_likes ??
      stats.likes ??
      0;


    addStat(
      box,
      "Followers",
      followers,
      currentPlatform === "tiktok",
      "followers"
    );


    addStat(
      box,
      "Following",
      following,
      currentPlatform === "tiktok",
      "following"
    );


    addStat(
      box,
      "Posts",
      posts,
      false,
      ""
    );


    addStat(
      box,
      "Likes",
      likes,
      false,
      ""
    );

  }


  function addStat(
    box,
    label,
    value,
    clickable,
    action
  ){

    const div =
      document.createElement(
        "div"
      );


    div.className =
      "av-stat" +
      (
        clickable
          ? " clickable"
          : ""
      );


    div.innerHTML =
      "<strong>" +
      formatNumber(value) +
      "</strong>" +
      "<span>" +
      label +
      "</span>";


    if(clickable){

      div.onclick =
        function(){

          openUserList(
            action
          );

        };

    }


    box.appendChild(
      div
    );

  }


  async function openContent(
    type
  ){

    if(!currentUsername){

      return;

    }


    document
      .querySelectorAll(
        ".av-nav button"
      )
      .forEach(
        function(btn){

          btn.classList.remove(
            "active"
          );

        }
      );


    const nav =
      document.getElementById(
        "nav" +
        capitalize(type)
      );


    if(nav){

      nav.classList.add(
        "active"
      );

    }


    const content =
      document.getElementById(
        "avContent"
      );


    content.innerHTML =
      '<div class="av-message">' +
      'Loading ' +
      escapeHtml(type) +
      '...' +
      '</div>';


    try{

      const data =
        await apiRequest(
          type,
          currentUsername
        );


      const items =
        normalizeItems(
          data
        );


      renderGrid(
        items
      );


    }catch(error){

      content.innerHTML =
        '<div class="av-message error">' +
        escapeHtml(
          error.message ||
          "Failed to load content."
        ) +
        '</div>';

    }

  }


  function normalizeItems(
    data
  ){

    if(
      Array.isArray(data)
    ){

      return data;

    }


    if(
      data &&
      Array.isArray(data.data)
    ){

      return data.data;

    }


    if(
      data &&
      Array.isArray(data.items)
    ){

      return data.items;

    }


    if(
      data &&
      Array.isArray(data.results)
    ){

      return data.results;

    }


    return [];

  }


  function renderGrid(
    items
  ){

    const content =
      document.getElementById(
        "avContent"
      );


    if(!items.length){

      content.innerHTML =
        '<div class="av-message">' +
        'No content available.' +
        '</div>';

      return;

    }


    const grid =
      document.createElement(
        "div"
      );


    grid.className =
      "av-grid";


    items.forEach(
      function(item){

        const url =
          item.url ||
          item.video_url ||
          item.play_url ||
          item.media_url ||
          item.download_url ||
          "";


        const thumbnail =
          item.thumbnail ||
          item.cover ||
          item.cover_url ||
          item.image_url ||
          item.thumbnail_url ||
          "";


        const mediaType =
          (
            item.type ||
            item.media_type ||
            ""
          )
          .toString()
          .toLowerCase();


        const isVideo =
          mediaType === "video" ||
          !!item.video_url ||
          !!item.play_url;


        const div =
          document.createElement(
            "div"
          );


        div.className =
          "av-item";


        if(thumbnail){

          const img =
            document.createElement(
              "img"
            );


          img.src =
            thumbnail;


          img.loading =
            "lazy";


          img.onerror =
            function(){

              this.style.display =
                "none";

            };


          div.appendChild(
            img
          );

        }


        if(isVideo){

          const badge =
            document.createElement(
              "div"
            );


          badge.className =
            "av-item-type";


          badge.textContent =
            "VIDEO";


          div.appendChild(
            badge
          );

        }


        div.onclick =
          function(){

            openItem(
              item,
              url,
              isVideo
            );

          };


        grid.appendChild(
          div
        );

      }
    );


    content.innerHTML =
      "";


    content.appendChild(
      grid
    );

  }


  function openItem(
    item,
    url,
    isVideo
  ){

    if(!url){

      return;

    }


    const viewer =
      document.getElementById(
        "avViewer"
      );


    const inner =
      document.getElementById(
        "avViewerInner"
      );


    inner.innerHTML =
      "";


    if(isVideo){

      const video =
        document.createElement(
          "video"
        );


      video.src =
        url;


      video.controls =
        true;


      video.autoplay =
        true;


      video.playsInline =
        true;


      inner.appendChild(
        video
      );

    }else{

      const img =
        document.createElement(
          "img"
        );


      img.src =
        url;


      inner.appendChild(
        img
      );

    }


    viewer.style.display =
      "flex";

  }


  function closeViewer(){

    const viewer =
      document.getElementById(
        "avViewer"
      );


    const inner =
      document.getElementById(
        "avViewerInner"
      );


    viewer.style.display =
      "none";


    inner.innerHTML =
      "";

  }


  async function openUserList(
    type
  ){

    document.getElementById(
      "avProfile"
    ).style.display =
      "none";


    document.getElementById(
      "avUserList"
    ).style.display =
      "block";


    document.getElementById(
      "avBack"
    ).style.display =
      "block";


    const users =
      document.getElementById(
        "avUsers"
      );


    users.innerHTML =
      '<div class="av-message">' +
      'Loading ' +
      escapeHtml(type) +
      '...' +
      '</div>';


    try{

      const data =
        await apiRequest(
          type,
          currentUsername
        );


      currentList =
        normalizeItems(
          data
        );


      renderUserList(
        currentList
      );


    }catch(error){

      users.innerHTML =
        '<div class="av-message error">' +
        escapeHtml(
          error.message ||
          "Failed to load users."
        ) +
        '</div>';

    }

  }


  function renderUserList(
    users
  ){

    const box =
      document.getElementById(
        "avUsers"
      );


    box.innerHTML =
      "";


    if(!users.length){

      box.innerHTML =
        '<div class="av-message">' +
        'No users available.' +
        '</div>';

      return;

    }


    users.forEach(
      function(user){

        const username =
          user.username ||
          user.unique_id ||
          user.handle ||
          "";


        const display =
          user.display_name ||
          user.nickname ||
          user.full_name ||
          "";


        const avatar =
          user.avatar ||
          user.avatar_url ||
          user.profile_pic ||
          user.profile_pic_url ||
          "";


        const row =
          document.createElement(
            "div"
          );


        row.className =
          "av-user";


        row.dataset.username =
          username.toLowerCase();


        row.innerHTML =
          '<img src="' +
          escapeAttr(avatar) +
          '" alt=""/>' +

          '<div>' +

          '<div class="av-user-name">' +
          escapeHtml(
            "@" + username
          ) +
          '</div>' +

          '<div class="av-user-display">' +
          escapeHtml(
            display
          ) +
          '</div>' +

          '</div>';


        row.onclick =
          function(){

            openUser(
              username
            );

          };


        box.appendChild(
          row
        );

      }
    );

  }


  function filterList(){

    const query =
      document
        .getElementById(
          "avUserSearch"
        )
        .value
        .toLowerCase()
        .trim();


    document
      .querySelectorAll(
        ".av-user"
      )
      .forEach(
        function(row){

          row.style.display =
            !query ||
            row.dataset.username.indexOf(
              query
            ) !== -1
              ? "flex"
              : "none";

        }
      );

  }


  async function openUser(
    username
  ){

    document.getElementById(
      "avSearch"
    ).value =
      username;


    currentUsername =
      username;


    document.getElementById(
      "avUserList"
    ).style.display =
      "none";


    showMessage(
      "Loading profile..."
    );


    try{

      const data =
        await apiRequest(
          "profile",
          username
        );


      currentProfile =
        data.data || data;


      renderProfile(
        currentProfile
      );


      await openContent(
        "posts"
      );


    }catch(error){

      showMessage(
        error.message ||
        "Failed to load profile.",
        true
      );

    }

  }


  function backProfile(){

    document.getElementById(
      "avUserList"
    ).style.display =
      "none";


    document.getElementById(
      "avBack"
    ).style.display =
      "none";


    document.getElementById(
      "avProfile"
    ).style.display =
      "block";

  }


  function showMessage(
    message,
    error
  ){

    const box =
      document.getElementById(
        "avMessage"
      );


    box.style.display =
      "block";


    box.className =
      "av-message" +
      (
        error
          ? " error"
          : ""
      );


    box.textContent =
      message;

  }


  function capitalize(
    value
  ){

    return value.charAt(0).toUpperCase() +
      value.slice(1);

  }


  function formatNumber(
    value
  ){

    const n =
      Number(value);


    if(!Number.isFinite(n)){

      return value || "0";

    }


    if(n >= 1000000000){

      return (
        n / 1000000000
      ).toFixed(1) +
      "B";

    }


    if(n >= 1000000){

      return (
        n / 1000000
      ).toFixed(1) +
      "M";

    }


    if(n >= 1000){

      return (
        n / 1000
      ).toFixed(1) +
      "K";

    }


    return n.toLocaleString();

  }


  function escapeHtml(
    value
  ){

    return String(
      value == null
        ? ""
        : value
    )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

  }


  function escapeAttr(
    value
  ){

    return escapeHtml(
      value
    );

  }


  document
    .getElementById(
      "avSearch"
    )
    .addEventListener(
      "keydown",
      function(e){

        if(e.key === "Enter"){

          searchProfile();

        }

      }
    );


  document
    .getElementById(
      "avViewer"
    )
    .addEventListener(
      "click",
      function(e){

        if(e.target === this){

          closeViewer();

        }

      }
    );

