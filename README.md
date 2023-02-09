# Record in Real Time WebRTC Live Streaming

This is an example of how to record a live stream in real time using RTCMulticonnection and NodeJS.

This project is in link with a bigger students project name [Scudo](https://github.com/Catif/LP-PTUT_Scudo) (actually private).

## Why this project ?

This project is a part of a bigger project. The goal of this project is to record a live stream in real time and to watch it later. The important part is when the user exit the page, the stream will stop by the server and transcode it to a video file. The user can watch the video file later.


## How to run this project?
### Client
You didn't nothing to do in client side. Just open what you want to do :
* `streamer.html` for recording a live stream
* `viewer.html` for watching a live stream
* `video.html` for watching a recorded video

### Server
You need to install NodeJS and NPM. Then, you need to install the dependencies :
```
npm install
```
Finally, you can run the server :
```
node server.js
```

#### Configuration
You can configure the server in `conf/configuration.js` file.

## How to use it?
### Streamer
You need to open `streamer.html` in your browser. Then, you need to write the name of the room and click on `Lancement de l'enregistrement` button. And when you want to stop the recording, you need to click on `Arrêt de l'enregistrement` button.

### Viewer
You need to open `viewer.html` in your browser. Then, you need to write the name of the room and click on `Regarder` button. And when you want to stop the watching, you can just left the page.

### Video
You need to open `video.html` in your browser. Then, you need to write the name of the file video and click on `Regarder` button. And when you want to stop the watching, you can just left the page.