import { Actor } from 'apify';
import { getTranscript } from 'youtube-transcript';
import { gotScraping } from 'got-scraping';

await Actor.init();

const { channelId, playlistId, url, videoId } = await Actor.getInput();
const finalDataset = await Actor.openDataset();

const videoIds = new Set();

async function extractFromChannel(channelId) {
    const apiUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const res = await gotScraping(apiUrl);
    const matches = [...res.body.matchAll(/<yt:videoId>(.*?)<\/yt:videoId>/g)];
    matches.forEach(match => videoIds.add(match[1]));
}

async function extractFromPlaylist(playlistId) {
    let page = 1;
    while (true) {
        const playlistApi = `https://yt.lemnoslife.com/noKey/playlistItems?playlistId=${playlistId}&page=${page}`;
        const { body } = await gotScraping({ url: playlistApi, responseType: 'json' });
        if (!body || !body.items || body.items.length === 0) break;
        for (const item of body.items) {
            videoIds.add(item.video.videoId);
        }
        page++;
    }
}

if (channelId) await extractFromChannel(channelId);
if (playlistId) await extractFromPlaylist(playlistId);
if (url) {
    const idMatch = url.match(/v=([a-zA-Z0-9_-]{11})/);
    if (idMatch) videoIds.add(idMatch[1]);
}
if (videoId) videoIds.add(videoId);

for (const id of videoIds) {
    const videoUrl = `https://www.youtube.com/watch?v=${id}`;
    try {
        const transcript = await getTranscript(id);
        const plainText = transcript.map(x => x.text).join(' ');
        await finalDataset.pushData({
            videoId: id,
            url: videoUrl,
            transcript: plainText,
        });
    } catch (err) {
        await Actor.pushData({
            videoId: id,
            url: videoUrl,
            error: `Kein Transkript verfügbar: ${err.message}`
        });
    }
}

await Actor.exit();
