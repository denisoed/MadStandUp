startTimer = (duration, display) => {
    let time = duration, minutes, seconds;
    var notifOpt = {
        type: 'list',
        title: 'Primary Title',
        message: 'Primary message to display',
        priority: 1,
        iconUrl: 'img/bg.jpg',
        items: [{
                title: 'Item1',
                message: 'This is item 1.'
            },
            {
                title: 'Item2',
                message: 'This is item 2.'
            },
            {
                title: 'Item3',
                message: 'This is item 3.'
            }
        ]
    };


    setInterval(() => {
        minutes = parseInt(time / 60, 10);
        seconds = parseInt(time % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        chrome.notifications.create('notify1', notifOpt, function () {
            console.log(`${minutes}:${seconds}`);
        });
        if (--time < 0) {
            time = duration;
        }
    }, 1000);
}

// window.onload = () => {
//     let duration = 60 * .1, display = document.querySelector('.time');
//     startTimer(duration, display);
// }