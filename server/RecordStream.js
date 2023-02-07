const { createWriteStream, statSync, unlinkSync } = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const url = require("url");

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 9999 });

// Const folder video
const folderTemp = "./video/temp";
const folderTranscode = "./video/transcode";

// Gestion des streams
wss.on("connection", (socket, req) => {
  console.log("Client connected");

  const parameters = url.parse(req.url, true);

  if (parameters.query.role && parameters.query.id) {
    socket.role = parameters.query.role;
    socket.id = parameters.query.id;

    if (socket.role == "streamer") {
      console.log("Client connected as streamer");
      var tempFile = null;
      var id = Date.now();
      var filename = `video-${id}`; // exemple : video-1620000000000
    } else if (socket.role == "viewer") {
      console.log("Client connected as viewer");
    }
  } else {
    console.log("Client disconnected caused by bad parameters");
    socket.close();
  }

  socket.on("message", (message) => {
    if (socket.role == "streamer") {
      if (!tempFile) {
        console.log("Stream started");
        tempFile = createWriteStream(`${folderTemp}/${filename}.tmp`);
      }
      tempFile.write(message);
    }
  });

  socket.on("close", () => {
    if (socket.role == "streamer") {
      console.log("Fin d'un stream");

      tempFile.end();
      transcodeVideo(filename);

      // Fermeture des viewers
      wss.clients.forEach((client) => {
        if (client.role == "viewer" && client.id == socket.id) {
          client.close();
          console.log("Viewer disconnected by ending stream");
        }
      });
    } else if (socket.role == "viewer") {
      console.log("Viewer disconnected");
    }
  });
});

// ==============================
//          fonctions
// ==============================
function getStatFile(file, durationTranscode) {
  const BYTES_MO = 1024 * 1024;
  let fileSizeInBytes = statSync(file).size;
  var fileSizeInMegabytes = fileSizeInBytes / BYTES_MO;
  var sizeMo = Math.round(fileSizeInMegabytes * 100) / 100;
  ffmpeg.ffprobe(file, (err, metadata) => {
    let duration = Math.round(100 * metadata.format.duration) / 100;
    console.log(
      `Fichier crée : ${file} | durée de la vidéo : ${duration} s  | taille : ${sizeMo} Mo | temps de conversion : ${durationTranscode} s`
    );
  });
}

function transcodeVideo(filename) {
  // Setting transcode
  const extensionFile = "mp4";
  const codec = "libx264"; // libx264, libx265, libvpx, libvpx-vp9, libaom-av1
  const preset = "ultrafast"; // Processeur => test avec 1min de vidéo : ultrafast (10s), superfast(21s), veryfast(24s), faster(34s), fast(36s), medium, slow, slower, veryslow
  const quality = 22; // Stockage => test avec 1min de vidéo : 0 (100-150Mo) à 51 (3Mo)  ==>  15 (70Mo)
  let startTime = performance.now();

  ffmpeg()
    .input(`${folderTemp}/${filename}.tmp`)
    .withVideoCodec(codec)
    .addOption("-preset", preset)
    .addOption("-crf", quality)
    .output(`${folderTranscode}/${filename}.${extensionFile}`)
    .on("end", () => {
      let endTime = performance.now();
      let durationTranscode = Math.round(endTime - startTime) / 1000;

      console.log("Conversion complete");

      getStatFile(`${folderTranscode}/${filename}.${extensionFile}`, durationTranscode);
      unlinkSync(`${folderTemp}/${filename}.tmp`); // Delete file temp
    })
    .run();
}
