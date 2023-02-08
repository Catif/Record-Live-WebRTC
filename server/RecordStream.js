const { createWriteStream, statSync, unlinkSync } = require("fs");
const ffmpeg = require("fluent-ffmpeg");

const RTCMultiConnectionServer = require("rtcmulticonnection-server");

const { createServer } = require("http");
const httpServer = createServer();
const port = 3000;
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Const folder video
const folderTemp = "./video/temp";
const folderTranscode = "./video/transcode";

// ============================================
// Gestion des événements WebSocket (socket.io)
// ============================================
io.on("connection", (socket) => {
  console.log("New connection");

  const parameters = socket.handshake.query;
  access(socket, parameters);

  // Variables globales
  var user = {};
  var file = {};

  socket.on("initUser", (event) => {
    console.log("Init user");

    user.role = event.role;
    console.log("Role : " + user.role);

    if (user.role == "streamer") {
      console.log("Streamer connected");
      initFileVar(file);
    } else if (user.role == "viewer") {
      console.log("Viewer connected");
    }
  });

  socket.on("runStream", (event) => {
    console.log("Run stream");

    RTCMultiConnectionServer.addSocket(socket);
  });

  socket.on("record", (role) => {
    initFileVar(file);
  });

  socket.on("recordVideo", (event) => {
    if (user.role == "streamer") {
      if (!file.tempFile) {
        console.log("Stream started");
        file.tempFile = createWriteStream(`${folderTemp}/${file.filename}.tmp`);
      }
      file.tempFile.write(event.video);
    }
  });

  socket.on("disconnect", () => {
    if (user.action == "live") {
      // disconnect-with is a event handled by RTCMultiConnectionServer to disconnect a specific socket
      socket.emit("disconnect-with", socket.client.conn.id);
    }
    if (user.role == "streamer") {
      console.log("Fin d'un stream");

      file.tempFile.end();
      transcodeVideo(file.filename);

      // Fermeture des sockets viewers
      // wss.clients.forEach((client) => {
      //   if (client.role == "viewer" && client.id == socket.id) {
      //     client.close();
      //     console.log("Viewer disconnected by ending stream");
      //   }
      // });
    } else if (user.role == "viewer") {
      console.log("Viewer disconnected");
    }
  });
});

// ==============================
//          fonctions
// ==============================
function access(socket, params) {
  if (!params.sessionid && params.socketEventCustom && !params.msgEvent) {
    console.log("Client disconnected caused by bad parameters");
    socket.disconnect();
  }
}

function initFileVar(file) {
  file.tempFile = null;
  file.id = Date.now();
  file.filename = `video-${file.id}`; // exemple : video-1620000000000
}

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

  // Path
  let pathFileTemp = `${folderTemp}/${filename}.tmp`;
  let pathFileTranscode = `${folderTranscode}/${filename}.${extensionFile}`;

  // Transcode
  let startTime = performance.now();
  ffmpeg()
    .input(pathFileTemp)
    .withVideoCodec(codec)
    .addOption("-preset", preset)
    .addOption("-crf", quality)
    .output(pathFileTranscode)
    .on("end", () => {
      // Calcul du temps de conversion
      let endTime = performance.now();
      let durationTranscode = Math.round(endTime - startTime) / 1000;

      console.log("Conversion complete");

      getStatFile(pathFileTranscode, durationTranscode);
      unlinkSync(pathFileTemp); // Delete file temp
    })
    .run();
}

// ==============================
//          Lancement
// ==============================
httpServer.listen(port);
