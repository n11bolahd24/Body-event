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


    /* =========================================================
       CSS
    ========================================================= */

    const style = document.createElement("style");

    style.textContent = `

/* =========================================================
   ROOT
========================================================= */

#anonymousViewer,
#avApp {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    font-family: Arial, Helvetica, sans-serif;
    color: #fff;
    box-sizing: border-box;
}

#anonymousViewer *,
#avApp * {
    box-sizing: border-box;
}


/* =========================================================
   PLATFORM SWITCH
========================================================= */

.av-platforms {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin: 15px 0;
}

.av-platform-btn {
    border: 1px solid #333;
    background: #111;
    color: #aaa;
    padding: 9px 18px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
}

.av-platform-btn:hover {
    border-color: #00d979;
    color: #00d979;
}

.av-platform-btn.active {
    background: #00d979;
    color: #000;
    border-color: #00d979;
    font-weight: bold;
}


/* =========================================================
   SEARCH
========================================================= */

.av-search-box {
    display: flex;
    gap: 8px;
    width: 100%;
    margin: 0 auto 15px;
}

.av-search-input {
    flex: 1;
    min-width: 0;
    height: 40px;
    padding: 0 12px;
    border: 1px solid #333;
    border-radius: 6px;
    outline: none;
    background: #111;
    color: #fff;
    font-size: 14px;
}

.av-search-input:focus {
    border-color: #00d979;
}

.av-search-input::placeholder {
    color: #777;
}

.av-search-btn {
    height: 40px;
    padding: 0 18px;
    border: 0;
    border-radius: 6px;
    background: #00d979;
    color: #000;
    cursor: pointer;
    font-weight: bold;
    font-size: 13px;
}

.av-search-btn:hover {
    opacity: .85;
}


/* =========================================================
   LOADING / ERROR / EMPTY
========================================================= */

.av-loading,
.av-error,
.av-empty {
    width: 100%;
    padding: 30px 15px;
    text-align: center;
    color: #999;
    font-size: 13px;
}

.av-error {
    color: #ff6b6b;
}


/* =========================================================
   PROFILE
========================================================= */

.av-profile {
    background: #111;
    border: 1px solid #222;
    border-radius: 10px;
    padding: 18px;
    margin-bottom: 15px;
}

.av-profile-top {
    display: flex;
    align-items: flex-start;
    gap: 15px;
}

.av-profile-avatar {
    width: 82px;
    height: 82px;
    min-width: 82px;
    border-radius: 50%;
    object-fit: cover;
    background: #222;
    border: 2px solid #333;
}

.av-profile-info {
    flex: 1;
    min-width: 0;
}

.av-profile-username {
    color: #fff;
    font-size: 17px;
    font-weight: bold;
    word-break: break-word;
}

.av-profile-name {
    margin-top: 3px;
    color: #aaa;
    font-size: 13px;
}

.av-profile-bio {
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

.av-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 15px;
}

.av-stat {
    color: #aaa;
    font-size: 12px;
}

.av-stat strong {
    color: #fff;
    font-size: 14px;
}

.av-stat.clickable {
    cursor: pointer;
}

.av-stat.clickable:hover strong {
    color: #00d979;
}


/* =========================================================
   NAVIGATION
========================================================= */

.av-nav {
    display: flex;
    gap: 5px;
    overflow-x: auto;
    margin-bottom: 15px;
    border-bottom: 1px solid #222;
    scrollbar-width: none;
}

.av-nav::-webkit-scrollbar {
    display: none;
}

.av-nav-btn {
    flex: 0 0 auto;
    padding: 10px 13px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #777;
    cursor: pointer;
    font-size: 12px;
}

.av-nav-btn:hover {
    color: #fff;
}

.av-nav-btn.active {
    color: #00d979;
    border-bottom-color: #00d979;
}


/* =========================================================
   BACK BUTTON
========================================================= */

.av-back {
    display: none;
    margin-bottom: 12px;
}

.av-back-btn {
    border: 1px solid #333;
    background: #111;
    color: #aaa;
    border-radius: 5px;
    padding: 7px 12px;
    cursor: pointer;
    font-size: 12px;
}

.av-back-btn:hover {
    border-color: #00d979;
    color: #00d979;
}


/* =========================================================
   GRID
========================================================= */

.av-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: 100%;
}

.av-item {
    position: relative;
    overflow: hidden;
    background: #111;
    border: 1px solid #222;
    border-radius: 6px;
    cursor: pointer;
    min-width: 0;
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
    z-index: 2;
    padding: 3px 6px;
    border-radius: 4px;
    background: rgba(0,0,0,.75);
    color: #fff;
    font-size: 9px;
    font-weight: bold;
}


/* =========================================================
   STORY TIME + TAGGED
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
    color: #00d979;
    font-size: 11px;
    line-height: 16px;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.av-item-mentions > span:first-child {
    color: #aaa;
}

.av-tag-user {
    color: #00d979 !important;
}


/* =========================================================
   USER LIST
========================================================= */

.av-list-search {
    width: 100%;
    height: 36px;
    margin-bottom: 10px;
    padding: 0 10px;
    background: #111;
    border: 1px solid #333;
    border-radius: 5px;
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
   VIEWER
========================================================= */

.av-viewer {
    position: fixed;
    inset: 0;
    z-index: 999999;
    display: none;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,.96);
    padding: 20px;
}

.av-viewer.active {
    display: flex;
}

.av-viewer-content {
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

.av-viewer-close {
    position: fixed;
    top: 15px;
    right: 18px;
    z-index: 5;
    width: 38px;
    height: 38px;
    border: 0;
    border-radius: 50%;
    background: rgba(0,0,0,.7);
    color: #fff;
    font-size: 22px;
    cursor: pointer;
}

.av-viewer-close:hover {
    background: #00d979;
    color: #000;
}

.av-viewer-prev,
.av-viewer-next {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    z-index: 5;
    width: 42px;
    height: 42px;
    border: 0;
    border-radius: 50%;
    background: rgba(0,0,0,.7);
    color: #fff;
    cursor: pointer;
    font-size: 20px;
}

.av-viewer-prev {
    left: 15px;
}

.av-viewer-next {
    right: 15px;
}

.av-viewer-prev:hover,
.av-viewer-next:hover {
    background: #00d979;
    color: #000;
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 600px) {

    #anonymousViewer,
    #avApp {
        width: 100%;
    }

    .av-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
    }

    .av-profile {
        padding: 14px;
    }

    .av-profile-avatar {
        width: 68px;
        height: 68px;
        min-width: 68px;
    }

    .av-stats {
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


    /* =========================================================
       FIND APP
    ========================================================= */

    function getApp() {

        return (
            document.getElementById("anonymousViewer") ||
            document.getElementById("avApp")
        );

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
            "[ANON VIEWER API]",
            currentPlatform,
            action,
            username
        );

        const response = await fetch(url, {
            method: "GET",
            cache: "no-store"
        });

        let data = null;

        try {
            data = await response.json();
        } catch (e) {
            throw new Error("Invalid API response");
        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                "API error " + response.status
            );

        }

        if (data.success === false) {

            throw new Error(
                data.error ||
                data.message ||
                "Request failed"
            );

        }

        return data;

    }


    /* =========================================================
       SEARCH PROFILE
    ========================================================= */

    async function searchProfile() {

        const input = document.getElementById("avSearch");

        if (!input) return;

        const username = input.value
            .trim()
            .replace(/^@+/, "");

        if (!username) return;

        currentUsername = username;

        showLoading();

        try {

            const data =
                await apiRequest("profile", username);

            currentProfile = data.data || data.profile || data;

            renderProfile(currentProfile);

            // STORIES FIRST
            await openContent("stories");

        } catch (error) {

            console.error(error);

            showError(
                error.message || "Failed to load profile"
            );

        }

    }


    /* =========================================================
       PLATFORM
    ========================================================= */

    function setPlatform(platform) {

        currentPlatform = platform;

        const instagram =
            document.getElementById("platformInstagram");

        const tiktok =
            document.getElementById("platformTiktok");

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
            document.getElementById("avSearch");

        if (input) {
            input.value = "";
        }

        resetView();

    }


    /* =========================================================
       RESET
    ========================================================= */

    function resetView() {

        currentUsername = "";
        currentProfile = null;
        currentList = [];
        currentItems = [];

        const profile =
            document.getElementById("avProfile");

        const content =
            document.getElementById("avContent");

        const nav =
            document.getElementById("avNav");

        const back =
            document.getElementById("avBack");

        if (profile) profile.innerHTML = "";

        if (content) content.innerHTML = "";

        if (nav) nav.innerHTML = "";

        if (back) back.style.display = "none";

    }


    /* =========================================================
       PROFILE RENDER
    ========================================================= */

    function renderProfile(profile) {

        const container =
            document.getElementById("avProfile");

        if (!container) return;

        const avatar =
            profile?.avatar ||
            profile?.avatar_url ||
            profile?.profile_pic ||
            profile?.profile_pic_url ||
            profile?.hd_profile_pic_url ||
            profile?.hd_avatar ||
            "";

        const username =
            profile?.username ||
            profile?.unique_id ||
            currentUsername;

        const displayName =
            profile?.display_name ||
            profile?.nickname ||
            profile?.full_name ||
            profile?.name ||
            "";

        const bio =
            profile?.bio ||
            profile?.biography ||
            profile?.signature ||
            "";

        const followers =
            profile?.followers ??
            profile?.follower_count ??
            profile?.followers_count ??
            0;

        const following =
            profile?.following ??
            profile?.following_count ??
            0;

        const posts =
            profile?.posts ??
            profile?.post_count ??
            profile?.posts_count ??
            0;

        const likes =
            profile?.likes ??
            profile?.like_count ??
            profile?.likes_count ??
            0;


        container.innerHTML = `

            <div class="av-profile">

                <div class="av-profile-top">

                    ${
                        avatar
                        ?
                        `
                        <img
                            class="av-profile-avatar"
                            src="${escapeAttr(avatar)}"
                            alt=""
                        >
                        `
                        :
                        `
                        <div class="av-profile-avatar"></div>
                        `
                    }

                    <div class="av-profile-info">

                        <div class="av-profile-username">
                            @${escapeHtml(username)}
                        </div>

                        ${
                            displayName
                            ?
                            `
                            <div class="av-profile-name">
                                ${escapeHtml(displayName)}
                            </div>
                            `
                            :
                            ""
                        }

                        ${
                            bio
                            ?
                            `
                            <div class="av-profile-bio">
                                ${escapeHtml(bio)}
                            </div>
                            `
                            :
                            ""
                        }

                    </div>

                </div>


                <div class="av-stats">

                    <div class="av-stat">
                        <strong>
                            ${formatNumber(followers)}
                        </strong>
                        Followers
                    </div>

                    <div
                        class="av-stat ${
                            currentPlatform === "tiktok"
                            ? "clickable"
                            : ""
                        }"
                        ${
                            currentPlatform === "tiktok"
                            ?
                            `data-list="following"`
                            :
                            ""
                        }
                    >
                        <strong>
                            ${formatNumber(following)}
                        </strong>
                        Following
                    </div>

                    ${
                        posts
                        ?
                        `
                        <div class="av-stat">
                            <strong>
                                ${formatNumber(posts)}
                            </strong>
                            Posts
                        </div>
                        `
                        :
                        ""
                    }

                    ${
                        likes
                        ?
                        `
                        <div class="av-stat">
                            <strong>
                                ${formatNumber(likes)}
                            </strong>
                            Likes
                        </div>
                        `
                        :
                        ""
                    }

                </div>

            </div>

        `;

        const followingEl =
            container.querySelector(
                '[data-list="following"]'
            );

        if (followingEl) {

            followingEl.addEventListener(
                "click",
                function () {

                    openUserList("following");

                }
            );

        }

        renderNavigation();

    }


    /* =========================================================
       NAVIGATION
    ========================================================= */

    function renderNavigation() {

        const nav =
            document.getElementById("avNav");

        if (!nav) return;

        const tabs = [
            "stories",
            "posts",
            "reposts"
        ];

        if (currentPlatform === "tiktok") {

            tabs.push(
                "followers",
                "following"
            );

        }

        nav.innerHTML = "";

        tabs.forEach(function (type) {

            const btn =
                document.createElement("button");

            btn.className = "av-nav-btn";

            btn.id =
                "nav" +
                type.charAt(0).toUpperCase() +
                type.slice(1);

            btn.textContent =
                type.charAt(0).toUpperCase() +
                type.slice(1);

            btn.addEventListener(
                "click",
                function () {

                    openContent(type);

                }
            );

            nav.appendChild(btn);

        });

    }


    /* =========================================================
       OPEN CONTENT
    ========================================================= */

    async function openContent(type) {

        if (!currentUsername) return;

        const nav =
            document.getElementById("avNav");

        if (nav) {

            nav.querySelectorAll(
                ".av-nav-btn"
            ).forEach(function (btn) {

                btn.classList.remove("active");

            });

            const active =
                document.getElementById(
                    "nav" +
                    type.charAt(0).toUpperCase() +
                    type.slice(1)
                );

            if (active) {
                active.classList.add("active");
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

            currentItems = items;

            renderGrid(items);

        } catch (error) {

            console.error(error);

            showError(
                error.message ||
                "Content unavailable"
            );

        }

    }


    /* =========================================================
       NORMALIZE
    ========================================================= */

    function normalizeItems(data) {

        if (!data) return [];

        if (Array.isArray(data.data)) {
            return data.data;
        }

        if (Array.isArray(data.items)) {
            return data.items;
        }

        if (Array.isArray(data.results)) {
            return data.results;
        }

        if (Array.isArray(data)) {
            return data;
        }

        return [];

    }


    /* =========================================================
       STORY TIME
    ========================================================= */

    function getItemTime(item) {

        if (!item) return "";

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

        let timestamp =
            Number(value);

        if (!Number.isFinite(timestamp)) {

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

        } else {

            if (
                timestamp <
                100000000000
            ) {
                timestamp *= 1000;
            }

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

        return date.toLocaleString(
            "id-ID",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }
        );

    }


    /* =========================================================
       MENTIONS
    ========================================================= */

    function getItemMentions(item) {

        if (!item) return [];

        let mentions =
            item.mentions ??
            item.mentioned_users ??
            item.mentionedUsers ??
            item.tagged_users ??
            item.taggedUsers ??
            item.tags ??
            [];

        if (!Array.isArray(mentions)) {
            return [];
        }

        const result = [];

        mentions.forEach(function (user) {

            let username = "";

            if (typeof user === "string") {

                username = user;

            } else if (
                user &&
                typeof user === "object"
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
                String(username).trim();

            if (!username) return;

            username =
                username.replace(/^@+/, "");

            if (
                !result.includes(username)
            ) {
                result.push(username);
            }

        });

        return result;

    }


    /* =========================================================
       RENDER GRID
    ========================================================= */

    function renderGrid(items) {

        const content =
            document.getElementById(
                "avContent"
            );

        if (!content) return;

        content.innerHTML = "";

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
            document.createElement("div");

        grid.className = "av-grid";

        items.forEach(
            function (item, index) {

                if (
                    !item ||
                    typeof item !== "object"
                ) {
                    return;
                }

                const card =
                    document.createElement("div");

                card.className =
                    "av-item";

                const media =
                    item.thumbnail ||
                    item.thumbnail_url ||
                    item.cover_url ||
                    item.cover ||
                    item.image ||
                    item.image_url ||
                    item.url ||
                    item.video_url ||
                    "";

                if (!media) return;


                /* MEDIA */

                const img =
                    document.createElement("img");

                img.className =
                    "av-item-image";

                img.src = media;

                img.alt = "";

                img.loading = "lazy";

                img.onerror =
                    function () {

                        this.style.opacity =
                            "0.35";

                    };

                card.appendChild(img);


                /* VIDEO */

                const type =
                    String(
                        item.type ||
                        item.media_type ||
                        ""
                    ).toLowerCase();

                if (
                    type === "video" ||
                    type === "2" ||
                    item.video_url ||
                    item.video
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


                /* INFO */

                const info =
                    document.createElement(
                        "div"
                    );

                info.className =
                    "av-item-info";


                /* TIME */

                const time =
                    getItemTime(item);

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

                const mentions =
                    getItemMentions(item);

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
                            i
                        ) {

                            if (i > 0) {

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


                if (
                    info.children.length
                ) {

                    card.appendChild(
                        info
                    );

                }


                /* CLICK */

                card.addEventListener(
                    "click",
                    function () {

                        openItem(
                            item,
                            index,
                            items
                        );

                    }
                );

                grid.appendChild(card);

            }
        );

        content.appendChild(grid);

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
            items || currentItems;

        currentItemIndex =
            index || 0;

        const viewer =
            document.getElementById(
                "avViewer"
            );

        if (!viewer) return;

        renderViewerItem();

        viewer.classList.add(
            "active"
        );

        document.body.style.overflow =
            "hidden";

    }


    function renderViewerItem() {

        const viewerContent =
            document.getElementById(
                "avViewerContent"
            );

        if (!viewerContent) return;

        const item =
            currentItems[
                currentItemIndex
            ];

        if (!item) return;

        const type =
            String(
                item.type ||
                item.media_type ||
                ""
            ).toLowerCase();

        const url =
            item.url ||
            item.video_url ||
            item.image_url ||
            item.image ||
            "";

        const poster =
            item.thumbnail ||
            item.cover_url ||
            "";

        viewerContent.innerHTML = "";

        if (
            type === "video" ||
            type === "2" ||
            item.video_url
        ) {

            const video =
                document.createElement(
                    "video"
                );

            video.className =
                "av-viewer-media";

            video.controls = true;

            video.autoplay = true;

            video.playsInline = true;

            if (poster) {
                video.poster = poster;
            }

            video.src = url;

            viewerContent.appendChild(
                video
            );

        } else {

            const img =
                document.createElement(
                    "img"
                );

            img.className =
                "av-viewer-media";

            img.src = url || poster;

            img.alt = "";

            viewerContent.appendChild(
                img
            );

        }

    }


    function closeViewer() {

        const viewer =
            document.getElementById(
                "avViewer"
            );

        if (!viewer) return;

        viewer.classList.remove(
            "active"
        );

        viewer.innerHTML = `
            <button
                class="av-viewer-close"
                id="avViewerClose"
            >
                ×
            </button>

            <button
                class="av-viewer-prev"
                id="avViewerPrev"
            >
                ‹
            </button>

            <div
                class="av-viewer-content"
                id="avViewerContent"
            ></div>

            <button
                class="av-viewer-next"
                id="avViewerNext"
            >
                ›
            </button>
        `;

        bindViewerButtons();

        document.body.style.overflow =
            "";

    }


    function nextItem() {

        if (
            !currentItems.length
        ) return;

        currentItemIndex++;

        if (
            currentItemIndex >=
            currentItems.length
        ) {
            currentItemIndex = 0;
        }

        renderViewerItem();

    }


    function previousItem() {

        if (
            !currentItems.length
        ) return;

        currentItemIndex--;

        if (
            currentItemIndex < 0
        ) {
            currentItemIndex =
                currentItems.length - 1;
        }

        renderViewerItem();

    }


    function bindViewerButtons() {

        const close =
            document.getElementById(
                "avViewerClose"
            );

        const prev =
            document.getElementById(
                "avViewerPrev"
            );

        const next =
            document.getElementById(
                "avViewerNext"
            );

        if (close) {
            close.onclick =
                closeViewer;
        }

        if (prev) {
            prev.onclick =
                previousItem;
        }

        if (next) {
            next.onclick =
                nextItem;
        }

    }


    /* =========================================================
       USER LIST
    ========================================================= */

    async function openUserList(type) {

        if (!currentUsername) return;

        currentListType =
            type;

        const title =
            type.charAt(0).toUpperCase() +
            type.slice(1);

        currentListTitle =
            title;

        const back =
            document.getElementById(
                "avBack"
            );

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
                normalizeItems(data);

            renderUserList(
                currentList
            );

        } catch (error) {

            showError(
                error.message ||
                "Unable to load list"
            );

        }

    }


    function renderUserList(list) {

        const content =
            document.getElementById(
                "avContent"
            );

        if (!content) return;

        content.innerHTML = "";

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

        content.innerHTML = `

            <input
                id="avListSearch"
                class="av-list-search"
                type="search"
                placeholder="Search ${escapeAttr(
                    currentListTitle
                )}..."
            >

            <div
                class="av-user-list"
                id="avUserList"
            ></div>

        `;

        const search =
            document.getElementById(
                "avListSearch"
            );

        if (search) {

            search.addEventListener(
                "input",
                function () {

                    filterList(
                        this.value
                    );

                }
            );

        }

        drawUserList(list);

    }


    function drawUserList(list) {

        const container =
            document.getElementById(
                "avUserList"
            );

        if (!container) return;

        container.innerHTML = "";

        list.forEach(
            function (user, index) {

                const username =
                    user?.username ||
                    user?.unique_id ||
                    user?.uniqueId ||
                    "";

                const name =
                    user?.display_name ||
                    user?.nickname ||
                    user?.full_name ||
                    user?.name ||
                    "";

                const avatar =
                    user?.avatar ||
                    user?.avatar_url ||
                    user?.profile_pic ||
                    user?.profile_pic_url ||
                    "";


                const el =
                    document.createElement(
                        "div"
                    );

                el.className =
                    "av-user";

                el.innerHTML = `

                    ${
                        avatar
                        ?
                        `
                        <img
                            class="av-user-avatar"
                            src="${escapeAttr(
                                avatar
                            )}"
                            alt=""
                        >
                        `
                        :
                        `
                        <div
                            class="av-user-avatar"
                        ></div>
                        `
                    }

                    <div class="av-user-info">

                        <div
                            class="av-user-username"
                        >
                            @${escapeHtml(
                                username
                            )}
                        </div>

                        ${
                            name
                            ?
                            `
                            <div
                                class="av-user-name"
                            >
                                ${escapeHtml(
                                    name
                                )}
                            </div>
                            `
                            :
                            ""
                        }

                    </div>

                `;

                el.addEventListener(
                    "click",
                    function () {

                        if (username) {
                            openUser(
                                username
                            );
                        }

                    }
                );

                container.appendChild(
                    el
                );

            }
        );

    }


    function filterList(query) {

        query =
            String(query || "")
                .trim()
                .toLowerCase();

        if (!query) {

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
                            ""
                        ).toLowerCase();

                    const name =
                        String(
                            user?.display_name ||
                            user?.nickname ||
                            user?.full_name ||
                            ""
                        ).toLowerCase();

                    return (
                        username.includes(
                            query
                        ) ||
                        name.includes(
                            query
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

        currentUsername =
            username;

        const input =
            document.getElementById(
                "avSearch"
            );

        if (input) {
            input.value =
                username;
        }

        const back =
            document.getElementById(
                "avBack"
            );

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
                data.data ||
                data.profile ||
                data;

            renderProfile(
                currentProfile
            );

            await openContent(
                "stories"
            );

        } catch (error) {

            showError(
                error.message ||
                "Failed to open profile"
            );

        }

    }


    /* =========================================================
       BACK PROFILE
    ========================================================= */

    function backProfile() {

        const back =
            document.getElementById(
                "avBack"
            );

        if (back) {
            back.style.display =
                "none";
        }

        renderProfile(
            currentProfile
        );

        openContent(
            "stories"
        );

    }


    /* =========================================================
       UI HELPERS
    ========================================================= */

    function showLoading() {

        const content =
            document.getElementById(
                "avContent"
            );

        if (!content) return;

        content.innerHTML = `
            <div class="av-loading">
                Loading...
            </div>
        `;

    }


    function showError(message) {

        const content =
            document.getElementById(
                "avContent"
            );

        if (!content) return;

        content.innerHTML = `
            <div class="av-error">
                ${escapeHtml(
                    message
                )}
            </div>
        `;

    }


    /* =========================================================
       HELPERS
    ========================================================= */

    function formatNumber(value) {

        const number =
            Number(value);

        if (
            !Number.isFinite(number)
        ) {
            return "0";
        }

        if (number >= 1000000000) {

            return (
                (number / 1000000000)
                    .toFixed(1)
                    .replace(".0", "") +
                "B"
            );

        }

        if (number >= 1000000) {

            return (
                (number / 1000000)
                    .toFixed(1)
                    .replace(".0", "") +
                "M"
            );

        }

        if (number >= 1000) {

            return (
                (number / 1000)
                    .toFixed(1)
                    .replace(".0", "") +
                "K"
            );

        }

        return String(number);

    }


    function escapeHtml(value) {

        return String(
            value ?? ""
        )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    }


    function escapeAttr(value) {

        return escapeHtml(value);

    }


    /* =========================================================
       INITIALIZE EVENTS
    ========================================================= */

    function init() {

        const app =
            getApp();

        if (!app) {

            console.warn(
                "[ANON VIEWER] App container not found"
            );

            return;

        }

        const search =
            document.getElementById(
                "avSearch"
            );

        const searchBtn =
            document.getElementById(
                "avSearchBtn"
            );

        const instagram =
            document.getElementById(
                "platformInstagram"
            );

        const tiktok =
            document.getElementById(
                "platformTiktok"
            );


        if (searchBtn) {

            searchBtn.addEventListener(
                "click",
                searchProfile
            );

        }

        if (search) {

            search.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        searchProfile();

                    }

                }
            );

        }

        if (instagram) {

            instagram.addEventListener(
                "click",
                function () {

                    setPlatform(
                        "instagram"
                    );

                }
            );

        }

        if (tiktok) {

            tiktok.addEventListener(
                "click",
                function () {

                    setPlatform(
                        "tiktok"
                    );

                }
            );

        }


        bindViewerButtons();


        const backBtn =
            document.getElementById(
                "avBackBtn"
            );

        if (backBtn) {

            backBtn.addEventListener(
                "click",
                backProfile
            );

        }


        document.addEventListener(
            "keydown",
            function (event) {

                const viewer =
                    document.getElementById(
                        "avViewer"
                    );

                if (
                    !viewer ||
                    !viewer.classList.contains(
                        "active"
                    )
                ) {
                    return;
                }

                if (
                    event.key === "Escape"
                ) {

                    closeViewer();

                }

                if (
                    event.key === "ArrowRight"
                ) {

                    nextItem();

                }

                if (
                    event.key === "ArrowLeft"
                ) {

                    previousItem();

                }

            }
        );


        console.log(
            "%c[ANON VIEWER] READY",
            "color:#00d979;font-weight:bold"
        );

    }


    /* =========================================================
       PUBLIC
    ========================================================= */

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
            closeViewer

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
            init
        );

    } else {

        init();

    }

})();
