// author: naoey
// 05/09/2016

'use strict'

var Promise = require('bluebird');

var program = require('commander'),
    validUrl = require('valid-url'),
    fs = require('fs');

var download = require('./lib/download'),
    search = require('./lib/search'),
    utils = require('./lib/utils');

var packageInfo = require('./package');

program
    .version(packageInfo.version)
    .option('-f, --from-file [file]', 'Download list of tracks in a file', null)
    .option('-s, --single [track]', 'Download a single track', null)
    .option('-u, --url', 'Parse tracks as URLs')
    //TODO: Handle trailing slashes in any dirnames/paths
    .option('-o, --output-dir [dir]', 'Output directory [output]', 'output')
    .option('--api-key [key]', 'Google API key', null)
    .option('-l, --log-dir [dir]', 'Dir to store logs in', 'logs')
    .option('-q, -quiet', 'No logging')
    .option('-c, --credentials [file]', 'Credentials file for Google APIs.', null)
    .parse(process.argv);

var log = utils.log;

utils.setArgs(program);

utils.checkExistingOutputDir(program.outputDir)
//TODO: Limit simultaneous downloads
.then(function() {
    if (program.url != null) {
        if (program.fromFile != null) {
            utils.getDownloadList(program.fromFile)
            .then(function(list) {
                list.forEach(function(url) {
                    if (validUrl.isUri(url)) {
                        download(url);
                    } else if (url != '') {
                        log('Invalid URL <'+url+'>');
                    }
                });
            });
        } else if (program.single != null) {
            if (validUrl.isUri(program.single)) {
                download(program.single);
            } else {
                log('Invalid URL <'+program.single+">");
            }
        } else {
            process.argv.forEach(function(url) {
                if (validUrl.isUri(url)) {
                    download(url);
                } else if (url != '') {
                    log('Invalid URL <'+url+'>');
                }
            })
        }
    } else {
        var key = null;

        if (program.credentials != null && program.credentials.indexOf('.json') == program.credentials.length-5) {
            var creds = require(program.credentials);
            key = creds.youtube.key;
        } else if (program.credentials != null && program.credentials.indexOf('.txt') == program.credentials.length-4) {
            key = fs.readFileSync('program.credentials', 'utf-8').split('\n');
        } else if (program.apiKey != null) {
            key = program.apiKey;
        } else {
            utils.log('Missing Google API key');
            return new Error('Missing Google API key');
        }

        search.authenticate(key);
        if (program.fromFile != null) {
            utils.getDownloadList(program.fromFile)
            .then(function(list) {
                var cleanedList = [];
                list.forEach(function(item) {
                    if (item.length > 0) {
                        cleanedList.push(utils.clean(item));
                    }
                });

                return search.searchBatch(cleanedList);
            })
            .then(function(urls) {
                urls.forEach(function(url) {
                    download(url);
                });
            });
        } else if (program.single != null) {
            search.search(utils.clean(program.single))
            .then(function(url) {
                download(url);
            });
        }
    }
})
.catch(function(err) {
    log(err);
});
