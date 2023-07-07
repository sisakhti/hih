var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const axios = require('axios');
const http = require('node:http');
const https = require('node:https');
var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


function debug(...message){
    if(!process.env.DEBUG) return;

    console.log(message);
}

app.all('/proxy', async function (req, res, next) {
    debug('Start handling request at ', Date.now());

    if(req.headers['x-dest'] === undefined){
        res.send('DEST header not set');
        return;
    }


    const buff = Buffer.from(req.headers['x-dest'], 'base64');
    const host = buff.toString('ascii');

    const method = req.method;
    const headers = req.headers;
    delete headers['x-dest'];
    delete headers['host'];
    delete headers['content-length'];
    let defaultHeaders={Accept:"*/*",
        "Accept-Encoding":"gzip",
        "Accept-Language":"en-US",
        "X-Forwarded-Port":"443",
        "X-Forwarded-Proto":"https",
        "Access-Control-Allow-Headers":"origin",
        "Access-Control-Allow-Methods":"GET",
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Max-Age":"3628800",
        "Connection":"keep-alive",
        "Accept-Encoding":"gzip, deflate, br"
    };
    let allHeaders = {...defaultHeaders, ...headers}

    let config = {
        method: method,
        url: host,
        headers: allHeaders,
        httpAgent:new http.Agent({keepAlive:true, timeout: 30000}),
        httpsAgent:new https.Agent({keepAlive:true, timeout: 30000}),
    }

    if(method.toLowerCase() == 'get'){
        config.params = req.query
    }else{
        config.data = req.body
    }

    try{
        debug('Sending axios request to target address at ', Date.now());
        debug('axios config, ', config)
        const axiosResp = await axios.request(config);
        debug('Received response from target at ', Date.now());
        res.status(axiosResp.status).send(axiosResp.data);
        debug('Send back response to user at ', Date.now());
    }catch (err){
        debug('Received error from target at ', Date.now());
        debug('The error message is: ', err.toString());
        if(err.response){
            res.status(err.response.status).send(err.response.data);
        }else{
            res.status(500).send({
                'error': err.toString()
            })
        }

    }
});
let port = 8080;
app.listen(port, '0.0.0.0', ()=>{
    console.log(`Application listening on port ${port}`);
});

module.exports = app;
