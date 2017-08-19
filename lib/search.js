// author: naoey
// 06/09/2016

'use strict'

var Promise = require('bluebird');

var request = require('request');

var utils = require('./utils');

var program = utils.getArgs();

var API_KEY = null;

var ytBaseURI = "http://www.youtube.com/watch?v=";

var search = function(query) {
  return new Promise(function(resolve, reject) {
    query = encodeURIComponent(query);
    request.get('https://www.googleapis.com/youtube/v3/search?' +
      'part=snippet&maxResults=1' +
      '&q=' + query + '&key=' + API_KEY, function(err, res) {
      res = JSON.parse(res.body);
      if (err) {
        utils.log(err);
        reject(err);
      } else {
        if (res.items.length == 0) {
          resolve(null);
        } else {
          resolve(ytBaseURI + res.items[0].id.videoId);
        }
      }
    });
  });
};

module.exports = {
  authenticate: function(key) {
    API_KEY = key;
    utils.log('Got API key');
  },

  search: search,

  searchBatch: function(batch) {
    return new Promise(function(resolve, reject) {
      var searchedBatch = [];
      var failed = 0;

      batch.forEach(function(query) {
        search(query).then(function(res) {
          if (res && res.split('?v=')[1] === 'undefined') {
            console.warn(`Couldn't find any result for search query ${query}`);
            failed++;
          }
          else {
            console.info(`Found result ${res} for search query ${query}`);
            searchedBatch.push(res);
          }

          if (searchedBatch.length == (batch.length - failed))
            resolve(searchedBatch);
          }
        )
      });
    });
  }
};
