const http = require('http');
const https = require('https');
const path = require('path');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder

const config = require('./config');
const helpers = require('./helpers');
const handlers = require('./handlers');

const server = {};

server.httpServer = http.createServer((req,res)=>{
    server.unifiedServer(req, res)
})

server.httpsServerOptions = {
    key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, (req,res)=>{
    unifiedServer(req, res)
})

server.unifiedServer = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');
    const queryStringObject = parsedUrl.query;
    const method = req.method.toLowerCase();
    const headers = req.headers;

    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', data => {
        buffer += decoder.write(data)
    })
    req.on('end', ()=>{
        buffer+= decoder.end()
        
        const chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload: helpers.parseJsonToObject(buffer)
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

server.router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
}

server.init = () => {
    server.httpServer.listen( config.httpPort, ()=>{
        console.log('Listening on port ', config.httpPort,  'env: ', config.envName );
    })
    
    server.httpsServer.listen( config.httpsPort, ()=>{
        console.log('Listening on port ', config.httpsPort,  'env: ', config.envName );
    })
}

module.exports = server;