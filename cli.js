var cli          = require('commander'),
    fs           = require('fs'),
    path         = require('path'),
    settings     = require('./libs/settings'),
    _            = require('underscore'),
    controller   = require('./controller');

require('colors');

cli
    .version('0.0.1')

cli
    .command('config')
    .description('View Current Config')
    .action(function() {
      var keys = settings.keys(),
          max  = 0;
      _.each(keys, function(key) {
        max = Math.max(key.length, max);
      });
      _.each(keys, function(key) {
        var value = settings.get(key);
        while (key.length < max) { key += ' '; }
        controller.printConfig(key, value);
      });
    });

cli
    .command('set:config <key> <value>')
    .description('Set the value for a config field')
    .action(function(key, value) {
      settings.set(key, value);
      controller.printConfig(key, value);
    });

cli
    .command('unset:config <key>')
    .description('Unset the value for a config field')
    .action(function(key) {
      settings.unset(key);
      controller.printConfig(key, null);
    });

cli
    .command('get:config <key>')
    .description('Get the value for a config field')
    .action(function(key) {
      var value = settings.get(key);
      controller.printConfig(key, value);
    })

cli
    .command('download')
    .description('Download Latest Images')
    .action(function() {
      controller.download();
    });

cli
    .command('sync')
    .description('Sync All Images')
    .action(function() {
      controller.sync();
    });


cli.parse(process.argv);

if (process.argv.length < 3) {
  cli.help();
}