const ffmpeg = require('ffmpeg');

const processAudioToRaw = async (origFile, procFile) => {
    //Process the audio file using ffmpeg, convert it to raw.
    try {
        const process = await new ffmpeg(origFile);
        process.addCommand("-y");
        process.addCommand("-acodec", "pcm_s16le");
        process.addCommand("-f", "s16le");
        process.addCommand("-ac", "1");
        process.addCommand("-ar", "44100");
        const file = await process.save(procFile);

        return file;
    }
    catch (err) {
        console.log(err);
    }
}

module.exports = {
    processAudioToRaw
}