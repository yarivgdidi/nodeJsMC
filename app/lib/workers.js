const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');

const _data = require('./data');
const helpers = require('./helpers');
const { worker } = require('cluster');

const workers = {};

workers.loop = () => {
    setInterval(()=>{
        workers.gatherAllchecks();
    }, 1000*60)
}

workers.gatherAllchecks = () => {
    _data.list('checks', (err, checks)=> {
        if (!err && checks.length > 0) {
            checks.forEach(check => {
                _data.read('checks', check, (err, originalCheckData)=> {
                    if (!err && originalCheckData) {
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log('Error reading one of the  checks data')
                    }
                })
            })
        } else {
            console.log('Error, could not fine checks to proccess');
        }
    })
}

workers.validateCheckData = (originalCheckData) => {
    const { id, userPhone, protocol, url: _url, method, successCodes, timeoutSeconds } = originalCheckData;
    if ( id && userPhone && protocol && _url && method && successCodes && timeoutSeconds ) {
        workers.performCheck(originalCheckData);
    } else {
        console.log('Error, check data error')
    }

} 

workers.performCheck = (originalCheckData) => {
    const { id, userPhone, protocol, url: _url, method, successCodes, timeoutSeconds, state = 'down', lastCheked = false  } = originalCheckData;

    const checkOutcome = {
        error: false,
        responseCode: false
    };

    let outcomeSent = false;

    const parsedUrl = url.parse(`${protocol}://${_url}`, true);
    const hostname = parsedUrl.hostname;
    const path = parsedUrl.path;
    
    const requestDetails = {
        protocol: protocol + ':',
        hostname,
        method: method.toUpperCase(),
        path,
        timeout: timeoutSeconds * 1000
    }
    const _moduleToUse = protocol === 'http' ? http : https;

    req = _moduleToUse.request(requestDetails, res => {
        const {statusCode} = req;
        checkOutcome.responseCode = statusCode;
        if (!outcomeSent) {
            workers.procesCheckOutcome(originalCheckData, checkOutcome)
            outcomeSent = true;
        }
     })

     req.on('error', e => {
        checkOutcome.error = {
            error: true,
            value: e
        }
        if (!outcomeSent) {
            workers.procesCheckOutcome(originalCheckData, checkOutcome)
            outcomeSent = true;
        }
     })

     req.on('timeout', e => {
        checkOutcome.error = {
            error: true,
            value: 'timeout'
        }
        if (!outcomeSent) {
            workers.procesCheckOutcome(originalCheckData, checkOutcome)
            outcomeSent = true;
        }
     })

     req.end();
}

workers.procesCheckOutcome = (originalCheckData, checkOutcome) => {
    const state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode > -1 ) ? 'up' : 'down';
    const alertWarrented = originalCheckData.lastChaked && originalCheckData.stat !== state;

    const newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChaked = Date.now(); 
    _data.update('checks', newCheckData.id, newCheckData, err => {
        if (!err) {
            if (alertWarrented) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log ('check ok');
            }
        } else {
            console.log ('error writing check to disk')
        }
    })
}

workers.alertUserToStatusChange = (newCheckData) => {
    // to be continued (send sms with helper);  
}

workers.init = () => {
    workers.gatherAllchecks()
    workers.loop(); 
}


module.exports = workers ;