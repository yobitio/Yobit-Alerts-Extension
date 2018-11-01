function show(title, message) {
    var time = /(..)(:..)/.exec(new Date());
    var hour = time[1] % 12 || 12;
    var period = time[1] < 12 ? 'a.m.' : 'p.m.';
    if (localStorage.play_sound === 'true') {
        var snd = new Audio("bell.wav");
        snd.play();
    }
    var notification = new Notification(title + ' - ' + hour + time[2] + ' ' + period, {
        icon: 'logo.png',
        body: message,
        requireInteraction: true
    });
    notification.onclick = function () {
        notification.close();
    };
}

function get_prices() {
	var currencies = JSON.parse(localStorage.alert_map || "{}");
	var curr = '';
    for (var i = 0; i < currencies.length; i++) {
		var currency = currencies[i];
		curr += currency.coin+'-';
	}
	
    var http = new XMLHttpRequest();
    http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            localStorage.prices = http.responseText;
            update_prices();
        }
    };
    http.open("GET", "https://yobit.net/api/3/ticker/"+curr.substring(0,curr.length-1), true);
    http.send();
}

function process_alert_map() {
    var currencies = JSON.parse(localStorage.alert_map || "{}");
    for (var i = 0; i < currencies.length; i++) {
        var currency = currencies[i];
        var stored_price = 0;
        var stored_prices = JSON.parse(localStorage.prices);
        stored_price = stored_prices[currency.coin];
            if ((currency.buy === true) && (Number(stored_price.last) < Number(currency.price))) {
                let new_target = Number((stored_price.last * 0.98).toFixed(8));
                show("Buy Alert", currency.coin + " < " + currency.price + ". Current price is " + stored_price.last + ".\nReducing target to " + new_target);
                currencies[i].price = new_target;
                localStorage.alert_map = JSON.stringify(currencies);
                update_prices();
            } else if ((currency.buy === false) && (Number(stored_price.last) > Number(currency.price))) {
                let new_target = Number((stored_price.last * 1.02).toFixed(8));
                show("Sell Alert", currency.coin + " > " + currency.price + ". Current price is " + stored_price.last + ".\nIncreasing target to " + new_target);
                currencies[i].price = new_target;
                localStorage.alert_map = JSON.stringify(currencies);
                update_prices();
            }
    }
}

function update_prices() {
    chrome.runtime.sendMessage({ update: true });
}

get_prices();
var time_left = localStorage.refresh_interval || 10;
var previous_interval = localStorage.refresh_interval || 10;
setInterval(function () {
    time_left -= 5;
    if (previous_interval != (localStorage.refresh_interval || 10)) {
        previous_interval = localStorage.refresh_interval || 10;
        time_left = 0;
    }
    if (time_left <= 0) {
        time_left = localStorage.refresh_interval || 10;
        if (localStorage.alert_map && localStorage.alert_map !== "[]") {
            get_prices();
            process_alert_map();
        }
    }
}, 10000)


