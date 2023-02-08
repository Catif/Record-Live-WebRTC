import { createWriteStream } from "fs";

export default (event, user, file, conf) => {
  if (user.role == "streamer") {
    if (!file.tempFile) {
      console.log("Stream started");
      file.tempFile = createWriteStream(`${conf.folderTemp}/${file.filename}.tmp`);
    }
    file.tempFile.write(event.video);
  }
};
