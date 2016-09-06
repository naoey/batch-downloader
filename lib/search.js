// author: naoey
// 06/09/2016

'use strict'

var Promise = require('bluebird');

var yt = require('youtube-api');

var utils = require('./utils');

var program = utils.getArgs();

var OAUTH = null;

var ytBaseURI = "http://www.youtube.com/watch?v=";

module.exports = {
    authenticate: function(key) {
        return new Promise(function(resolve, reject) {
            OAUTH = yt.authenticate({
                type: "oauth",
                client_id: key.client_id,
                client_secret: key.client_secret
            });
            resolve();
        })
    },

    search: function(query) {
        return new Promise(function(resolve, reject) {
            yt.search.list({
                q: query,
                type: 'video',
                maxResults: 1,
                part: 'snippet'
            }, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        query: query,
                        url: ytBaseURI+result.id.videoId
                    });
                }
            });
        });
    }
}
