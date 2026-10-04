const API_BASE =
  "https://anonview.novendibagus5.workers.dev";


let currentPlatform = "instagram";
let currentUsername = "";
let currentProfile = null;
let currentList = [];


// =========================================================
// PLATFORM
// =========================================================

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


// =========================================================
// RESET
// =========================================================

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


// =========================================================
// CLEAN USERNAME
// =========================================================

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


// =========================================================
// SEARCH PROFILE
// =========================================================

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


  if(!username){

    showMessage(
      "Invalid username.",
      true
    );

    return;

  }


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
        data && (
          data.message ||
          data.error
        )
          ? (
              data.message ||
              data.error
            )
          : "Profile not found."
      );

    }


    currentProfile =
      data.data || data;


    renderProfile(
      currentProfile
    );


    /*
     * STORIES FIRST
     */

    await openContent(
      "stories"
    );


  }catch(error){

    showMessage(
      error.message ||
      "Failed to load profile.",
      true
    );

  }

}


// =========================================================
// API REQUEST
// =========================================================

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
        method: "GET",
        cache: "no-store"
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
        data.message ||
        data.error
      )
        ? (
            data.message ||
            data.error
          )
        : "API error " +
          response.status
    );

  }


  return data;

}


// =========================================================
// RENDER PROFILE
// =========================================================

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
    profile.profile_pic_url_hd ||
    "";


  const avatarElement =
    document.getElementById(
      "avAvatar"
    );


  avatarElement.src =
    avatar;


  avatarElement.onerror =
    function(){

      this.removeAttribute(
        "src"
      );

    };


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
    profile.fullName ||
    profile.name ||
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


// =========================================================
// STATS
// =========================================================

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
    profile.post_count ??
    profile.media_count ??
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


// =========================================================
// ADD STAT
// =========================================================

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
    escapeHtml(label) +
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


// =========================================================
// OPEN CONTENT
// =========================================================

async function openContent(
  type
){

  if(!currentUsername){

    return;

  }


  /*
   * ACTIVE TAB
   */

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


  /*
   * CONTENT
   */

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


// =========================================================
// NORMALIZE ITEMS
// =========================================================

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
    Array.isArray(
      data.data
    )
  ){

    return data.data;

  }


  if(
    data &&
    Array.isArray(
      data.items
    )
  ){

    return data.items;

  }


  if(
    data &&
    Array.isArray(
      data.results
    )
  ){

    return data.results;

  }


  if(
    data &&
    Array.isArray(
      data.list
    )
  ){

    return data.list;

  }


  return [];

}


// =========================================================
// RENDER GRID
// =========================================================

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

      /*
       * URL
       */

      const url =
        item.url ||
        item.video_url ||
        item.play_url ||
        item.playUrl ||
        item.media_url ||
        item.mediaUrl ||
        item.download_url ||
        item.downloadUrl ||
        "";


      /*
       * THUMBNAIL
       */

      const thumbnail =
        item.thumbnail ||
        item.cover ||
        item.cover_url ||
        item.coverUrl ||
        item.image_url ||
        item.imageUrl ||
        item.thumbnail_url ||
        item.thumbnailUrl ||
        "";


      /*
       * MEDIA TYPE
       */

      const mediaType =
        (
          item.type ||
          item.media_type ||
          item.mediaType ||
          ""
        )
        .toString()
        .toLowerCase();


      const isVideo =
        mediaType === "video" ||
        mediaType === "2" ||
        !!item.video_url ||
        !!item.videoUrl ||
        !!item.play_url ||
        !!item.playUrl;


      /*
       * ITEM
       */

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "av-item";


      /*
       * MEDIA IMAGE
       */

      if(thumbnail){

        const img =
          document.createElement(
            "img"
          );


        img.src =
          thumbnail;


        img.loading =
          "lazy";


        img.alt =
          "";


        img.onerror =
          function(){

            this.style.display =
              "none";

          };


        div.appendChild(
          img
        );

      }


      /*
       * VIDEO BADGE
       */

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


      /*
       * INFORMATION
       */

      const info =
        document.createElement(
          "div"
        );


      info.className =
        "av-item-info";


      /*
       * TIME
       */

      const time =
        getItemTime(
          item
        );


      if(time){

        const timeBox =
          document.createElement(
            "div"
          );


        timeBox.className =
          "av-item-time";


        timeBox.textContent =
          time;


        info.appendChild(
          timeBox
        );

      }


      /*
       * MENTIONS / TAGS
       */

      const mentions =
        getItemMentions(
          item
        );


      if(mentions.length){

        const mentionBox =
          document.createElement(
            "div"
          );


        mentionBox.className =
          "av-item-mentions";


        mentionBox.innerHTML =
          "<span>Tagged:</span> " +
          mentions
            .map(
              function(name){

                return (
                  "@" +
                  escapeHtml(
                    name.replace(
                      /^@/,
                      ""
                    )
                  )
                );

              }
            )
            .join(
              ", "
            );


        info.appendChild(
          mentionBox
        );

      }


      /*
       * ADD INFO
       */

      if(
        info.children.length
      ){

        div.appendChild(
          info
        );

      }


      /*
       * CLICK
       */

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


// =========================================================
// GET ITEM TIME
// =========================================================

function getItemTime(
  item
){

  /*
   * Possible timestamp fields
   */

  const raw =
    item.takenAt ??
    item.taken_at ??
    item.timestamp ??
    item.created_at ??
    item.createdAt ??
    item.create_time ??
    item.createTime ??
    item.uploaded_at ??
    item.uploadedAt ??
    item.published_at ??
    item.publishedAt ??
    item.posted_at ??
    item.postedAt ??
    item.time ??
    item.date ??
    item.updated_at ??
    item.updatedAt ??
    null;


  if(
    raw === null ||
    raw === undefined ||
    raw === ""
  ){

    return "";

  }


  /*
   * Number timestamp
   */

  let timestamp =
    Number(raw);


  /*
   * Date string
   */

  if(
    !Number.isFinite(
      timestamp
    )
  ){

    const parsed =
      new Date(
        raw
      );


    if(
      Number.isNaN(
        parsed.getTime()
      )
    ){

      return "";

    }


    timestamp =
      parsed.getTime();

  }else{

    /*
     * Seconds -> milliseconds
     */

    if(
      timestamp < 100000000000
    ){

      timestamp *= 1000;

    }

  }


  const date =
    new Date(
      timestamp
    );


  if(
    Number.isNaN(
      date.getTime()
    )
  ){

    return "";

  }


  return date.toLocaleString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


// =========================================================
// GET MENTIONS / TAGS
// =========================================================

function getItemMentions(
  item
){

  let users = [];


  /*
   * Worker normalized format
   */

  if(
    Array.isArray(
      item.mentions
    )
  ){

    users =
      users.concat(
        item.mentions
      );

  }


  /*
   * Instagram raw
   */

  if(
    Array.isArray(
      item.mentioned_users
    )
  ){

    users =
      users.concat(
        item.mentioned_users
      );

  }


  /*
   * Other formats
   */

  if(
    Array.isArray(
      item.mentionedUsers
    )
  ){

    users =
      users.concat(
        item.mentionedUsers
      );

  }


  if(
    Array.isArray(
      item.tagged_users
    )
  ){

    users =
      users.concat(
        item.tagged_users
      );

  }


  if(
    Array.isArray(
      item.taggedUsers
    )
  ){

    users =
      users.concat(
        item.taggedUsers
      );

  }


  if(
    Array.isArray(
      item.tags
    )
  ){

    users =
      users.concat(
        item.tags
      );

  }


  if(
    Array.isArray(
      item.mentions_users
    )
  ){

    users =
      users.concat(
        item.mentions_users
      );

  }


  /*
   * Convert objects
   */

  users =
    users
      .map(
        function(user){

          /*
           * String
           */

          if(
            typeof user === "string"
          ){

            return user;

          }


          /*
           * Object
           */

          if(
            !user ||
            typeof user !== "object"
          ){

            return "";

          }


          return (
            user.username ||
            user.unique_id ||
            user.uniqueId ||
            user.handle ||
            user.nickname ||
            user.name ||
            ""
          );

        }
      )
      .map(
        function(name){

          return String(
            name || ""
          )
          .trim()
          .replace(
            /^@/,
            ""
          );

        }
      )
      .filter(
        function(name){

          return !!name;

        }
      );


  /*
   * Remove duplicate
   */

  return [
    ...new Set(
      users
    )
  ];

}


// =========================================================
// OPEN ITEM
// =========================================================

function openItem(
  item,
  url,
  isVideo
){

  if(!url){

    /*
     * For image-only item, try image
     */

    url =
      item.image_url ||
      item.imageUrl ||
      item.url ||
      "";

  }


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


    video.setAttribute(
      "playsinline",
      ""
    );


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


    img.alt =
      "";


    inner.appendChild(
      img
    );

  }


  viewer.style.display =
    "flex";

}


// =========================================================
// CLOSE VIEWER
// =========================================================

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


// =========================================================
// OPEN USER LIST
// =========================================================

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


// =========================================================
// RENDER USER LIST
// =========================================================

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
        user.uniqueId ||
        user.handle ||
        "";


      const display =
        user.display_name ||
        user.displayName ||
        user.nickname ||
        user.full_name ||
        user.fullName ||
        "";


      const avatar =
        user.avatar ||
        user.avatar_url ||
        user.profile_pic ||
        user.profile_pic_url ||
        user.profilePic ||
        "";


      /*
       * Skip invalid user
       */

      if(!username){

        return;

      }


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
        escapeAttr(
          avatar
        ) +
        '" alt=""/>' +

        '<div>' +

        '<div class="av-user-name">' +
        escapeHtml(
          "@" +
          username
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


// =========================================================
// FILTER USER LIST
// =========================================================

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


// =========================================================
// OPEN USER
// =========================================================

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


  document.getElementById(
    "avBack"
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


    if(
      !data ||
      data.success === false
    ){

      throw new Error(
        data && (
          data.message ||
          data.error
        )
          ? (
              data.message ||
              data.error
            )
          : "Profile not found."
      );

    }


    currentProfile =
      data.data || data;


    renderProfile(
      currentProfile
    );


    /*
     * STORIES FIRST
     */

    await openContent(
      "stories"
    );


  }catch(error){

    showMessage(
      error.message ||
      "Failed to load profile.",
      true
    );

  }

}


// =========================================================
// BACK TO PROFILE
// =========================================================

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


  /*
   * Keep current tab/content
   */

}


// =========================================================
// MESSAGE
// =========================================================

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


// =========================================================
// CAPITALIZE
// =========================================================

function capitalize(
  value
){

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );

}


// =========================================================
// FORMAT NUMBER
// =========================================================

function formatNumber(
  value
){

  const n =
    Number(value);


  if(
    !Number.isFinite(n)
  ){

    return value || "0";

  }


  if(
    n >= 1000000000
  ){

    return (
      n / 1000000000
    ).toFixed(1) +
    "B";

  }


  if(
    n >= 1000000
  ){

    return (
      n / 1000000
    ).toFixed(1) +
    "M";

  }


  if(
    n >= 1000
  ){

    return (
      n / 1000
    ).toFixed(1) +
    "K";

  }


  return n.toLocaleString(
    "id-ID"
  );

}


// =========================================================
// ESCAPE HTML
// =========================================================

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


// =========================================================
// ESCAPE ATTRIBUTE
// =========================================================

function escapeAttr(
  value
){

  return escapeHtml(
    value
  );

}


// =========================================================
// SEARCH ENTER
// =========================================================

document
  .getElementById(
    "avSearch"
  )
  .addEventListener(
    "keydown",
    function(e){

      if(
        e.key === "Enter"
      ){

        searchProfile();

      }

    }
  );


// =========================================================
// VIEWER CLICK
// =========================================================

document
  .getElementById(
    "avViewer"
  )
  .addEventListener(
    "click",
    function(e){

      if(
        e.target === this
      ){

        closeViewer();

      }

    }
  );
