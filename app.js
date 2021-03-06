/*global process*/


// ===========================================================================
// BASE SETUP
// ===========================================================================


var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('./logger.js')(__filename);
var MobileDetect = require('mobile-detect');
var mail = require('./mail.js');
// var mongoskin = require('mongoskin');
var evt = require('../common/node/recEvent.js');
var getReqIp = require('../common/node/expressHelper.js').reqIp;
var locale = require('locale');
var supportedLocales = ['en', 'fr'];

// var API_BASEURL = 'http://api0.mindup.io';
// var API_BASEURL = 'http://localhost:5000';

// var mongo = {
//     user: 'mindup_server',
//     pass: 'BVm0YTOT4we1UBlwHzxNisotKHMoopuMj2yPFRbfBi0='
// };

// var db = mongoskin.db(
//     'mongodb://' + mongo.user + ':' + mongo.pass + '@localhost/mindup',
//     {safe:true}
// );

logger.info('starting MindUp public server ;)');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(locale(supportedLocales));

app.use(express.static(__dirname + '/public/static'));
app.use(express.static(__dirname + '/../ressources'));
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


function getRoot(req, res, next) {
    var host = req.get('host');
    var md = new MobileDetect(req.headers['user-agent']);

    logger.info('host: ' + host);

    getLandingPage(req, res, next);

    // if (host === 'app.mindup.io' && md.os() === 'AndroidOS') {
    //     getDownloadPage(req, res, next);
    // } else {
    //     getLandingPage(req, res, next);
    // }
}

// TODO: maybe deprecated
function getDownloadPage(req, res, next) {
    var md = new MobileDetect(req.headers['user-agent']);

    switch (md.os()) {
    case 'AndroidOS':
        evt.record('serverPublic', 'apkDownloaded', { fromIp: getReqIp(req) });
        res.status(200);
        res.download('public/static/release/MindUp_last.apk');
        break;
    // case 'iOS':
    //     res.send('iOS');
    //     break;
    default:
        res.redirect('/');
        evt.record('serverPublic', 'getDownloadPage', { fromIp: getReqIp(req) });
    }
}

function getStore(req, res, next) {
    // GET args
    var platform = req.params.platform;

    if (platform === 'android') {
        evt.record(
            'serverPublic', 'goToStore',
            {
                fromIp: getReqIp(req),
                store: 'android'
            }
        );

        return res.redirect(
            'https://play.google.com/store/apps/details?id=io.mindup.mindup');
    }
    return handleError404(req, res, next);
}

function getLandingPage(req, res, next) {
    var md = new MobileDetect(req.headers['user-agent']);

    logger.info('Locale: best match: ' + req.locale);

    if (req.locale === 'fr') {
        res.render('landing.html', { os: md.os() });
        evt.record('serverPublic', 'getLandingPage', { fromIp: getReqIp(req) });
    } else {
        res.render('landing-en.html', { os: md.os() });
        evt.record('serverPublic', 'getLandingPage', { fromIp: getReqIp(req) });
    }
}

function getPolicy(req, res, next) {
    res.render('policy.html');
}

function getTerms(req, res, next) {
    res.render('terms.html');
}

function getGame(req, res, next) {
    res.render('jeu.html');

    evt.record(
        'serverPublic', 'getGame',
        {
            fromIp: getReqIp(req)
        }
    );
}

function getPress(req, res, next) {
    res.render('press.html');
}

function postContact(req, res, next) {
    // POST args
    var name = req.body.name,
        email = req.body.email,
        msg = req.body.msg;

    var mailOptions, mailMsg;

    if (!msg) {
        return next(new Error('empty msg'));
    }

    mailOptions =  {
        from: 'landing page contact <contact@mindup.io>',
        to: 'contact@mindup.io',
        subject: 'Landing page contact'
    };

    mailMsg = 'Name: '  + ((name) ? name : 'Unknown') + '\n' +
              'Email: ' + ((email) ? email : 'Unknown') + '\n' +
              'Message: ' + msg;

    mail.send(mailMsg, mailOptions);
    res.send();

    evt.record(
	'serverPublic',
	'postContact',
	{
	    name: ((name) ? name : 'Unknown'),
	    email: ((email) ? email : 'Unknown'),
	    msg: msg,
        fromIp: getReqIp(req)
	}
    );
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
router.get('/', getRoot);
router.get('/policy', getPolicy);
router.get('/terms', getTerms);
router.get('/download', getDownloadPage);
router.get('/store/:platform', getStore);
router.post('/v1/contact-msg', postContact);
router.get('/jeu', getGame);
router.get('/press', getPress);
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
