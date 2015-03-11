/*global process*/


// ===========================================================================
// BASE SETUP
// ===========================================================================


var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('./logger.js')(__filename);
var path = require('path');
var MobileDetect = require('mobile-detect');

logger.info('starting MindUp public server ;)');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public/static'));
app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

process.on('SIGINT', function () {
    logger.info('stopping MindUp (SIGINT) :\'(');
    process.exit(0);
});

process.on( 'SIGTERM', function() {
    logger.info('stopping MindUp (SIGTERM) :\'(');
    process.exit(0);
});

// ===========================================================================
// MIDDLEWARE
// ===========================================================================


function getDownloadPage(req, res, next) {
    var md = new MobileDetect(req.headers['user-agent']);

    switch (md.os()) {
    case 'AndroidOS':
        // res.send('AndroidOS');
        res.download('public/release/MindUp_last.apk');
        break;
    case 'iOS':
        res.send('iOS');
        break;
    default:
        res.render('index.html');
    }
}

function getLandingPage(req, res, next) {
    var md = new MobileDetect(req.headers['user-agent']);

    res.render('landing.html', { os: md.os() });
    // res.render('landing.html');
}

function logMdw(req, res, next) {
    logger.verbose(req.method, req.url);
    next();
}

function basicErrorHandler(err, req, res, next) {
    if (!err) {
        return logger.error('function basicErrorHandler, err arg is null, ' +
                            'shouldn\'t happend');
    }

    logger.error(err.stack);

    res.status(500);
    res.send(err.message || 'oops! something broke');
}

function handleError404(req, res, next) {
    logger.verbose('Error 404', req.method, req.url);

    res.status(404);
    res.send('<pre> ^ ^\n{O,O}\n/)_)\n " " Nothing here\n</pre>');
}


// ===========================================================================
// ROUTES
// ===========================================================================


var router = express.Router();

router.use(logMdw);
router.get('/', getDownloadPage);
router.get('/landing', getLandingPage);
router.use(basicErrorHandler);
router.get('*', handleError404);
router.post('*', handleError404);

app.use('/', router);


// ===========================================================================
// START THE SERVER
// ===========================================================================


var server = app.listen(8080, function () {

    var host = server.address().address;
    var port = server.address().port;

    logger.info('MindUp public server listening at http://%s:%s', host, port);
});
