# YouTube Transcript Actor

Ein Apify Actor zum Abrufen von Transkripten einzelner YouTube-Videos **oder** ganzer Kanäle.

## Eingabe

- `videoUrl` – YouTube-Video-Link oder Kanal-Link (z. B. https://www.youtube.com/@kanal)

## Ausgabe

- `transcript.json`: vollständiges Transkript mit Zeitstempeln
- `transcript.txt`: Nur Text
- Dataset-Einträge: `channel`, `title`, `videoUrl`, `transcript[]`
