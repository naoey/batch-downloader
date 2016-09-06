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
            OAUTH.getToken(function(err, tokens) {
                OAUTH.setCredentials(tokens);
            });
            utils.log('Authenticated');
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
    },

    searchBatch: function(batch) {
        return new Promise(function(resolve, reject) {
            var searchedBatch = [];

            batch.forEach(function(query) {
                yt.search.list({
                    q: query,
                    type: 'video',
                    maxResults: 1,
                    part: 'snippet'
                }, function(err, result) {
                    if (err) {
                        utils.log('Error searching for "'+query+'"');
                    } else {
                        searchedBatch.push(ytBaseURI+result.id.videoId);
                    }
                });
            });

            resolve(searchedBatch);
        })
    }
};
