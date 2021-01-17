
const crypto = require('crypto');
const { type } = require('os');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');
const { stat } = require('fs');

const helpers = {}

helpers.hash = str => {
    if (typeof(str) =='string' && str.length > 0) {
        const hash=crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }

}
helpers.parseJsonToObject = str => {
    try {
        return JSON.parse(str);
    } catch(e) {
       // console.log(e);
        return {}
    }
}

helpers.createRandomString = strLength => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    let str = '';
    if (strLength) {
        const possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (i = 1; i<= strLength; i++ ) {
            const randomChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
            str += randomChar;
        }
    } else {
        return false
    }
    return str; 
}

helpers.sendTwilioSms = (phone, msg, callback) => {
    if (phone && msg) {
        const payload = {
            From: config.twilio.fromPhone,
            To: phone,
            Body: msg
        }
        const stringPayload=querystring.stringify(payload);
        const requestDetails = {
            protocol: 'https:',
            hostname: 'api.twilio.com',
            methnod: 'POST',
            path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
            auht: `${config.twilio.accountSid}:${config.twilio.authToken}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-length': Buffer.byteLength(stringPayload),  
            }
        };

        const req = https.request(requestDetails, res => {
            const { statusCode } = res;
            if (statusCode == 200 || statusCode == 201) {
                callback(false)
            } else {
                callback(`returned status code ${statusCode}`);
            }
        });
        req.on('error', e => callback(e))
        req.write(stringPayload);
        req.end();

    } else {
        callback('Given parameters are missing or invalid')
    }
}

module.exports = helpers;