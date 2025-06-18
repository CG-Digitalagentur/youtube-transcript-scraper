import { Actor } from 'apify';
import getTranscript from 'youtube-transcript';
import { gotScraping } from 'got-scraping';

await Actor.init();

const input = await Actor.getInput();
const { videoUrl } = input;

if (!videoUrl) {
    console.error('❌ Kein videoUrl angegeben!');
    process.exit(1);
}

console.log(`📹 Bearbeite Video: ${videoUrl}`);

// Video ID extrahieren (z. B. aus: https://www.youtube.com/watch?v=dQw4w9WgXcQ)
const videoId = new URL(videoUrl).searchParams.get('v');

if (!videoId) {
    console.error('❌ Konnte videoId aus videoUrl nicht extrahieren!');
    process.exit(1);
}

console.log(`🔍 Extrahierte videoId: ${videoId}`);

let transcript = [];
try {
    transcript = await getTranscript(videoId);
    console.log(`✅ Transcript erfolgreich geladen mit ${transcript.length} Einträgen.`);
} catch (err) {
    console.error('❌ Fehler beim Abrufen des Transkripts:', err.message);
    process.exit(1);
}

// Speichern ins Dataset
const dataset = await Actor.openDataset();
await dataset.pushData({
    videoUrl,
    videoId,
    transcript,
});

console.log('📦 Transcript im Dataset gespeichert.');

await Actor.exit();
