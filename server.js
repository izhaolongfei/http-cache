/**
 * @file server
 */

const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const app = express();
const path = require('path');

const host = '0.0.0.0';
const portHttp = 8080;
const portHttps = 3000;

http.createServer(app).listen(portHttp, host, function () {
    console.log(`Http App is listening on port ${portHttp}. Go to http://${host}:${portHttp}/`);
});

https.createServer({
    key: fs.readFileSync('./cert/localhost.key'),
    cert: fs.readFileSync('./cert/localhost.cert'),
    requestCert: false,
    rejectUnauthorized: false
}, app).listen(portHttps, host, function () {
    console.log(`Https App is listening on port ${portHttps}. Go to https://${host}:${portHttps}/`);
});

// 截取请求, 拦截回调
app.use('/', function (req, res, next) {
    // res.cache(0); // 0秒后立即失效（不缓存）
    console.log('执行中间件...')
    // console.log(req.headers);
    next();
});

app.set('etag', false);
app.set('Pragma', false);

app.get('/api', function (req, res) {
    res.setHeader('Cache-Control', 'private, max-age=60'); // no-cache
    res.json({
        msg: 'api 请求成功',
        status: 0
    });
});

app.get('/style.css', function (req, res, next) {
    const options = {
        root: path.join(__dirname, 'public'),
        dotfiles: 'deny',
        cacheControl: false,
        etag: false,
        lastModified: false,
        headers: {
            // 'x-timestamp': Date.now(),
            // 'x-sent': true,
            // 'Cache-Control': 'no-store',
            // 'Cache-Control': 'no-cache',
            // 'Cache-Control': 'private, max-age=60',
            'Expires': 'Fri, 27 Sep 2019 08:29:03 GMT'
        }
    };
    const filename = 'style.css';

    res.sendFile(filename, options, function (err) {
        if (err) {
            next(err);
        } else {
            console.log('Sent:', filename);
        }
    });
});

app.post('/upload', function (req, res) {
    console.log(req.params);  // 上传的文件信息
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.json('upload done');
});

// https://expressjs.com/zh-cn/4x/api.html
const options = {
    etag: false,
    lastModified: true,
    maxAge: 60000,
    setHeaders: function (res, path, stat) {
        // res.set('Cache-Control', 'public, max-age=60');
        // res.set('Last-Modified', 'Fri, 27 Sep 2019 07:25:00 GMT');
    }
};

app.use(express.static(path.join(__dirname, 'public'), options)); // 指定静态文件目录
