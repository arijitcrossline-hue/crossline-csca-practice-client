# Crossline Download Server

This is the VPS-side media service for Crossline. It serves Windows releases and immutable question images. Only the Cloudflare Worker can upload question images.

## Run

```bash
cd media-server
npm install
ALLOWED_ORIGIN="https://exam.crosslinecscatest.com" \
MEDIA_UPLOAD_SECRET="an-independent-random-secret-of-at-least-32-characters" \
STORAGE_DIR="/var/crossline-media" \
PORT=8080 \
npm start
```

Put Nginx/Caddy in front of it and point `media.crosslinecscatest.com` to the VPS.

## Windows App Download

The server also serves Windows client downloads from:

```text
/var/crossline-media/downloads
```

Copy the final setup installer to:

```text
/var/crossline-media/downloads/Crossline-CSCA-Practice-Setup.exe
```

It will be available at:

```text
https://media.crosslinecscatest.com/downloads/Crossline-CSCA-Practice-Setup.exe
```

## Question images

Question images are stored below `/var/crossline-media/question-images` and served from `/question-images/`. Uploads use `PUT /internal/question-images/:questionId/:filename`, require `x-crossline-media-secret`, accept only validated PNG/JPEG/WebP bytes, and are limited to 800 KB.

The same random `MEDIA_UPLOAD_SECRET` must be installed in `/etc/crossline-media.env` and as a secret on the Cloudflare Worker. Back up `/var/crossline-media/question-images` independently of the application code.

## Scheduled maintenance

`crossline-maintenance.timer` runs `maintenance.mjs` every five minutes. The script calls the Worker's private maintenance endpoint using the independent `MAINTENANCE_SECRET` stored in `/etc/crossline-maintenance.env`. The endpoint performs time-sensitive exam, email, deletion, security cleanup, and legacy image migration work.

`crossline-healthcheck.timer` independently checks the public API and media health endpoints every minute. A failed or malformed response causes `crossline-healthcheck.service` to fail and leaves the reason in the system journal.

Windows installer and ZIP patch files are served from the same directory through:

```text
https://media.crosslinecscatest.com/updates/latest.json
```
