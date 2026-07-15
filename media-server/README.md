# Crossline Download Server

This is the VPS-side download and update service for the Crossline Windows client.

## Run

```bash
cd media-server
npm install
ALLOWED_ORIGIN="https://exam.crosslinecscatest.com" \
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

Windows installer and ZIP patch files are served from the same directory through:

```text
https://media.crosslinecscatest.com/updates/latest.json
```
