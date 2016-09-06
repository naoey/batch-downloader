// author: naoey
// 06/09/2016

'use strict'

var Promise = require('bluebird');

var fs = require('fs');

var logf = null;

var program = null;

module.exports = {
    setArgs: function(args) {
        program = args;
    },

    getArgs: function() {
        return program;
    },

    clean: function(string) {
        if (string.length == 0) return;

        var cleaned = '';

        var skippables = [
            '"', '\'', '」', '「', '【', '】',　'『', '』', '-'
        ];

        for (var i = 0; i < string.length; i++) {
            if (skippables.indexOf(string[i]) <= 0) {
                cleaned += string[i];
            }
        }

        return cleaned;
    },

    getDownloadList: function(file) {
        return new Promise(function(resolve, reject) {
            fs.readFile(file, 'utf-8', function(err, data) {
                if (err) reject(err);
                else resolve(data.split('\n'));
            });
        });
    },

    log: function(msg) {
        return new Promise(function(resolve, reject) {
            if (logf == null) {
                if (!program.quiet) {
                    if (!fs.existsSync(program.logDir)) {
                        fs.mkdirSync(program.logDir);
                    }

                    logf = fs.openSync(program.logDir+"/runlog_"+Date.now()+".txt", "a");
                }
            }

            if (program.quiet) {
                resolve();
            } else {
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
            }
        });
    },

    checkExistingOutputDir: function(dirname) {
        return new Promise(function(resolve, reject) {
            fs.stat(dirname, function(err, stat) {
                if (err && err.code == 'ENOENT') {
                    module.exports.log("Output dir doesn't exist, creating");
                    fs.mkdir(dirname, resolve);
                } else if (!stat.isDirectory()) {
                    module.exports.this.log("Output dir doesn't exist, creating");
                    fs.mkdir(dirname, resolve);
                } else if (err) {
                    reject(err);
                } else {
                    module.exports.log("Output dir already exists");
                    resolve();
                }
            });
        });
    },

    removeTmpFile: function(filename) {
        return new Promise(function(resolve, reject) {
            fs.unlink(filename, function(err) {
                if (err) reject(err);
                else resolve(true);
            });
        });
    }
};
