var request  = require('request'),
    fs       = require('fs'),
    _        = require('underscore'),
    Backbone = require('backbone'),
    moment   = require('moment'),
    debug    = require('debug')('images'),
    cheerio  = require('cheerio');

var HOST = 'https://interfacelift.com';
var HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36' };


var ImageService = function() {
  this.$ = null;
  this.sort = 'date';
  this.section = 'downloads';
  this.resolution = null;
  this.loaded = false;
  this.page   = 1;
};

ImageService.prototype.url = function() {
  var resolution = this.resolution,
      resolutionType = null;

  if (!resolution || resolution == 'all') {
    // if not resolution is specified or all is specified
    // then we just use that as the resolutionType
    resolutionType = 'all';
    resolution = null;
  } else {
    if (_.indexOf(ImageService.RESOLUTIONS, resolution) < 0) {
      throw new Error('"' + resolution + '" is not a valid resolution.');
    }
    for (var i = 0, len = ImageService.RESOLUTION_TYPES.length, TYPE, index; i < len; i++) {
      TYPE = ImageService.RESOLUTION_TYPES[i];
      index = _.indexOf(TYPE.resolutions, resolution);
      if (index > -1) {
        resolutionType = TYPE.type;
        if (index === 0) {
          // there is not resolution specified for the
          // first of the resolution types
          resolution = null;
        }
        break;
      }
    }
  }

  if (!resolutionType) {
    throw new Error('Cannot find resolution type for the resolution "' + this.resolution + '"');
  }

  var url = HOST + '/wallpaper/' + this.section + '/' + this.sort + '/' + resolutionType + '/';

  if (resolution) {
    url += resolution + '/';
  }

  url += 'index' + String(this.page) + '.html';

  return url;
};

ImageService.prototype._parseImages = function() {
  this._checkLoaded();

  var res_menu = this.$('[name="resolution"]'),
      self     = this,
      images   = [];
   
  res_menu.each(function(i) {
    var res              = self.$(this),
        onChangeSections = String(res.attr('onchange') || res.attr('onChange') || '').split("'"),
        base             = onChangeSections[1],
        id               = onChangeSections[3],
        uploaded         = null,
        padded           = String(id);

    while (padded.length < 5) { padded = '0' + padded; }

    var fileName = padded + '_' + base + '_' + self.resolution + '.jpg',
        url      = HOST + "/wallpaper/7yz4ma1/" + fileName,
        details = String(res.closest('.item').find('.details').text()).split('\n').map(function(s) { return s.trim(); });

    // loop through the details to find the
    //proper upload date
    for (var i = 0, detail, m; i < details.length; i++) {
      detail = details[i]
      m = moment(detail, 'MMMM Do, YYYY');
      if (m.isValid()) {
        uploaded = +(m.startOf('day'));
        break;
      }
    };

    images.push({ name: fileName, url: url, uploadDate: uploaded });
  });

  debug('found %s images on page %s', images.length, this.page);

  return images;
};

ImageService.prototype._parsePageNumber = function() {
  this._checkLoaded();

  var aTag = this.$('.pagenums_bottom a'),
      a    = this.$(aTag[aTag.length-2]),
      href = String(a.attr('href') || ''),
      match = href.match(/index(\d+)\.html/);

  return Number(match[1]);
};

ImageService.prototype._checkLoaded = function() {
  if (!this.loaded) {
    throw new Error('Not Loaded');
  }
};

ImageService.prototype.parse = function(body) {
  this.$        = cheerio.load(body);
  this.loaded   = true;
  this.images   = this._parseImages();
  this.maxPages = this._parsePageNumber();
};

ImageService.prototype.fetch = function(fn) {
  var self = this;
  return request({
    url: this.url(),
    headers: HEADERS
  }, function(err, resp, body) {
    if (!err) {
      debug('fetched page %s', self.page);
      self.parse(body);
      self.trigger('sync', self, resp, body);
    } else {
      debug('could not fetch page %s', self.page);
      self.trigger('error', self, err);
    }
    if (fn) {
      fn.call(self, err, resp, body);
    }
  });
};

ImageService.RESOLUTIONS = [
  // group
  ImageService.RESOLUTION_2280x1800 = '2880x1800',
  ImageService.RESOLUTION_2560x1600 = '2560x1600',
  ImageService.RESOLUTION_1920x1200 = '1920x1200',
  ImageService.RESOLUTION_1680x1050 = '1680x1050',
  ImageService.RESOLUTION_1440x900  = '1440x900',
  // group
  ImageService.RESOLUTION_3840x2160 = '3840x2160',
  ImageService.RESOLUTION_2880x1620 = '2880x1620',
  ImageService.RESOLUTION_2560x1440 = '2560x1440',
  ImageService.RESOLUTION_1920x1080 = '1920x1080',
  ImageService.RESOLUTION_1600x900  = '1600x900',
  ImageService.RESOLUTION_1280x720  = '1280x720',
  // group
  ImageService.RESOLUTION_2560x1080 = '2560x1080',
  // group
  ImageService.RESOLUTION_2560x1024 = '2560x1024',
  ImageService.RESOLUTION_2880x900  = '2880x900',
  ImageService.RESOLUTION_3200x1200 = '3200x1200',
  ImageService.RESOLUTION_3360x1050 = '3360x1050',
  ImageService.RESOLUTION_3840x1200 = '3840x1200',
  ImageService.RESOLUTION_5120x1600 = '5120x1600'
];

ImageService.RESOLUTION_TYPES = [
  {
    resolutions: [
      ImageService.RESOLUTION_2280x1800,
      ImageService.RESOLUTION_2560x1600,
      ImageService.RESOLUTION_1920x1200,
      ImageService.RESOLUTION_1680x1050,
      ImageService.RESOLUTION_1440x900 
    ],
    type: 'wide_16:10'
  },
  {
    resolutions: [
      ImageService.RESOLUTION_3840x2160,
      ImageService.RESOLUTION_2880x1620,
      ImageService.RESOLUTION_2560x1440,
      ImageService.RESOLUTION_1920x1080,
      ImageService.RESOLUTION_1600x900,
      ImageService.RESOLUTION_1280x720
    ],
    type: 'wide_16:9'
  },
  {
    resolutions: [
      ImageService.RESOLUTION_2560x1080
    ],
    type: 'wide_21:9'
  },
  {
    resolutions: [
      ImageService.RESOLUTION_2560x1024,
      ImageService.RESOLUTION_2880x900,
      ImageService.RESOLUTION_3200x1200,
      ImageService.RESOLUTION_3360x1050,
      ImageService.RESOLUTION_3840x1200,
      ImageService.RESOLUTION_5120x1600
    ],
    type: '2_screens'
  }
];

_.extend(ImageService.prototype, Backbone.Events);

ImageService.HEADERS = HEADERS;

module.exports = ImageService;