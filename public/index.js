/**
 * @file app
 */

document.querySelector('#api').onclick = function () {
    fetch('/api')
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            console.log(json);
        });
};

function loadImage(imgUrl) {
    return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('GET', imgUrl);
        request.responseType = 'blob';

        request.onload = function () {
            if (request.status == 200) {
                resolve(request.response);
            } else {
                reject(Error('Image load fail; error code:' + request.statusText));
            }
        };

        request.onerror = function () {
            reject(Error('There was a network error.'));
        };

        request.send();
    });
}

var imgSection = document.querySelector('section');

window.onload = function () {
    var images = [
        'imgs/more.png',
        'imgs/road.png'
    ];
    for (var i = 0; i <= images.length - 1; i++) {
        loadImage(images[i]).then(function (res) {
            var myImage = document.createElement('img');
            var imageURL = window.URL.createObjectURL(res);

            myImage.src = imageURL;

            imgSection.appendChild(myImage);
        }, function (Error) {
            console.log(Error);
        });
    }
};
return;
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { scope: '/' }).then(function (reg) {
        if (reg.installing) {
            console.log('[page] Service worker installing');
        } else if (reg.waiting) {
            console.log('[page] Service worker waiting');
        } else if (reg.active) {
            console.log('[page] Service worker active');
        }

        // navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage('post msg1: by controller');

        var t = setInterval(function() {
            if (reg.active) {
                clearInterval(t);
                reg.active.postMessage('post msg2: by reg.active');
            }
        }, 100);
    }).catch(function (error) {
        console.log('Registration failed with ' + error);
    });
}

navigator.serviceWorker.addEventListener('message', function (e) {
    console.log('[page] rcv msg: ', e.data);
});
