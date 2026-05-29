const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// CORS - izinkan semua domain (termasuk Netlify lo)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "SSS Downloader Backend is running!" });
});

// ─────────────────────────────
//  TIKTOK
// ─────────────────────────────
app.get("/api/tiktok", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL required" });
    try {
        const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
        const d = await r.json();
        if (!d?.data) return res.status(500).json({ error: "Gagal ambil data TikTok" });
        res.json({
            success: true,
            platform: "tiktok",
            avatar: d.data.author.avatar,
            username: d.data.author.nickname,
            title: d.data.title || "TikTok Video",
            video: d.data.hdplay || d.data.play,
            audio: d.data.music,
            thumbnail: d.data.cover
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ─────────────────────────────
//  INSTAGRAM
// ─────────────────────────────
app.get("/api/instagram", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL required" });

    // Coba beberapa API dari server (ga kena CORS!)
    const apis = [
        async () => {
            const r = await fetch(`https://saveig.app/api?url=${encodeURIComponent(url)}`);
            const d = await r.json();
            if (d?.data?.[0]?.url) return { video: d.data[0].url, audio: d.data[0].url, title: "Instagram Post", thumbnail: "", username: "Instagram" };
            throw new Error("API 1 gagal");
        },
        async () => {
            const r = await fetch(`https://api.tiklydown.eu.org/api/download/insta?url=${encodeURIComponent(url)}`);
            const d = await r.json();
            if (d?.video?.[0]?.url) return { video: d.video[0].url, audio: d.video[0].url, title: d.caption || "Instagram Post", thumbnail: d.image?.[0] || "", username: d.author?.username || "Instagram" };
            throw new Error("API 2 gagal");
        },
        async () => {
            const r = await fetch(`https://snapsave.app/action.php?lang=id`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ url })
            });
            const text = await r.text();
            const mp4 = text.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i)?.[0];
            if (mp4) return { video: mp4, audio: mp4, title: "Instagram Post", thumbnail: "", username: "Instagram" };
            throw new Error("API 3 gagal");
        },
        async () => {
            const r = await fetch(`https://instasaved.net/api?url=${encodeURIComponent(url)}`);
            const d = await r.json();
            if (d?.video_url) return { video: d.video_url, audio: d.video_url, title: d.title || "Instagram Post", thumbnail: d.thumbnail || "", username: d.author || "Instagram" };
            throw new Error("API 4 gagal");
        },
    ];

    for (let i = 0; i < apis.length; i++) {
        try {
            const data = await Promise.race([
                apis[i](),
                new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), 10000))
            ]);
            if (data?.video) return res.json({ success: true, platform: "instagram", ...data });
        } catch (e) { console.warn(`IG API ${i+1} gagal:`, e.message); }
    }

    res.status(500).json({ error: "Semua API Instagram gagal. Coba lagi nanti." });
});

// ─────────────────────────────
//  FACEBOOK
// ─────────────────────────────
app.get("/api/facebook", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL required" });

    const apis = [
        async () => {
            const r = await fetch(`https://api.fabdl.com/facebook/get?url=${encodeURIComponent(url)}`);
            const d = await r.json();
            if (d?.hd || d?.sd) return { video: d.hd || d.sd, audio: d.hd || d.sd, title: d.title || "Facebook Video", thumbnail: d.thumbnail || "", username: "Facebook" };
            throw new Error("API 1 gagal");
        },
        async () => {
            const r = await fetch(`https://getfvid.com/api.php`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ url })
            });
            const d = await r.json();
            const mp4 = d?.hd || d?.sd || d?.url;
            if (mp4) return { video: mp4, audio: mp4, title: d.title || "Facebook Video", thumbnail: d.thumbnail || "", username: "Facebook" };
            throw new Error("API 2 gagal");
        },
        async () => {
            const r = await fetch(`https://fdown.net/download.php`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ URLz: url })
            });
            const text = await r.text();
            const mp4 = text.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i)?.[0];
            if (mp4) return { video: mp4, audio: mp4, title: "Facebook Video", thumbnail: "", username: "Facebook" };
            throw new Error("API 3 gagal");
        },
        async () => {
            const r = await fetch(`https://snapsave.app/action.php?lang=id`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ url })
            });
            const text = await r.text();
            const mp4 = text.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i)?.[0];
            if (mp4) return { video: mp4, audio: mp4, title: "Facebook Video", thumbnail: "", username: "Facebook" };
            throw new Error("API 4 gagal");
        },
    ];

    for (let i = 0; i < apis.length; i++) {
        try {
            const data = await Promise.race([
                apis[i](),
                new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), 10000))
            ]);
            if (data?.video) return res.json({ success: true, platform: "facebook", ...data });
        } catch (e) { console.warn(`FB API ${i+1} gagal:`, e.message); }
    }

    res.status(500).json({ error: "Semua API Facebook gagal. Coba lagi nanti." });
});

// ─────────────────────────────
//  TWITTER / X
// ─────────────────────────────
app.get("/api/twitter", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL required" });

    const apis = [
        async () => {
            const r = await fetch(`https://twitsave.com/info?url=${encodeURIComponent(url)}`);
            const d = await r.json();
            const mp4 = d?.video_url || d?.url || d?.media?.[0]?.url || d?.videos?.[0]?.url;
            if (mp4) return { video: mp4, audio: mp4, title: d.title || d.text || "Twitter Video", thumbnail: d.thumbnail || "", username: d.author || "Twitter" };
            throw new Error("API 1 gagal");
        },
        async () => {
            const r = await fetch(`https://twittervideodownloader.com/api/info?url=${encodeURIComponent(url)}`);
            const d = await r.json();
            const mp4 = d?.url || d?.videos?.[0]?.url;
            if (mp4) return { video: mp4, audio: mp4, title: d.title || "Twitter Video", thumbnail: d.thumbnail || "", username: d.author || "Twitter" };
            throw new Error("API 2 gagal");
        },
        async () => {
            const r = await fetch(`https://ssstwitter.com/en/json`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ id: url, locale: "en", tt: Date.now().toString() })
            });
            const d = await r.json();
            const mp4 = d?.url || d?.links?.[0]?.url;
            if (mp4) return { video: mp4, audio: mp4, title: d.title || "Twitter Video", thumbnail: d.thumbnail || "", username: d.author || "Twitter" };
            throw new Error("API 3 gagal");
        },
    ];

    for (let i = 0; i < apis.length; i++) {
        try {
            const data = await Promise.race([
                apis[i](),
                new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), 10000))
            ]);
            if (data?.video) return res.json({ success: true, platform: "twitter", ...data });
        } catch (e) { console.warn(`TW API ${i+1} gagal:`, e.message); }
    }

    res.status(500).json({ error: "Semua API Twitter gagal. Coba lagi nanti." });
});

// ─────────────────────────────
//  YOUTUBE
// ─────────────────────────────
app.get("/api/youtube", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL required" });

    const vidId = url.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)?.[1] || "";
    const thumb = vidId ? `https://img.youtube.com/vi/${vidId}/hqdefault.jpg` : "";

    const apis = [
        async () => {
            const r1 = await fetch(`https://yt5s.io/api/ajaxSearch`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ q: url, vt: "home" })
            });
            const d1 = await r1.json();
            if (!d1?.vid || !d1?.links?.mp4) throw new Error("Step 1 gagal");
            const firstLink = Object.values(d1.links.mp4)[0];
            const r2 = await fetch(`https://yt5s.io/api/ajaxConvert`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ vid: d1.vid, k: firstLink.k })
            });
            const d2 = await r2.json();
            if (d2?.dlink) return { video: d2.dlink, audio: d2.dlink, title: d1.t || "YouTube Video", thumbnail: thumb, username: "YouTube" };
            throw new Error("Step 2 gagal");
        },
        async () => {
            const r1 = await fetch(`https://www.y2mate.com/mates/analyzeV2/ajax`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ k_query: url, k_page: "home", hl: "en", q_auto: "0" })
            });
            const d1 = await r1.json();
            if (!d1?.vid || !d1?.links?.mp4) throw new Error("Step 1 gagal");
            const firstLink = Object.values(d1.links.mp4)[0];
            const r2 = await fetch(`https://www.y2mate.com/mates/convertV2/index`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ vid: d1.vid, k: firstLink.k })
            });
            const d2 = await r2.json();
            if (d2?.dlink) return { video: d2.dlink, audio: d2.dlink, title: d1.t || "YouTube Video", thumbnail: thumb, username: "YouTube" };
            throw new Error("Step 2 gagal");
        },
        async () => {
            const r = await fetch(`https://loader.to/api/button/?url=${encodeURIComponent(url)}&f=mp4`);
            const d = await r.json();
            if (d?.success && d?.url) return { video: d.url, audio: d.url, title: d.title || "YouTube Video", thumbnail: thumb, username: "YouTube" };
            throw new Error("API 3 gagal");
        },
    ];

    for (let i = 0; i < apis.length; i++) {
        try {
            const data = await Promise.race([
                apis[i](),
                new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), 15000))
            ]);
            if (data?.video) return res.json({ success: true, platform: "youtube", ...data });
        } catch (e) { console.warn(`YT API ${i+1} gagal:`, e.message); }
    }

    res.status(500).json({ error: "Semua API YouTube gagal. Coba lagi nanti." });
});

app.listen(PORT, () => console.log(`SSS Backend running on port ${PORT}`));
