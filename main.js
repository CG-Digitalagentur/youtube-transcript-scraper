global.fetch = require('node-fetch');
const Apify = require('apify');
const { YoutubeTranscript } = require('youtube-transcript');
const cheerio = require('cheerio');

Apify.main(async () => {
    const { videoUrl } = await Apify.getInput();
    if (!videoUrl) throw new Error('❌ videoUrl fehlt.');

    const isChannel = videoUrl.includes('/@') || videoUrl.includes('/channel/');
    let videoLinks = [];

    if (isChannel) {
        console.log('🔎 Kanal erkannt, lade Videos...');
        const res = await Apify.utils.requestAsBrowser({
            url: videoUrl + '/videos',
        });

        const $ = cheerio.load(res.body);
        const videoIds = new Set();
        $('a#video-title').each((_, el) => {
            const href = $(el).attr('href');
            const match = href && href.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
            if (match) videoIds.add(match[1]);
        });

        videoLinks = [...videoIds].map(id => `https://www.youtube.com/watch?v=${id}`);
    } else {
        videoLinks = [videoUrl];
    }

    for (const link of videoLinks) {
        const match = link.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (!match) continue;
        const videoId = match[1];

        let transcript;
        try {
            transcript = await YoutubeTranscript.fetchTranscript(videoId);
        } catch (err) {
            console.warn(`⚠️ Kein Transkript für ${link}: ${err.message}`);
            continue;
        }

        const text = transcript.map(t => `[${t.start.toFixed(1)}s] ${t.text}`).join('\n');

        let title = '', channel = '';
        try {
            const res = await Apify.utils.requestAsBrowser({
                url: `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
                json: true
            });
            title = res.body.title;
            channel = res.body.author_name;
        } catch {}

        await Apify.pushData({
            channel,
            title,
            videoUrl: link,
            transcript: transcript,
        });

        if (videoLinks.length === 1) {
            await Apify.setValue('transcript.txt', text, { contentType: 'text/plain' });
            await Apify.setValue('transcript.json', transcript, { contentType: 'application/json' });
        }

        console.log(`✅ ${title}`);
    }

    console.log('🎉 Alles fertig!');
});
