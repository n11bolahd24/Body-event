/*!
 * Anonymous TikTok + Instagram Viewer
 * N11BOLAHD
 * JS + CSS SINGLE FILE
 * API: Cloudflare Worker
 */

(function () {

    "use strict";

    console.log(
        "%c[ANON VIEWER] START",
        "color:#00d979;font-weight:bold"
    );


    /* =========================================================
       CONFIG
    ========================================================= */

    const API_BASE =
        "https://anonview.novendibagus5.workers.dev";


    /* =========================================================
       STATE
    ========================================================= */

    let currentPlatform = "instagram";
    let currentUsername = "";
    let currentProfile = null;

    let currentList = [];
    let currentListType = "";
    let currentListTitle = "";

    let currentItems = [];
    let currentItemIndex = 0;

    let initialized = false;


    /* =========================================================
       CSS
    ========================================================= */

    const styleId = "anonymous-viewer-js-style";

    if (!document.getElementById(styleId)) {

        const style =
            document.createElement("style");

        style.id = styleId;

        style.textContent = `

/* =========================================================
   ANONYMOUS VIEWER
========================================================= */

#anonymousViewer,
#avApp {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    box-sizing: border-box;
}

#anonymousViewer *,
#avApp * {
    box-sizing: border-box;
}


/* =========================================================
   PROFILE
========================================================= */

#avProfile {
    display: none;
}

#avProfile .av-profile-card {
    background: #111;
    border: 1px solid #222;
    border-radius: 10px;
    padding: 18px;
    margin-bottom: 15px;
}

#avProfile .av-profile-top {
    display: flex;
    align-items: flex-start;
    gap: 15px;
}

#avProfile .av-avatar {
    width: 82px;
    height: 82px;
    min-width: 82px;
    border-radius: 50%;
    object-fit: cover;
    background: #222;
    border: 2px solid #333;
}

#avProfile .av-profile-info {
    flex: 1;
    min-width: 0;
}

#avProfile .av-username {
    color: #fff;
    font-size: 17px;
    font-weight: bold;
    word-break: break-word;
}

#avProfile .av-display {
    margin-top: 3px;
    color: #aaa;
    font-size: 13px;
}

#avProfile .av-bio {
    margin-top: 9px;
    color: #ccc;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
}


/* =========================================================
   STATS
========================================================= */

#avProfile .av-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 15px;
}

#avProfile .av-stat {
    color: #aaa;
    font-size: 12px;
}

#avProfile .av-stat strong {
    display: block;
    color: #fff;
    font-size: 14px;
}

#avProfile .av-stat.clickable {
    cursor: pointer;
}

#avProfile .av-stat.clickable:hover strong {
    color: #00d979;
}


/* =========================================================
   NAVIGATION
========================================================= */

#avNav {
    display: flex;
    gap: 5px;
    overflow-x: auto;
    margin-bottom: 15px;
    background: #101010;
    padding: 5px;
    border-radius: 9px;
    scrollbar-width: none;
}

#avNav::-webkit-scrollbar {
    display: none;
}

#avNav button {
    flex: 1 0 auto;
    border: 0;
    background: transparent;
    color: #777;
    padding: 10px 13px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
}

#avNav button:hover {
    color: #fff;
}

#avNav button.active {
    background: #202020;
    color: #00d979;
    font-weight: bold;
}


/* =========================================================
   LOADING / ERROR / EMPTY
========================================================= */

.av-loading,
.av-error,
.av-empty {
    width: 100%;
    padding: 35px 15px;
    text-align: center;
    font-size: 13px;
}

.av-loading,
.av-empty {
    color: #999;
}

.av-error {
    color: #ff5577;
}


/* =========================================================
   GRID
========================================================= */

.av-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    width: 100%;
}

.av-item {
    position: relative;
    min-width: 0;
    overflow: hidden;
    background: #111;
    border: 1px solid #222;
    border-radius: 6px;
    cursor: pointer;
}

.av-item:hover {
    border-color: #00d979;
}

.av-item-image {
    display: block;
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    background: #181818;
}


/* =========================================================
   VIDEO BADGE
========================================================= */

.av-video-badge {
    position: absolute;
    top: 7px;
    right: 7px;
    z-index: 3;
    padding: 3px 6px;
    border-radius: 4px;
    background: rgba(0,0,0,.75);
    color: #fff;
    font-size: 9px;
    font-weight: bold;
}


/* =========================================================
   STORY INFO
========================================================= */

.av-item-info {
    display: block !important;
    width: 100%;
    padding: 8px 10px 10px;
    background: #111;
    text-align: left;
}

.av-item-time {
    display: block !important;
    color: #aaa;
    font-size: 11px;
    line-height: 16px;
}

.av-item-mentions {
    display: block !important;
    margin-top: 3px;
    color: #aaa;
    font-size: 11px;
    line-height: 16px;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.av-tag-user {
    color: #00d979 !important;
}


/* =========================================================
   USER LIST
========================================================= */

.av-list-search {
    width: 100%;
    height: 40px;
    margin-bottom: 10px;
    padding: 0 12px;
    background: #111;
    border: 1px solid #333;
    border-radius: 7px;
    color: #fff;
    outline: none;
}

.av-list-search:focus {
    border-color: #00d979;
}

.av-user-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.av-user {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px;
    background: #111;
    border: 1px solid #222;
    border-radius: 6px;
    cursor: pointer;
}

.av-user:hover {
    border-color: #00d979;
}

.av-user-avatar {
    width: 42px;
    height: 42px;
    min-width: 42px;
    border-radius: 50%;
    object-fit: cover;
    background: #222;
}

.av-user-info {
    min-width: 0;
}

.av-user-username {
    color: #fff;
    font-size: 13px;
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.av-user-name {
    margin-top: 3px;
    color: #888;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}


/* =========================================================
   BACK
========================================================= */

#avBack {
    display: none;
    margin-bottom: 12px;
}

#avBack button {
    border: 1px solid #333;
    background: #111;
    color: #aaa;
    padding: 8px 13px;
    border-radius: 7px;
    cursor: pointer;
}

#avBack button:hover {
    color: #00d979;
    border-color: #00d979;
}


/* =========================================================
   VIEWER
========================================================= */

#avViewer {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 999999;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,.96);
    padding: 20px;
}

#avViewer.active {
    display: flex;
}

#avViewerInner {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.av-viewer-media {
    max-width: 100%;
    max-height: 92vh;
    object-fit: contain;
}

.av-viewer-close,
.av-viewer-prev,
.av-viewer-next {
    position: fixed;
    z-index: 100000;
    border: 0;
    border-radius: 50%;
    background: rgba(0,0,0,.75);
    color: #fff;
    cursor: pointer;
}

.av-viewer-close {
    top: 15px;
    right: 18px;
    width: 40px;
    height: 40px;
    font-size: 22px;
}

.av-viewer-prev,
.av-viewer-next {
    top: 50%;
    transform: translateY(-50%);
    width: 42px;
    height: 42px;
    font-size: 20px;
}

.av-viewer-prev {
    left: 15px;
}

.av-viewer-next {
    right: 15px;
}

.av-viewer-close:hover,
.av-viewer-prev:hover,
.av-viewer-next:hover {
    background: #00d979;
    color: #000;
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width:600px) {

    .av-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 4px;
    }

    #avProfile .av-profile-card {
        padding: 14px;
    }

    #avProfile .av-avatar {
        width: 68px;
        height: 68px;
        min-width: 68px;
    }

    #avProfile .av-stats {
        gap: 12px;
    }

    .av-item-info {
        padding: 7px 8px 9px;
    }

    .av-item-time,
    .av-item-mentions {
        font-size: 10px;
        line-height: 15px;
    }

    .av-viewer-prev {
        left: 7px;
    }

    .av-viewer-next {
        right: 7px;
    }

}

`;

        document.head.appendChild(style);

    }


    /* =========================================================
       ELEMENT
    ========================================================= */

    function el(id) {

        return document.getElementById(id);

    }


    /* =========================================================
       API
    ========================================================= */

    async function apiRequest(action, username) {

        const url =
            API_BASE +
            "/api/" +
            currentPlatform +
            "/" +
            action +
            "?username=" +
            encodeURIComponent(username);

        console.log(
            "%c[ANON VIEWER API]",
            "color:#00d979;font-weight:bold",
            currentPlatform,
            action,
            username
        );

        const response =
            await fetch(url, {
                method: "GET",
                cache: "no-store"
            });

        let data;

        try {

            data =
                await response.json();

        } catch (error) {

            throw new Error(
                "Invalid API response"
            );

        }

        if (!response.ok) {

            throw new Error(
                data?.error ||
                data?.message ||
                "API error " +
                response.status
            );

        }

        if (data?.success === false) {

            throw new Error(
                data?.error ||
                data?.message ||
                "Request failed"
            );

        }

        return data;

    }


    /* =========================================================
       SEARCH
    ========================================================= */

    async function searchProfile() {

        const input =
            el("avSearch");

        if (!input) {

            console.warn(
                "[ANON VIEWER] #avSearch not found"
            );

            return;

        }

        let username =
            input.value
                .trim()
                .replace(/^@+/, "");

        /*
         * Support:
         * username
         * @username
         * instagram.com/username
         * tiktok.com/@username
         */

        username =
            extractUsername(username);

        if (!username) {

            showMessage(
                "Enter a username to start."
            );

            return;

        }

        currentUsername =
            username;

        currentProfile =
            null;

        currentItems =
            [];

        showProfileArea();

        showLoading();

        try {

            const data =
                await apiRequest(
                    "profile",
                    username
                );

            currentProfile =
                data?.data ||
                data?.profile ||
                data;

            renderProfile(
                currentProfile
            );

            /*
             * STORIES FIRST
             */
            await openContent(
                "stories"
            );

        } catch (error) {

            console.error(
                "[ANON VIEWER]",
                error
            );

            showError(
                error?.message ||
                "Failed to load profile"
            );

        }

    }


    /* =========================================================
       EXTRACT USERNAME
    ========================================================= */

    function extractUsername(value) {

        let username =
            String(value || "")
                .trim();

        if (!username) {
            return "";
        }

        username =
            username.replace(
                /^https?:\/\//i,
                ""
            );

        username =
            username.replace(
                /^www\./i,
                ""
            );

        username =
            username.replace(
                /\/+$/,
                ""
            );

        if (
            username.includes("/")
        ) {

            const parts =
                username.split(
                    "/"
                ).filter(Boolean);

            if (
                parts.length >= 2
            ) {

                username =
                    parts[parts.length - 1];

            }

        }

        username =
            username.replace(
                /^@+/,
                ""
            );

        return username.trim();

    }


    /* =========================================================
       PLATFORM
    ========================================================= */

    function setPlatform(platform) {

        if (
            platform !== "instagram" &&
            platform !== "tiktok"
        ) {
            return;
        }

        currentPlatform =
            platform;

        const instagram =
            el("platformInstagram");

        const tiktok =
            el("platformTiktok");

        if (instagram) {

            instagram.classList.toggle(
                "active",
                platform === "instagram"
            );

        }

        if (tiktok) {

            tiktok.classList.toggle(
                "active",
                platform === "tiktok"
            );

        }

        const input =
            el("avSearch");

        if (input) {
            input.value = "";
        }

        resetView();

        console.log(
            "[ANON VIEWER] PLATFORM:",
            platform
        );

    }


    /* =========================================================
       RESET
    ========================================================= */

    function resetView() {

        currentUsername = "";
        currentProfile = null;
        currentList = [];
        currentListType = "";
        currentListTitle = "";
        currentItems = [];
        currentItemIndex = 0;

        const profile =
            el("avProfile");

        const content =
            el("avContent");

        const back =
            el("avBack");

        const message =
            el("avMessage");

        if (profile) {

            profile.style.display =
                "none";

        }

        if (content) {

            content.innerHTML =
                "";

        }

        if (back) {

            back.style.display =
                "none";

        }

        if (message) {

            message.style.display =
                "block";

            message.classList.remove(
                "error"
            );

            message.textContent =
                "Enter a username to start.";

        }

        /*
         * IMPORTANT:
         * Jangan hapus #avNav.
         * Karena HTML Theme sudah menyediakan nav.
         */

        restoreDefaultNavigation();

    }


    /* =========================================================
       SHOW PROFILE
    ========================================================= */

    function showProfileArea() {

        const profile =
            el("avProfile");

        const message =
            el("avMessage");

        const back =
            el("avBack");

        if (profile) {

            profile.style.display =
                "block";

        }

        if (message) {

            message.style.display =
                "none";

        }

        if (back) {

            back.style.display =
                "none";

        }

    }


    /* =========================================================
       PROFILE RENDER
    ========================================================= */

   function renderProfile(profile) {
  const profileBox = document.getElementById("avProfile");
  const card = document.getElementById("avProfileCard");

  if (!profileBox || !card) {
    console.error("[ANONVIEW] Profile container not found");
    return;
  }

  currentProfile = profile;

  const username =
    profile.username ||
    profile.userName ||
    profile.handle ||
    currentUsername;

  const displayName =
    profile.fullName ||
    profile.full_name ||
    profile.displayName ||
    profile.name ||
    username;

  const bio =
    profile.biography ||
    profile.bio ||
    profile.description ||
    "";

  const avatar =
    profile.profilePicUrl ||
    profile.profile_pic_url ||
    profile.avatar ||
    profile.avatarUrl ||
    profile.profilePicture ||
    "";

  /* =========================================================
     STATS
  ========================================================= */

  const followers =
    profile.followers ??
    profile.followerCount ??
    profile.followersCount ??
    profile.edge_followed_by ??
    profile.stats?.followers ??
    profile.statistics?.followers ??
    0;

  const following =
    profile.following ??
    profile.followingCount ??
    profile.followingsCount ??
    profile.edge_follow ??
    profile.stats?.following ??
    profile.statistics?.following ??
    0;

  const posts =
    profile.posts ??
    profile.postCount ??
    profile.postsCount ??
    profile.mediaCount ??
    profile.edge_owner_to_timeline_media ??
    profile.stats?.posts ??
    profile.statistics?.posts ??
    0;

  const likes =
    profile.likes ??
    profile.likeCount ??
    profile.likesCount ??
    profile.stats?.likes ??
    profile.statistics?.likes ??
    0;

  /* =========================================================
     PROFILE CARD
  ========================================================= */

  card.innerHTML = `
    <div class="av-profile-top">

      <img
        class="av-profile-avatar"
        src="${escapeAttr(avatar)}"
        alt="${escapeAttr(username)}"
        onerror="this.style.display='none'"
      />

      <div class="av-profile-info">

        <div class="av-profile-username">
          @${escapeHtml(username)}
        </div>

        <div class="av-profile-name">
          ${escapeHtml(displayName)}
        </div>

        ${
          bio
            ? `<div class="av-profile-bio">${escapeHtml(bio)}</div>`
            : ""
        }

      </div>

    </div>

    <div class="av-stats">

      <div class="av-stat">
        <strong>${formatNumber(posts)}</strong>
        <span>Posts</span>
      </div>

      <div class="av-stat">
        <strong>${formatNumber(followers)}</strong>
        <span>Followers</span>
      </div>

      <div class="av-stat">
        <strong>${formatNumber(following)}</strong>
        <span>Following</span>
      </div>

      ${
        currentPlatform === "tiktok"
          ? `
            <div class="av-stat">
              <strong>${formatNumber(likes)}</strong>
              <span>Likes</span>
            </div>
          `
          : ""
      }

    </div>
  `;

  profileBox.style.display = "block";

  /* =========================================================
     NAVIGATION
  ========================================================= */

  renderNavigation();

  console.log("[ANONVIEW] PROFILE:", profile);
  console.log("[ANONVIEW] STATS:", {
    posts,
    followers,
    following,
    likes
  });
}

    /* =========================================================
       CREATE STAT
    ========================================================= */

    function createStat(
        value,
        label,
        clickable,
        listType
    ) {

        const stat =
            document.createElement(
                "div"
            );

        stat.className =
            "av-stat";

        if (clickable) {

            stat.classList.add(
                "clickable"
            );

            stat.onclick =
                function () {

                    openUserList(
                        listType
                    );

                };

        }

        const strong =
            document.createElement(
                "strong"
            );

        strong.textContent =
            formatNumber(value);

        const span =
            document.createElement(
                "span"
            );

        span.textContent =
            label;

        stat.appendChild(
            strong
        );

        stat.appendChild(
            span
        );

        return stat;

    }


    /* =========================================================
       NAVIGATION
    ========================================================= */

    function renderNavigation() {

        const nav =
            el("avNav");

        if (!nav) return;

        nav.innerHTML =
            "";

        const tabs = [
            "stories",
            "posts",
            "reposts"
        ];

        if (
            currentPlatform ===
            "tiktok"
        ) {

            tabs.push(
                "followers",
                "following"
            );

        }

        tabs.forEach(
            function (type) {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "av-nav-btn";

                button.id =
                    "nav" +
                    capitalize(type);

                button.textContent =
                    capitalize(type);

                button.onclick =
                    function () {

                        openContent(
                            type
                        );

                    };

                nav.appendChild(
                    button
                );

            }
        );

    }


    /* =========================================================
       RESTORE DEFAULT NAV
    ========================================================= */

    function restoreDefaultNavigation() {

        const nav =
            el("avNav");

        if (!nav) return;

        /*
         * Saat reset, jangan membuat UI lain.
         * Hanya restore tombol navigation.
         */

        nav.innerHTML =
            "";

        const tabs = [
            "posts",
            "stories",
            "reposts"
        ];

        if (
            currentPlatform ===
            "tiktok"
        ) {

            tabs.push(
                "followers",
                "following"
            );

        }

        tabs.forEach(
            function (type) {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "av-nav-btn";

                button.id =
                    "nav" +
                    capitalize(type);

                button.textContent =
                    capitalize(type);

                button.onclick =
                    function () {

                        openContent(
                            type
                        );

                    };

                nav.appendChild(
                    button
                );

            }
        );

    }


    /* =========================================================
       OPEN CONTENT
    ========================================================= */

    async function openContent(type) {

        if (!currentUsername) {
            return;
        }

        const nav =
            el("avNav");

        if (nav) {

            nav.querySelectorAll(
                "button"
            ).forEach(
                function (button) {

                    button.classList.remove(
                        "active"
                    );

                }
            );

            const active =
                el(
                    "nav" +
                    capitalize(type)
                );

            if (active) {

                active.classList.add(
                    "active"
                );

            }

        }

        showLoading();

        try {

            const data =
                await apiRequest(
                    type,
                    currentUsername
                );

            const items =
                normalizeItems(data);

            currentItems =
                items;

            renderGrid(
                items
            );

        } catch (error) {

            console.error(
                "[ANON VIEWER]",
                error
            );

            showError(
                error?.message ||
                "Content unavailable"
            );

        }

    }


    /* =========================================================
       NORMALIZE API DATA
    ========================================================= */

    function normalizeItems(data) {

        if (!data) {
            return [];
        }

        if (
            Array.isArray(
                data.data
            )
        ) {
            return data.data;
        }

        if (
            Array.isArray(
                data.items
            )
        ) {
            return data.items;
        }

        if (
            Array.isArray(
                data.results
            )
        ) {
            return data.results;
        }

        if (
            Array.isArray(data)
        ) {
            return data;
        }

        return [];

    }


    /* =========================================================
       GET MEDIA URL
    ========================================================= */

    function getMediaUrl(item) {

        if (!item) {
            return "";
        }

        return (
            item.thumbnail ||
            item.thumbnail_url ||
            item.thumb ||
            item.cover_url ||
            item.cover ||
            item.image ||
            item.image_url ||
            item.display_url ||
            item.url ||
            item.video_url ||
            ""
        );

    }


    /* =========================================================
       GET VIDEO URL
    ========================================================= */

    function getVideoUrl(item) {

        if (!item) {
            return "";
        }

        return (
            item.url ||
            item.video_url ||
            item.video ||
            item.videoUrl ||
            ""
        );

    }


    /* =========================================================
       STORY TIME
    ========================================================= */

    function getItemTime(item) {

        if (!item) {
            return "";
        }

        let value =
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
            item.date;

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return "";
        }

        let timestamp;

        if (
            typeof value ===
            "number"
        ) {

            timestamp =
                value;

        } else {

            const numeric =
                Number(value);

            if (
                Number.isFinite(
                    numeric
                )
            ) {

                timestamp =
                    numeric;

            } else {

                const parsed =
                    new Date(value);

                if (
                    Number.isNaN(
                        parsed.getTime()
                    )
                ) {
                    return "";
                }

                timestamp =
                    parsed.getTime();

            }

        }

        /*
         * Seconds -> milliseconds
         */
        if (
            timestamp <
            100000000000
        ) {

            timestamp *= 1000;

        }

        const date =
            new Date(timestamp);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        /*
         * Format manually supaya hasilnya persis:
         *
         * 04 Okt 2026, 15.42
         */

        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Mei",
            "Jun",
            "Jul",
            "Agu",
            "Sep",
            "Okt",
            "Nov",
            "Des"
        ];

        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );

        const month =
            months[
                date.getMonth()
            ];

        const year =
            date.getFullYear();

        const hour =
            String(
                date.getHours()
            ).padStart(
                2,
                "0"
            );

        const minute =
            String(
                date.getMinutes()
            ).padStart(
                2,
                "0"
            );

        return (
            day +
            " " +
            month +
            " " +
            year +
            ", " +
            hour +
            "." +
            minute
        );

    }


    /* =========================================================
       GET MENTIONS
    ========================================================= */

    function getItemMentions(item) {

        if (!item) {
            return [];
        }

        let mentions =
            item.mentions ??
            item.mentioned_users ??
            item.mentionedUsers ??
            item.tagged_users ??
            item.taggedUsers ??
            item.tags ??
            [];

        if (
            !Array.isArray(
                mentions
            )
        ) {
            return [];
        }

        const result = [];

        mentions.forEach(
            function (user) {

                let username = "";

                if (
                    typeof user ===
                    "string"
                ) {

                    username =
                        user;

                } else if (
                    user &&
                    typeof user ===
                    "object"
                ) {

                    username =
                        user.username ??
                        user.unique_id ??
                        user.uniqueId ??
                        user.handle ??
                        user.nickname ??
                        user.name ??
                        "";

                }

                username =
                    String(
                        username
                    ).trim();

                username =
                    username.replace(
                        /^@+/,
                        ""
                    );

                if (!username) {
                    return;
                }

                if (
                    !result.includes(
                        username
                    )
                ) {

                    result.push(
                        username
                    );

                }

            }
        );

        return result;

    }


    /* =========================================================
       DETECT VIDEO
    ========================================================= */

    function isVideo(item) {

        if (!item) {
            return false;
        }

        const type =
            String(
                item.type ||
                item.media_type ||
                item.mediaType ||
                ""
            ).toLowerCase();

        return (
            type === "video" ||
            type === "2" ||
            Boolean(
                item.video_url
            ) ||
            Boolean(
                item.video
            ) ||
            Boolean(
                item.videoUrl
            )
        );

    }


    /* =========================================================
       RENDER GRID
    ========================================================= */

    function renderGrid(items) {

        const content =
            el("avContent");

        if (!content) {
            return;
        }

        content.innerHTML =
            "";

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            content.innerHTML = `
                <div class="av-empty">
                    No content found.
                </div>
            `;

            return;
        }

        const grid =
            document.createElement(
                "div"
            );

        grid.className =
            "av-grid";

        items.forEach(
            function (item, index) {

                if (
                    !item ||
                    typeof item !==
                    "object"
                ) {
                    return;
                }

                const media =
                    getMediaUrl(item);

                if (!media) {
                    return;
                }

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "av-item";


                /* =================================================
                   IMAGE
                ================================================= */

                const img =
                    document.createElement(
                        "img"
                    );

                img.className =
                    "av-item-image";

                img.src =
                    media;

                img.alt =
                    "";

                img.loading =
                    "lazy";

                img.onerror =
                    function () {

                        this.style.opacity =
                            "0.35";

                    };

                card.appendChild(
                    img
                );


                /* =================================================
                   VIDEO BADGE
                ================================================= */

                if (
                    isVideo(item)
                ) {

                    const badge =
                        document.createElement(
                            "div"
                        );

                    badge.className =
                        "av-video-badge";

                    badge.textContent =
                        "VIDEO";

                    card.appendChild(
                        badge
                    );

                }


                /* =================================================
                   STORY INFO
                ================================================= */

                const time =
                    getItemTime(
                        item
                    );

                const mentions =
                    getItemMentions(
                        item
                    );

                if (
                    time ||
                    mentions.length
                ) {

                    const info =
                        document.createElement(
                            "div"
                        );

                    info.className =
                        "av-item-info";


                    /* TIME */

                    if (time) {

                        const timeEl =
                            document.createElement(
                                "div"
                            );

                        timeEl.className =
                            "av-item-time";

                        timeEl.textContent =
                            time;

                        info.appendChild(
                            timeEl
                        );

                    }


                    /* TAGGED */

                    if (
                        mentions.length
                    ) {

                        const tagEl =
                            document.createElement(
                                "div"
                            );

                        tagEl.className =
                            "av-item-mentions";

                        const label =
                            document.createElement(
                                "span"
                            );

                        label.textContent =
                            "Tagged: ";

                        tagEl.appendChild(
                            label
                        );


                        mentions.forEach(
                            function (
                                username,
                                mentionIndex
                            ) {

                                if (
                                    mentionIndex >
                                    0
                                ) {

                                    tagEl.appendChild(
                                        document.createTextNode(
                                            ", "
                                        )
                                    );

                                }

                                const user =
                                    document.createElement(
                                        "span"
                                    );

                                user.className =
                                    "av-tag-user";

                                user.textContent =
                                    "@" +
                                    username;

                                tagEl.appendChild(
                                    user
                                );

                            }
                        );

                        info.appendChild(
                            tagEl
                        );

                    }

                    card.appendChild(
                        info
                    );

                }


                /* =================================================
                   CLICK
                ================================================= */

                card.onclick =
                    function () {

                        openItem(
                            item,
                            index,
                            items
                        );

                    };

                grid.appendChild(
                    card
                );

            }
        );

        content.appendChild(
            grid
        );

    }


    /* =========================================================
       VIEWER
    ========================================================= */

    function openItem(
        item,
        index,
        items
    ) {

        currentItems =
            Array.isArray(items)
            ? items
            : currentItems;

        currentItemIndex =
            Number.isInteger(index)
            ? index
            : 0;

        const viewer =
            el("avViewer");

        const viewerInner =
            el("avViewerInner");

        if (
            !viewer ||
            !viewerInner
        ) {
            return;
        }

        renderViewerItem();

        viewer.classList.add(
            "active"
        );

        document.body.style.overflow =
            "hidden";

    }


    function renderViewerItem() {

        const viewerInner =
            el("avViewerInner");

        if (!viewerInner) {
            return;
        }

        const item =
            currentItems[
                currentItemIndex
            ];

        if (!item) {
            return;
        }

        viewerInner.innerHTML =
            "";

        const video =
            isVideo(item);

        if (video) {

            const url =
                getVideoUrl(
                    item
                );

            if (!url) {
                return;
            }

            const videoEl =
                document.createElement(
                    "video"
                );

            videoEl.className =
                "av-viewer-media";

            videoEl.controls =
                true;

            videoEl.autoplay =
                true;

            videoEl.playsInline =
                true;

            const poster =
                item.thumbnail ||
                item.thumbnail_url ||
                item.cover_url ||
                "";

            if (poster) {

                videoEl.poster =
                    poster;

            }

            videoEl.src =
                url;

            viewerInner.appendChild(
                videoEl
            );

        } else {

            const url =
                item.url ||
                item.image_url ||
                item.image ||
                item.display_url ||
                item.thumbnail ||
                item.thumbnail_url ||
                "";

            if (!url) {
                return;
            }

            const img =
                document.createElement(
                    "img"
                );

            img.className =
                "av-viewer-media";

            img.src =
                url;

            img.alt =
                "";

            viewerInner.appendChild(
                img
            );

        }

    }


    function closeViewer() {

        const viewer =
            el("avViewer");

        const viewerInner =
            el("avViewerInner");

        if (!viewer) {
            return;
        }

        viewer.classList.remove(
            "active"
        );

        if (viewerInner) {

            viewerInner.innerHTML =
                "";

        }

        document.body.style.overflow =
            "";

    }


    function nextItem() {

        if (
            !currentItems.length
        ) {
            return;
        }

        currentItemIndex++;

        if (
            currentItemIndex >=
            currentItems.length
        ) {

            currentItemIndex =
                0;

        }

        renderViewerItem();

    }


    function previousItem() {

        if (
            !currentItems.length
        ) {
            return;
        }

        currentItemIndex--;

        if (
            currentItemIndex < 0
        ) {

            currentItemIndex =
                currentItems.length - 1;

        }

        renderViewerItem();

    }


    /* =========================================================
       USER LIST
    ========================================================= */

    async function openUserList(type) {

        if (!currentUsername) {
            return;
        }

        currentListType =
            type;

        currentListTitle =
            capitalize(type);

        const back =
            el("avBack");

        if (back) {

            back.style.display =
                "block";

        }

        showLoading();

        try {

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

        } catch (error) {

            console.error(
                "[ANON VIEWER LIST]",
                error
            );

            showError(
                error?.message ||
                "Unable to load list"
            );

        }

    }


    function renderUserList(list) {

        const content =
            el("avContent");

        if (!content) {
            return;
        }

        content.innerHTML =
            "";

        if (
            !Array.isArray(list) ||
            !list.length
        ) {

            content.innerHTML = `
                <div class="av-empty">
                    No users found.
                </div>
            `;

            return;
        }

        const search =
            document.createElement(
                "input"
            );

        search.id =
            "avListSearch";

        search.className =
            "av-list-search";

        search.type =
            "search";

        search.placeholder =
            "Search " +
            currentListTitle +
            "...";


        const userContainer =
            document.createElement(
                "div"
            );

        userContainer.id =
            "avUsers";

        userContainer.className =
            "av-user-list";


        content.appendChild(
            search
        );

        content.appendChild(
            userContainer
        );


        search.oninput =
            function () {

                filterList(
                    this.value
                );

            };


        drawUserList(
            list
        );

    }


    function drawUserList(list) {

        const container =
            el("avUsers");

        if (!container) {
            return;
        }

        container.innerHTML =
            "";

        list.forEach(
            function (user) {

                if (
                    !user ||
                    typeof user !==
                    "object"
                ) {
                    return;
                }

                const username =
                    user.username ||
                    user.unique_id ||
                    user.uniqueId ||
                    "";

                const name =
                    user.display_name ||
                    user.nickname ||
                    user.full_name ||
                    user.name ||
                    "";

                const avatar =
                    user.avatar ||
                    user.avatar_url ||
                    user.profile_pic ||
                    user.profile_pic_url ||
                    "";


                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "av-user";


                if (avatar) {

                    const img =
                        document.createElement(
                            "img"
                        );

                    img.className =
                        "av-user-avatar";

                    img.src =
                        avatar;

                    img.alt =
                        "";

                    item.appendChild(
                        img
                    );

                } else {

                    const emptyAvatar =
                        document.createElement(
                            "div"
                        );

                    emptyAvatar.className =
                        "av-user-avatar";

                    item.appendChild(
                        emptyAvatar
                    );

                }


                const info =
                    document.createElement(
                        "div"
                    );

                info.className =
                    "av-user-info";


                const usernameEl =
                    document.createElement(
                        "div"
                    );

                usernameEl.className =
                    "av-user-username";

                usernameEl.textContent =
                    username
                    ? "@" + username
                    : "";


                info.appendChild(
                    usernameEl
                );


                if (name) {

                    const nameEl =
                        document.createElement(
                            "div"
                        );

                    nameEl.className =
                        "av-user-name";

                    nameEl.textContent =
                        name;

                    info.appendChild(
                        nameEl
                    );

                }


                item.appendChild(
                    info
                );


                item.onclick =
                    function () {

                        if (username) {

                            openUser(
                                username
                            );

                        }

                    };


                container.appendChild(
                    item
                );

            }
        );

    }


    function filterList(query) {

        const search =
            String(
                query || ""
            )
            .trim()
            .toLowerCase();

        if (!search) {

            drawUserList(
                currentList
            );

            return;

        }

        const filtered =
            currentList.filter(
                function (user) {

                    const username =
                        String(
                            user?.username ||
                            user?.unique_id ||
                            user?.uniqueId ||
                            ""
                        ).toLowerCase();

                    const name =
                        String(
                            user?.display_name ||
                            user?.nickname ||
                            user?.full_name ||
                            user?.name ||
                            ""
                        ).toLowerCase();

                    return (
                        username.includes(
                            search
                        ) ||
                        name.includes(
                            search
                        )
                    );

                }
            );

        drawUserList(
            filtered
        );

    }


    /* =========================================================
       OPEN USER
    ========================================================= */

    async function openUser(username) {

        username =
            extractUsername(
                username
            );

        if (!username) {
            return;
        }

        currentUsername =
            username;

        const input =
            el("avSearch");

        if (input) {

            input.value =
                username;

        }

        showProfileArea();

        const back =
            el("avBack");

        if (back) {

            back.style.display =
                "none";

        }

        showLoading();

        try {

            const data =
                await apiRequest(
                    "profile",
                    username
                );

            currentProfile =
                data?.data ||
                data?.profile ||
                data;

            renderProfile(
                currentProfile
            );

            await openContent(
                "stories"
            );

        } catch (error) {

            console.error(
                "[ANON VIEWER USER]",
                error
            );

            showError(
                error?.message ||
                "Failed to open profile"
            );

        }

    }


    /* =========================================================
       BACK PROFILE
    ========================================================= */

    function backProfile() {

        const back =
            el("avBack");

        if (back) {

            back.style.display =
                "none";

        }

        if (!currentProfile) {
            return;
        }

        renderProfile(
            currentProfile
        );

        openContent(
            "stories"
        );

    }


    /* =========================================================
       UI MESSAGE
    ========================================================= */

    function showLoading() {

        const content =
            el("avContent");

        if (!content) {
            return;
        }

        content.innerHTML = `
            <div class="av-loading">
                Loading...
            </div>
        `;

    }


    function showError(message) {

        const content =
            el("avContent");

        const profile =
            el("avProfile");

        const messageEl =
            el("avMessage");

        if (profile) {

            profile.style.display =
                "block";

        }

        if (messageEl) {

            messageEl.style.display =
                "none";

        }

        if (content) {

            content.innerHTML = `
                <div class="av-error">
                    ${escapeHtml(
                        message
                    )}
                </div>
            `;

        }

    }


    function showMessage(message) {

        const messageEl =
            el("avMessage");

        if (!messageEl) {
            return;
        }

        messageEl.style.display =
            "block";

        messageEl.classList.remove(
            "error"
        );

        messageEl.textContent =
            message;

    }


    /* =========================================================
       NUMBER
    ========================================================= */

    function formatNumber(value) {

        const number =
            Number(value);

        if (
            !Number.isFinite(
                number
            )
        ) {
            return "0";
        }

        if (
            number >= 1000000000
        ) {

            return (
                (
                    number /
                    1000000000
                )
                .toFixed(1)
                .replace(
                    ".0",
                    ""
                ) +
                "B"
            );

        }

        if (
            number >= 1000000
        ) {

            return (
                (
                    number /
                    1000000
                )
                .toFixed(1)
                .replace(
                    ".0",
                    ""
                ) +
                "M"
            );

        }

        if (
            number >= 1000
        ) {

            return (
                (
                    number /
                    1000
                )
                .toFixed(1)
                .replace(
                    ".0",
                    ""
                ) +
                "K"
            );

        }

        return String(
            number
        );

    }


    /* =========================================================
       HELPERS
    ========================================================= */

    function capitalize(value) {

        const text =
            String(
                value || ""
            );

        if (!text) {
            return "";
        }

        return (
            text.charAt(0)
                .toUpperCase() +
            text.slice(1)
        );

    }


    function escapeHtml(value) {

        return String(
            value ?? ""
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


    /* =========================================================
       KEYBOARD
    ========================================================= */

    function bindKeyboard() {

        const search =
            el("avSearch");

        if (search) {

            /*
             * Gunakan onkeydown supaya tidak
             * menambah event listener berkali-kali.
             */

            search.onkeydown =
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        searchProfile();

                    }

                };

        }


        document.onkeydown =
            function (event) {

                const viewer =
                    el("avViewer");

                if (
                    !viewer ||
                    !viewer.classList.contains(
                        "active"
                    )
                ) {

                    return;

                }

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeViewer();

                } else if (
                    event.key ===
                    "ArrowRight"
                ) {

                    nextItem();

                } else if (
                    event.key ===
                    "ArrowLeft"
                ) {

                    previousItem();

                }

            };

    }


    /* =========================================================
       VIEWER BUTTONS
    ========================================================= */

    function bindViewerButtons() {

        const viewer =
            el("avViewer");

        if (!viewer) {
            return;
        }

        /*
         * Theme hanya punya tombol close.
         * Tombol prev/next dibuat di sini SATU KALI
         * jika belum ada.
         */

        let close =
            viewer.querySelector(
                ".av-close"
            );

        if (!close) {

            close =
                document.createElement(
                    "button"
                );

            close.className =
                "av-viewer-close";

            close.textContent =
                "×";

            viewer.appendChild(
                close
            );

        }

        close.onclick =
            closeViewer;


        let prev =
            viewer.querySelector(
                ".av-viewer-prev"
            );

        if (!prev) {

            prev =
                document.createElement(
                    "button"
                );

            prev.className =
                "av-viewer-prev";

            prev.textContent =
                "‹";

            viewer.appendChild(
                prev
            );

        }

        prev.onclick =
            previousItem;


        let next =
            viewer.querySelector(
                ".av-viewer-next"
            );

        if (!next) {

            next =
                document.createElement(
                    "button"
                );

            next.className =
                "av-viewer-next";

            next.textContent =
                "›";

            viewer.appendChild(
                next
            );

        }

        next.onclick =
            nextItem;

    }


    /* =========================================================
       INITIALIZE
    ========================================================= */

    function init() {

        if (initialized) {
            return;
        }

        const app =
            el("anonymousViewer") ||
            el("avApp");

        if (!app) {

            console.warn(
                "[ANON VIEWER] App container not found"
            );

            return;

        }

        initialized =
            true;


        /*
         * Jangan membuat Search/Input/Platform baru.
         * Semua sudah ada di Theme Blogger.
         */


        /* PLATFORM */

        const instagram =
            el("platformInstagram");

        const tiktok =
            el("platformTiktok");

        if (instagram) {

            instagram.onclick =
                function () {

                    setPlatform(
                        "instagram"
                    );

                };

        }

        if (tiktok) {

            tiktok.onclick =
                function () {

                    setPlatform(
                        "tiktok"
                    );

                };

        }


        /* SEARCH */

        const search =
            el("avSearch");

        if (search) {

            search.onkeydown =
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        searchProfile();

                    }

                };

        }


        /*
         * Theme button View tidak punya ID.
         * Cari tombol yang berada tepat di .av-search.
         * Ini TIDAK membuat tombol baru.
         */

        const searchBox =
            document.querySelector(
                ".av-search"
            );

        if (searchBox) {

            const searchButton =
                searchBox.querySelector(
                    "button"
                );

            if (searchButton) {

                searchButton.onclick =
                    function (event) {

                        event.preventDefault();

                        searchProfile();

                    };

            }

        }


        /* BACK */

        const back =
            el("avBack");

        if (back) {

            const backButton =
                back.querySelector(
                    "button"
                );

            if (backButton) {

                backButton.onclick =
                    function (event) {

                        event.preventDefault();

                        backProfile();

                    };

            }

        }


        /* VIEWER */

        bindViewerButtons();


        /* KEYBOARD */

        bindKeyboard();


        console.log(
            "%c[ANON VIEWER] READY",
            "color:#00d979;font-weight:bold"
        );

    }


    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.searchProfile =
        searchProfile;

    window.setPlatform =
        setPlatform;

    window.openContent =
        openContent;

    window.openUser =
        openUser;

    window.backProfile =
        backProfile;

    window.closeViewer =
        closeViewer;

    window.filterList =
        filterList;

    window.AnonymousViewer = {

        searchProfile:
            searchProfile,

        setPlatform:
            setPlatform,

        openContent:
            openContent,

        openUser:
            openUser,

        backProfile:
            backProfile,

        closeViewer:
            closeViewer,

        filterList:
            filterList

    };


    /* =========================================================
       START
    ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );

    } else {

        init();

    }

})();
