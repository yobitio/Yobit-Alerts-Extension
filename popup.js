var background = chrome.extension.getBackgroundPage();

getPairs();

function update_prices() {
  var final_text = process_alert_map();
  if (final_text != "") {
    table_header = "<table class='table'><thead><tr><th>Condition</th><th>Current Price</th><th></th></tr></thead><tbody>";
    table_footer = "</tbody></table>";
    final_text = table_header + final_text + table_footer;

    document.getElementById("content").innerHTML = final_text;
    add_button_listeners();
  } else {
    document.getElementById("content").innerHTML = "No alerts!";
  }
}

function add_button_listeners() {
  for (var i = 0; i < JSON.parse(localStorage.alert_map || "{}").length; i++) {
    (function (i) {
      let button_id = 'alert_button_' + i;
      let button = document.getElementById(button_id);
      if (button) {
        button.addEventListener('click', function () {
          remove_alert(i);
        });
      }
    })(i);
  }
}

function remove_alert(index) {
  if (localStorage.alert_map) {
    var array = JSON.parse(localStorage.alert_map);
    array.splice(index, 1);
    localStorage.alert_map = JSON.stringify(array);
  }
  update_prices();
}

function save_form_data() {
  let form = document.forms.alert;
  let coin = form.coin.value;
  let price = form.price.value;
  let buy = form.buy.value;

  if (coin === "" || price === "") {
    return;
  }

  var data = { coin: coin, price: price, buy: buy };
  if (!localStorage.alert_map) {
    localStorage.alert_map = JSON.stringify([data]);
  } else {
    var array = JSON.parse(localStorage.alert_map);
    array.push(data)
    localStorage.alert_map = JSON.stringify(array);
  }
  update_prices();
  background.process_alert_map();
}

function process_alert_map() {
  var currencies = JSON.parse(localStorage.alert_map || "{}");
  var final_text = "";
  for (var i = 0; i < currencies.length; i++) {
    var currency = currencies[i];
    var current_price = 'loading...';
    var stored_prices = JSON.parse(localStorage.prices);
    if(stored_prices[currency.coin]){
      current_price = stored_prices[currency.coin].last;
      current_price = current_price.toFixed(8);
    }
    button_id = 'alert_button_' + i;
    let sign = currency.buy ? '&lt;' : '&gt;';
    final_text += '<tr><td>' + (currency.coin).toUpperCase()+ ' ' + sign +' '+ currency.price + '</td><td>' + current_price + '</td>';
    final_text += '<td><a id="' + button_id + '"><span class="glyphicon glyphicon-remove text-danger"></span></a></td></tr>';
  }
  return final_text;
}

document.addEventListener('DOMContentLoaded', function () {
  alert_button = document.getElementById("alert_button");
  alert_button.addEventListener('click', function () {
    save_form_data();
  });
  update_prices();
});

function update_pairs(){
  var p = JSON.parse(localStorage.pairs || "{}");
  var pair_list = p.pairs;

  $.each(pair_list, function(key, value){
    $('#coin').append('<option value="' + key + '">' + key.toUpperCase() + '</option>');
  });

  if ($('#coin option').length > 1) {
    $('#coin').removeAttr('disabled');
  }
}

function getPairs(){
    var http = new XMLHttpRequest();
    http.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        localStorage.pairs = http.responseText;
        update_pairs();
      }
    };
    http.open("GET", "https://yobit.net/api/3/info", true);
    http.send();
}

chrome.runtime.onMessage.addListener(handleBackgroundMessages);
function handleBackgroundMessages(message) {
  if (message.update === true) {
    update_prices();
  }
}