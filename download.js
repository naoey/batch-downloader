// author: naoey
// 05/09/2016

'use strict'

var Promise = require('bluebird');

var yt = require('youtube-api'),
    ytdl = require('youtube-dl'),
    fs = require('fs'),
    readline = require('readline'),
    program = require('commander'),
    exec = require('child_process').exec,
    validUrl = require('valid-url');

var packageInfo = require('./package');

program
    .version(packageInfo.version)
    .option('-f, --from-file [file]', 'Download list of tracks in a file', null)
    .option('-s, --single [track]', 'Download a single track', null)
    .option('-u, --url', 'Parse tracks as URLs')
    .option('-o, --output-dir [dir]', 'Output directory [output]', 'output')
    //TODO: Handle trailing slashes in any dirnames/paths
    .option('-a, --auth-key [key]', 'Google API auth key. Required for searching when input is not URL', null)
    .option('l, --log-dir [dir]', 'Dir to store logs in', 'logs')
    .parse(process.argv);

if (!fs.existsSync(program.logDir)) {
    fs.mkdirSync(program.logDir);
}

var logf = fs.openSync(program.logDir+"/runlog_"+Date.now()+".txt", "a");

var getDownloadList = function(file) {
    return new Promise(function(resolve, reject) {
        fs.readFile(file, 'utf-8', function(err, data) {
            if (err) reject(err);
            else resolve(data.split('\n'));
        });
    });
};

var search = function(query, callback) {
    yt.search.list({
        q: query,
        type: 'video',
        maxResults: 1,
        part: 'snippet'
    }, function(err, result) {

    });
};

//TODO: Skip video download and get audio only

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

var removeTmpFile = function(filename) {
    return new Promise(function(resolve, reject) {
        fs.unlink(filename, function(err) {
            if (err) reject(err);
            else resolve();
        });
    });
}

//TODO: Add metadata handler

var checkExistingOutputDir = function(dirname) {
    return new Promise(function(resolve, reject) {
        fs.stat(dirname, function(err, stat) {
            if (err && err.code == 'ENOENT') {
                log("Output dir doesn't exist, creating");
                fs.mkdir(dirname, resolve);
            } else if (!stat.isDirectory()) {
                log("Output dir doesn't exist, creating");
                fs.mkdir(dirname, resolve);
            } else if (err) {
                reject(err);
            } else {
                log("Output dir already exists");
                resolve();
            }
        });
    });
};

var log = function(msg) {
    return new Promise(function(resolve, reject) {
        var logmsg = Date().toLocaleString() + ": " + msg;

        fs.write(logf, logmsg+"\n", function(err) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                console.log(logmsg);
                resolve();
            }
        });
    });
}

//TODO: Limit simultaneous downloads
checkExistingOutputDir(program.outputDir)
.then(function() {
    if (program.url) {
        if (program.fromFile != null) {
            getDownloadList(program.fromFile)
            .then(function(list) {
                list.forEach(function(url) {
                    if (validUrl.isUri(url)) {
                        log("Starting download of "+url)
                        .then(function() {
                            return downloadVid(url);
                        })
                        .then(function(localFile) {
                            return extractAudio(localFile);
                        })
                        .then(function(localFile) {
                            log("Downloaded "+localFile.result);
                            return removeTmpFile(localFile.source);
                        });
                    }
                });
            })
            .catch(function(err) {
                log(err);
            });
        } else if (program.single != null) {
            log("Starting download of "+program.single)
            .then(function() {
                return downloadVid(program.single);
            })
            .then(function(localFile) {
                return extractAudio(localFile);
            })
            .then(function(localFile) {
                log("Downloaded "+localFile.result);
                return removeTmpFile(localFile.source);
            })
            .catch(function(err) {
                log(err);
            });
        } else {
            process.argv.forEach(function(track) {
                if (validUrl.isUri(track)) {
                    log("Starting download of "+track)
                    .then(function() {
                        return downloadVid(track);
                    })
                    .then(function(localFile) {
                        return extractAudio(localFile);
                    })
                    .then(function(localFile) {
                        log("Downloaded "+localFile.result);
                        return removeTmpFile(localFile.source);
                    })
                    .catch(function(err) {
                        log(err);
                    });
                }
            });
        }
    } else {
        if (!program.authKey) {
            new Exception('Missing Google API key');
        }
    }
})
.catch(function(err) {
    log(err);
});
