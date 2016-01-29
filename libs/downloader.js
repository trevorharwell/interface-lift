var request      = require('request'),
    fs           = require('fs'),
    ILImages     = require('./images'),
    path         = require('path'),
    _            = require('underscore'),
    Backbone     = require('backbone'),
    async        = require('async'),
    mkdirp       = require('mkdirp');

function ImageDownloader(p, maxConcurrency) {
  var self = this;
  this.path = p;
  this.maxConcurrency = maxConcurrency || 3;

  this.queue = async.queue(function(image, callback) {
    self.download(image, callback);
  }, this.maxConcurrency);

  this.queue.drain = function() {
    self.trigger('drain');
  };

  this.queue.empty = function() {
    self.trigger('empty');
  };

  mkdirp.sync(this.path);
};

ImageDownloader.prototype.download = function(image, done) {
  var ev = request({
    url: image.url,
    headers: ILImages.HEADERS
  }, done)
  .pipe(fs.createWriteStream(path.join(this.path, image.name)));

  return ev;
};

ImageDownloader.prototype.downloadAll = function(images) {
  var self = this,
      q    = this.queue;

  _.each(images, function(image) {
    q.push(image, function(err) {
      if (!err) {
        self.trigger('downloaded', image);
      } else {
        self.trigger('error', err, image);
      }
    });
  }, this);

  return this;
};

_.extend(ImageDownloader.prototype, Backbone.Events);

module.exports = ImageDownloader;