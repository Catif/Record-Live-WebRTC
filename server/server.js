// Node modules
import { createServer } from "http";
import { Server } from "socket.io";

// Variables de configuration
import conf from "./conf/configuration.js";

// Déclaration des variables
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Gestion des événements WebSocket (socket.io)
import events from "./events/index.js";
events(io);

// Lancement
httpServer.listen(conf.port);
