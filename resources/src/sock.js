var Store = {
  _subscribers: [],
  _socket: null,

  subscribe(fn) {
    this._subscribers.push(fn);
  },

  publish(event) {
    const data = JSON.parse(event.data)
    this._subscribers.forEach(fn => fn(data));
  },

  send(payload) {
    this._socket.send(JSON.stringify(payload))
  },

  init() {
    this._socket = new WebSocket("ws://" + location.host + "/ws")
    this._socket.onopen = (event) => {
      this._socket.send(JSON.stringify({ action: "list" }))
    }
    this._socket.onclose = (event) => {
      console.log("closed")
    }

    this._socket.onmessage = this.publish.bind(this)
  }
}

Store.init()
ReactDOM.render(<App />, document.getElementById('app'))
