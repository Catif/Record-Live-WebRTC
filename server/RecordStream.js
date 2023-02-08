// Node modules
import { createServer } from "http";
import { Server } from "socket.io";

// Own modules
import { access } from "./utils/function.js";
import conf from "./conf/configuration.js";

// Déclaration des variables
const httpServer = createServer();
const port = conf.port;
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ============================================
// Gestion des événements WebSocket (socket.io)
// ============================================
import initUser from "./events/initUser.js";
import runStream from "./events/runStream.js";
import recordVideo from "./events/recordVideo.js";
import disconnect from "./events/disconnect.js";

io.on("connection", (socket) => {
  console.log("New connection");

  // Vérification des paramètres de connexion au serveur
  access(socket, socket.handshake.query);

  // Variables globales
  var user = {};
  var file = {};

  // Ajout des roles
  socket.on("initUser", (event) => {
    initUser(event, user, file);
  });

  // Ajout du socket à la liste des sockets de RTCMultiConnectionServer
  socket.on("runStream", (event) => {
    runStream(socket);
  });

  socket.on("recordVideo", (event) => {
    recordVideo(event, user, file, conf);
  });

  socket.on("disconnect", (event) => {
    disconnect(socket, user, file);
  });
});

// ==============================
//          Lancement
// ==============================
httpServer.listen(port);
