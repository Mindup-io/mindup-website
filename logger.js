/*global module, process*/

/**
 * Use this singleton instance of logger like:
 * logger = require('Logger.js');
 * logger.debug('your debug statement');
 * logger.warn('your warning');
 */

var winston = require('winston');
var fs = require('fs');
var path = require('path');
var logDir = '/var/log/mindup'; // TODO: Or read from a configuration
var env = process.env.NODE_ENV || 'development';

// winston.setLevels(winston.config.npm.levels);
// winston.addColors(winston.config.npm.colors);

// TODO: handle error if the file can't be created.
if (!fs.existsSync(logDir)) {
    // Create the directory if it does not exist
    fs.mkdirSync(logDir);
}

var createLogger = function (filename) {
    // Create a logger.
    var logger = new(winston.Logger)({
        transports: [
	    new winston.transports.Console({
	        level: env === 'development' ? 'debug' : 'info',
	        colorize: true
	    }),
	    new winston.transports.File({
	        level: env === 'development' ? 'debug' : 'info',
	        filename: logDir + '/mindup.log',
	        maxsize: 1024 * 1024 * 10, // 10MB
                json: false
	    })
        ]
        // exceptionHandlers: [
        //     new winston.transports.File({
        //         filename: 'log/exceptions.log'
        //     })
        // ]
    });

    // Prepend filename in logs.
    var logLevels = ['silly', 'debug', 'verbose', 'info', 'warn', 'error'];
    var prependedStr = path.basename(filename);

    logLevels.forEach(function (method) {
        var oldMethod = logger[method].bind(logger);

        logger[method] = function() {
            var args = [];
            Array.prototype.push.apply(args, arguments);
            args[0] = prependedStr + ': ' + args[0];
            oldMethod.apply(logger, args);
        };
    });

    return logger;
};

module.exports = createLogger;
