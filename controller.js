var fs           = require('fs'),
    path         = require('path'),
    settings     = require('./libs/settings'),
    ILImages     = require('./libs/images'),
    Downloader   = require('./libs/downloader'),
    moment       = require('moment'),
    inquirer     = require('inquirer'),
    _            = require('underscore');

require('colors');

var controller = {

  printConfig: function(key, value) {
    console.log(String(key).yellow, ' -> ', String(value || 'unkown').green);
  },

  download: function() {
    var ilImages = new ILImages(),
        downloader   = new Downloader(settings.get('DOWNLOAD_PATH'));

    if (!settings.get('DOWNLOAD_PATH')) {
      console.log('You have not specified a DOWNLOAD_PATH in your config!'.red);
      return;
    }

    // set the page
    ilImages.page = 1;
    // set the user's configured resolution
    ilImages.resolution = settings.get('RESOLUTION');

    downloader
        .on('downloaded', function(image) {
          console.log('Downloaded', image.name.green);
        })
        .on('error', function(e, image) {

        });

    ilImages
        .on('sync', function() {
          console.log(String('Starting Page ' + ilImages.page + ' Downloads...').yellow);

          downloader
              .downloadAll(ilImages.images)
              .once('drain', function() {
                if (ilImages.page <= ilImages.maxPages) {
                  promptContinue();
                } else {
                  console.log('All Done'.green);
                }
              });
        })
        .on('error', function(self, e) {
          console.log('OOPS! We could not download something...'.red); 
          console.log(e);
        })

    

    function promptContinue() {
      inquirer.prompt([
        {
          name: 'download',
          type: 'confirm',
          message: function() {
            return 'You have downloaded page ' 
              + ilImages.page + ' of ' 
              + ilImages.maxPages 
              + '. Would you like to download more?';
          }
        }
      ], function(answers) {
        if (answers.download) {
          ilImages.page++;
          ilImages.fetch();
        }
      });
    }

    ilImages.fetch();
  },

  sync: function() {
    var ilImages      = new ILImages(),
        DOWNLOAD_PATH = settings.get('DOWNLOAD_PATH'),
        SYNC_DATE     = moment(settings.get('SYNC_DATE') || 0),
        downloader    = new Downloader(DOWNLOAD_PATH);

    if (!DOWNLOAD_PATH) {
      console.log('You have not specified a DOWNLOAD_PATH in your config!'.red);
      return;
    }

    function isDownloaded(image) {
      if (fs.existsSync(path.join(DOWNLOAD_PATH, image.name))) {
        return true;
      }
    };

    function isAfterSyncDate(image) {
      return moment(image.uploadDate).isAfter(Number(SYNC_DATE));
    };

    function next() {
      ilImages.page++;
      if (ilImages.page <= ilImages.maxPages) {
        ilImages.fetch()
      } else if (!downloader.queue.started){
        // if the downloaded never started 
        // and we have gone through all the pages
        // then there is nothing to get!
        console.log('No new images.');
      } else {
        
      }
    };

    var downloadedCount = 0;
    // set the page
    ilImages.page = 1;
    // set the user's configured resolution
    ilImages.resolution = settings.get('RESOLUTION');

    downloader
        .on('downloaded', function(image) {
          downloadedCount++;
          console.log('Downloaded', image.name.green);
        })
        .on('drain', function() {
          console.log('Downloaded', String(downloadedCount).green, 'new images');
          settings.set('SYNC_DATE', +moment());
        })
        .on('error', function(e, image) {
          // something could not be downloaded
        });

    ilImages
        .on('sync', function() {
          // only have images that we have not already
          // downloaded
          var images = _.chain(ilImages.images)
              .reject(isDownloaded)
              .filter(isAfterSyncDate)
              .value();

          // download all these images
          downloader.downloadAll(images);

          // grab the next set of images to be downloaded
          next();
        })
        .on('error', function(self, e) {
          console.log('OOPS! We could not download anything...'.red); 
          console.log(e);
        });

    ilImages.fetch();
  }

};

module.exports = controller;