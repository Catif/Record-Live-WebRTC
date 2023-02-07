const { resolve } = require("path");
const { createReadStream, statSync } = require("fs");

const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/api/video", (req, res) => {
  if (!req.query.video || !req.query.video.match(/^[a-z0-9-_]+\.mp4$/i)) {
    res.status(400).send("Require query parameter video");
  }

  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range header");
  }

  const videoPath = resolve("video/transcode", req.query.video);
  const videoSize = statSync(videoPath).size;

  const CHUNK_SIZE = 2 * 10 ** 6; // 2MB
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  const contentLength = end - start + 1;

  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  res.writeHead(206, headers);
  const videoStream = createReadStream(videoPath, { start, end });
  videoStream.pipe(res);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
