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
    .option('--client-id [key]', 'Google API auth key. Required for searching when input is not URL', null)
    .option('--client-secret [key]', 'Google API auth key. Required for searching when input is not URL', null)
    .option('-l, --log-dir [dir]', 'Dir to store logs in', 'logs')
    .option('-q, -quiet', 'No logging')
    .option('-c, --credentials [file]', 'Credentials file for Google APIs', null)
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
        if (program.clientId == null && program.clientSecret == null && program.credentials == null) {
            new Error('Google API key credentials are needed for searching videos');
        }


    }
})
.catch(function(err) {
    log(err);
});
