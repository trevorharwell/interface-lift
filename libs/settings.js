var fs           = require('fs'),
    path         = require('path'),
    mkdirp       = require('mkdirp'),
    _            = require('underscore'),
    ILImages     = require('./images');

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

var SETTINGS_PATH = path.join(getUserHome(), '.interface-lift');
var SETTINGS_JSON_PATH = path.join(SETTINGS_PATH, 'config.json');

var CONFIG = {
  DOWNLOAD_PATH : path.join(getUserHome(), 'InterfaceLift'),
  RESOLUTION    : ILImages.RESOLUTION_2280x1800
};

mkdirp.sync(SETTINGS_PATH);

if (!fs.existsSync(SETTINGS_JSON_PATH)) {
  fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(CONFIG));
} else {
  try {
    CONFIG = JSON.parse(fs.readFileSync(SETTINGS_JSON_PATH));
  } catch (e) {
    // do nothing
    CONFIG = {};
  }
}

function saveSettings() {
  fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(CONFIG));
}

var settings = {
  SETTINGS_PATH      : SETTINGS_PATH,
  SETTINGS_JSON_PATH : SETTINGS_JSON_PATH,
  save: function() {
    saveSettings();
    return settings;
  },
  set: function(key, value) {
    CONFIG[key] = value;
    saveSettings();
    return settings;
  },
  unset: function(key) {
    delete CONFIG[key];
    saveSettings();
    return settings;
  },
  get: function(key) {
    return CONFIG[key];
  },
  keys: function() {
    return _.keys(CONFIG);
  }
};

module.exports = settings;