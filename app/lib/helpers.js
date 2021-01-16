
const crypto = require('crypto');
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
helpers.parseS
module.exports = helpers;