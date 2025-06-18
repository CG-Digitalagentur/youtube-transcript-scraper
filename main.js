// main.js
const Apify = require('apify');
const { chromium } = require('playwright'); // Playwright-Browser importieren

Apify.main(async () => {
    const input = await Apify.getInput();
    const videoUrl = input.videoUrl;

    if (!videoUrl) {
        throw new Error("❌ Kein Video-Link angegeben.");
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(videoUrl, { waitUntil: 'networkidle' });

    // Ausführen im Browser-Kontext, um Transkript-URL zu extrahieren
    const result = await page.evaluate(() => {
        try {
            const ytData = window.ytInitialPlayerResponse;
            const captionTracks = ytData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

            if (!captionTracks || captionTracks.length === 0) {
                return { error: '🚫 Kein Transkript verfügbar (keine Tracks gefunden).' };
            }

            const transcriptUrl = captionTracks[0].baseUrl;
            return { transcriptUrl, videoTitle: ytData.videoDetails.title };
        } catch (err) {
            return { error: '❌ Fehler beim Parsen der Seite: ' + err.message };
        }
    });

    if (result.error) {
        console.warn("⚠️", result.error);
        await browser.close();
        return;
    }

    // Jetzt das Transkript (XML) von YouTube direkt abfragen
    const response = await Apify.utils.requestAsBrowser({
        url: result.transcriptUrl,
    });

    // XML in Klartext umwandeln
    const transcriptText = response.body
        .replace(/<[^>]+>/g, '')  // Tags entfernen
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"');

    await Apify.setValue("transcript.txt", transcriptText, { contentType: "text/plain" });

    await Apify.pushData({
        url: videoUrl,
        title: result.videoTitle,
        transcript: transcriptText,
    });

    console.log("✅ Transkript erfolgreich gespeichert.");
    await browser.close();
});
