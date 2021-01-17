
const crypto = require('crypto');
const { type } = require('os');
const config = require('./config');

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
helpers.parseS
module.exports = helpers;