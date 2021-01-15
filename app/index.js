const http = require('http');
const https = require('https');

const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./config');
const fs = require('fs');

const _data = require('./lib/data');

_data.delete('test','newFile',(err) =>{
    console.log('err:', err, ' data:');
})

const httpServer = http.createServer((req,res)=>{
  unifiedServer(req, res)
})

httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, (req,res)=>{
    unifiedServer(req, res)
})

httpServer.listen( config.httpPort, ()=>{
    console.log('Listening on port ', config.httpPort,  'env: ', config.envName );
})

httpsServer.listen( config.httpsPort, ()=>{
    console.log('Listening on port ', config.httpsPort,  'env: ', config.envName );
})

const unifiedServer = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');
    const queryStringObject = parsedUrl.query;
    const method = req.method.toLowerCase();
    const headers = req.headers;

    const decoder = new StringDecoder('utf-8');
    let payload = '';
    req.on('data', data => {
        payload += decoder.write(data)
    })
    req.on('end', ()=>{
        payload+= decoder.end()
        
        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload,
        }
        chosenHandler( data, (statusCode, payload) => {
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {}
            const payloadString = JSON.stringify(payload);
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString); 
            console.log('Returning response', statusCode, payloadString);
        });

              
    })
}

const handlers = {}
handlers.ping = (data, callback) => {
    callback(200)
}

handlers.notFound = (data,  callback) => {
    callback(404);
}

const router = {
    'ping': handlers.ping
}