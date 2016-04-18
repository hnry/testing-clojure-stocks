var ws = new WebSocket("ws://" + location.host + "/ws");

ws.onmessage = function(event) {
  console.log("msg ->", event.data);
};

ws.onopen = function(event) {
  ws.send(JSON.stringify({ action: "list" }));
};

ws.onclose = function(event) {
  console.log("closed");
};

$("button").click(function(event) {
  event.preventDefault();

  var payload = {
    action: "symbol",
    symbol: $("#symbol-add").val()
  };

  payload = JSON.stringify(payload);

  ws.send(payload);

  // spinner stuff TODO
  $("#symbol-add").val("");
});

var chart = Highcharts.StockChart({
  chart: {
    renderTo: "container"
  },
  title: {
    text: ""
  },
  credits: {
    enabled: false
  }
});
