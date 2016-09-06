// author: naoey
// 06/09/2016

'use strict'

var Promise = require('bluebird');

var fs = require('fs'),
    ytdl = require('youtube-dl'),
    exec = require('child_process').exec;

var utils = require('./utils');

var program = null;

var downloadVid = function(url) {
    return new Promise(function(resolve, reject) {
        var video = ytdl(url);

        var data = {
            tmpname: program.outputDir+"/"+Date.now() + ".mp4",
        }

        video.on('info', function(info) {
          data.title = info.title;
          data.size = info.size;
          data.resolution = info.resolution;
        });

        video.pipe(fs.createWriteStream(data.tmpname));

        video.on('end', function() {
            resolve(data);
        });
    });
};

var extractAudio = function(data) {
    return new Promise(function(resolve, reject) {
        var outputname = program.outputDir+"/"+data.title+".mp3";
        var cmd = 'ffmpeg -i "'+data.tmpname+'" -vn -ar 44100 -ac 2 -ab 192k -f mp3 "'+outputname+'"';

        if (fs.existsSync(outputname)) {
            fs.unlinkSync(outputname);
        }

        exec(cmd, function(err, stdout, stderr) {
            if (err) reject(err);
            else resolve({
                source: data.tmpname,
                result: outputname
            });
        });
    });
};

module.exports = function(url) {
    if (program == null) {
        program = utils.getArgs();
    }
    
    return new Promise(function(resolve, reject) {
        utils.log("Starting download of "+url)
        .then(function() {
            return downloadVid(url);
        })
        .then(function(tmpFile) {
            return extractAudio(tmpFile);
        })
        .then(function(downloadedFile) {
            utils.log("Downloaded "+downloadedFile.result);
            return utils.removeTmpFile(downloadedFile.source);
        })
        .then(function(cleanRes) {
            if (cleanRes) utils.log("Cleaned temp file");
            else utils.log("Error cleaning temp file");
            resolve();
        });
    });
};
