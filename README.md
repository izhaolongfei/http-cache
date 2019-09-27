# 笔记
强制缓存优先于协商缓存进行，若强制缓存 (Expires 和 Cache-Control) 生效则直接使用缓存，若不生效则进行协商缓存 (Last-Modified / If-Modified-Since 和 Etag / If-None-Match)，协商缓存由服务器决定是否使用缓存，若协商缓存失效，那么代表该请求的缓存失效，返回 200，重新返回资源和缓存标识，再存入浏览器缓存中；生效则返回 304，继续使用缓存。

## https

### Generate a self-signed certificate
openssl req -nodes -new -x509 -keyout server.key -out server.cert

### Enable HTTPS in Express
```js
const express = require('express')
const fs = require('fs')
const https = require('https')
const app = express()

app.get('/', function (req, res) {
    res.send('hello world')
})

https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app).listen(3000, function () {
    console.log('Example app listening on port 3000! Go to https://localhost:3000/')
})
```

## 强缓存

### Cache-Control
Cache-Control 需要兼容 HTTP1.0 的时候需要使用 Expires。

- public：所有内容都将被缓存（客户端和代理服务器都可缓存）。具体来说响应可被任何中间节点缓存，如 Browser <-- proxy1 <-- proxy2 <-- Server，中间的 proxy 可以缓存资源，比如下次再请求同一资源 proxy1 直接把自己缓存的东西给 Browser 而不再向 proxy2 要。
- private：所有内容只有客户端可以缓存，Cache-Control 的默认取值。具体来说，表示中间节点不允许缓存，对于 Browser <-- proxy1 <-- proxy2 <-- Server，proxy 会老老实实把 Server 返回的数据发送给 proxy1, 自己不缓存任何数据。当下次 Browser 再次请求时 proxy 会做好请求转发而不是自作主张给自己缓存的数据。
- no-cache：客户端缓存内容，是否使用缓存则需要经过协商缓存来验证决定。表示不使用 Cache-Control 的缓存控制方式做前置验证，而是使用 Etag 或者 Last-Modified 字段来控制缓存。需要注意的是，no-cache 这个名字有一点误导。设置了 no-cache 之后，并不是说浏览器就不再缓存数据，只是浏览器在使用缓存数据时，需要先确认一下数据是否还跟服务器保持一致。
    - 如果是客户端发送的请求包含no-che指令，那么客户端不会接收缓存过的响应。缓存服务器必须把客户端请求转发给源服务器；
    - 如果是服务器返回的响应种包含no-cache指令，那么缓存服务器不能对资源进行缓存。源服务器以后也将不再对缓存服务器请求中提出的资源有效性进行确认，且禁止其对响应资源进行缓存操作；
- no-store：所有内容都不会被缓存，即不使用强制缓存，也不使用协商缓存。
- max-age：max-age=xxx 表示缓存内容将在 xxx 秒后失效。
- s-maxage（单位为 s)：同 max-age 作用一样，只在代理服务器中生效（比如 CDN 缓存）。比如当 s-maxage=60 时，在这 60 秒中，即使更新了 CDN 的内容，浏览器也不会进行请求。max-age 用于普通缓存，而 s-maxage 用于代理缓存。s-maxage 的优先级高于 max-age。如果存在 s-maxage，则会覆盖掉 max-age 和 Expires header。
- max-stale：能容忍的最大过期时间。max-stale 指令标示了客户端愿意接收一个已经过期了的响应。如果指定了 max-stale 的值，则最大容忍时间为对应的秒数。如果没有指定，那么说明浏览器愿意接收任何 age 的响应（age 表示响应由源站生成或确认的时间与当前时间的差值）。
- min-fresh：能够容忍的最小新鲜度。min-fresh 标示了客户端不愿意接受新鲜度不多于当前的 age 加上 min-fresh 设定的时间之和的响应。

### Expires
Express 会针对请求根目录下 index.html 的响应配置 Etag，所以响应状态码出现304。即便为该响应也设置一个 Cache-Control 首部，并设置 max-age 指令一个时间段，再次请求该index.html也不会获取缓存的内容。response 里的 max-age=0；
Expires 是 HTTP/1 的产物，受限于本地时间，如果修改了本地时间，可能会造成缓存失效。

> 强缓存判断是否缓存的依据来自于是否超出某个时间或者某个时间段，而不关心服务器端文件是否已经更新，这可能会导致加载文件不是服务器端最新的内容，

## 协商缓存
服务器返回 304 指示浏览器使用缓存。

mac 文件时间戳
> 文件创建时间：touch -mt YYYYMMDDhhmm.SS filename
> 文件修改时间：touch -t YYYYMMDDhhmm.SS filename
> 获取时间戳信息：GetFileInfo filename

### Last-Modified
Last-Modified 存在一些弊端：
- 如果本地打开缓存文件，即使没有对文件进行修改，但还是会造成 Last-Modified 被修改，服务端不能命中缓存导致发送相同的资源；
- 因为 Last-Modified 只能以秒计时，如果在不可感知的时间内修改完成文件，那么服务端会认为资源还是命中了，不会返回正确的资源。

### ETag
Etag 是服务器响应请求时，返回当前资源文件的一个唯一标识 (由服务器生成)，只要资源有变化，Etag 就会重新生成。

对于 Last-Modified 和 ETag，ETag 解决了 Last-Modified 使用时可能出现的资源的时间戳变了但内容没变的问题。

- Last-Modified 只能精确到秒，秒之内的内容更新 Etag 才能检测；
- 文件有时会定时重新生成相同内容，Last-Modified 不能很好辨别；
- ETag 每次服务端生成都需要进行读写操作，而 Last-Modified 只需要读取操作，ETag 的消耗是更大的。

## 如何消除缓存？
其实浏览器是根据 url 决定是否获取缓存还是从服务器更新资源，那么通过设置 url 的 query string 就可以消除缓存了。一般设置有两种方式：
- 使用版本号，比如：http://url.com/?version=20171006
- 使用一个 hash 值，比如：http://url.com/?hash=sdfkljlkjasdklxclkv13

## request之 max-age=0
max-age=0表示不管response怎么设置，在重新获取资源之前，先检验 ETag/Last-Modified

## 浏览器会把哪些文件丢进内存中？哪些丢进硬盘中？
关于这点，网上说法不一，不过以下观点比较靠得住：
- 对于大文件来说，大概率是不存储在内存中的，反之优先；
- 当前系统内存使用率高的话，文件优先存储进硬盘。

`Chrome does something quite different: 'Cache-Control' is always set to 'max-age=0′, no matter if you press enter, f5 or ctrl+f5. Except if you start Chrome and enter the url and press enter.`

## 场景应用

### 频繁变动的资源
> Cache-Control: no-cache

### 不常变化的资源
> Cache-Control: max-age=31536000

## tips
访问-> 200 -> 退出浏览器
再进来-> 200(from disk cache) -> 刷新 -> 200(from memory cache)

## Service Worker
> Service workers 本质上充当Web应用程序与浏览器之间的代理服务器，也可以在网络可用时作为浏览器和网络间的代理。它们旨在（除其他之外）使得能够创建有效的离线体验，拦截网络请求并基于网络是否可用以及更新的资源是否驻留在服务器上来采取适当的动作。他们还允许访问推送通知和后台同步API。

### 参数说明
- scope 的值的意义在于，如果 scope 的值为 /a/b， 那么 Service Worker 线程只能捕获到 path 为 /a/b 开头的( /a/b/page1, /a/b/page2，...)页面的 fetch 事件。
- on install 的优点是第二次访问即可离线，缺点是需要将需要缓存的 URL 在编译时插入到脚本中，增加代码量和降低可维护性；
- on fetch 的优点是无需更改编译过程，也不会产生额外的流量，缺点是需要多一次访问才能离线可用。


Service Worker 有以下功能和特性：
- 一个独立的 worker 线程，独立于当前网页进程，有自己独立的 worker context。
- 一旦被 install，就永远存在，除非被手动 unregister
- 用到的时候可以直接唤醒，不用的时候自动睡眠
- 可编程拦截代理请求和返回，缓存文件，缓存的文件可以被网页进程取到（包括网络离线状态）
- 离线内容开发者可控
- 能向客户端推送消息
- 不能直接操作 DOM
- 必须在 HTTPS 环境下才能工作，因为 Service Worker 中涉及到请求拦截，所以必须使用 HTTPS 协议来保障安全。
- 异步实现，内部大都是通过 Promise 实现
- 可以通过 postMessage 接口把数据传递给其他 JS 文件
- Service Worker 中运行的代码不会被阻塞，也不会阻塞其他页面的 JS 文件中的代码
- 在默认情况下，Service Worker 必定会每24小时被下载一次，如果下载的文件是最新文件，那么它就会被重新注册和安装，但不会被激活，当不再有页面使用旧的 Service Worker 的时候，它就会被激活。

The chrome flag allow-insecure-localhost will allow you to develop on localhost with a self signed certificate.
> chrome://flags/#allow-insecure-localhost

### chrome 监听 sw
- chrome://inspect/#service-workers
- chrome://serviceworker-internals/

### 参考资料
- https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API/Using_Service_Workers
- https://lavas.baidu.com/pwa/offline-and-cache-loading/service-worker/how-to-use-service-worker
- https://www.kevinleary.net/self-signed-trusted-certificates-node-js-express-js/
- https://deanhume.com/testing-service-workers-locally-with-self-signed-certificates/
    - /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --user-data-dir=mp/foo --ignore-certificate-errors --unsafely-treat-insecure-origin-as-secure=https://localhost:3000
- https://juejin.im/post/5b06a7b3f265da0dd8567513