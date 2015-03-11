/*global module*/

var logger = require('./logger.js')(__filename);
var nodemailer = require('nodemailer');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'chouilleur@gmail.com',
        pass: 'kiyaqfrbzqwokmhp'
    }
});

function send(msg, options) {
    var mailOptions = options ||
    {
        from: 'fb_repost <cron@mindup.io>',
        to: 'contact@mindup.io',
        subject: '/!\\ Cron schedule on buffer: error'
    };

    mailOptions.text = msg;

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            logger.error(error);
        }else{
            logger.info('Message sent: ' + info.response);
        }
    });
}

module.exports.send = send;
