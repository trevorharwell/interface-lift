var ILImages     = require('./libs/images'),
    Downloader   = require('./libs/downloader'),
    fs           = require('fs');


var ilImages = new ILImages();
var downloader   = new Downloader(__dirname + '/images');

ilImages.resolution = ILImages.RESOLUTION_2280x1800;

ilImages
    .parse(fs.readFileSync(__dirname + '/test.html'));