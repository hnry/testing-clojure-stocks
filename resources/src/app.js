class Chart extends React.Component {
  constructor() {
    super()
  }

  componentDidMount() {
    Highcharts.StockChart({
      chart: { renderTo: this.refs.chart },
      title: { text: "" },
      credits: { enabled: false }
    })
  }

  shouldComponentUpdate() {
    return false
  }

  render() {
    return (<div ref="chart" style={{width:"100%", height:"400px"}}></div>)
  }
}

function StocksList(props) {
  const list = (stocks) => {
    return stocks.map((stock, idx) => {
      return (<li key={idx}>{stock}</li>)
    })
  }

  return (<div>
         Stocks:
         <ul id="stock-list">
          {list(props.stocks)}
         </ul>
          <StocksForm addHandler={props.addHandler} />
         </div>)
}

class StocksForm extends React.Component {
  constructor() {
    super()
    this.state = { input: "" }
    this.textChange = this.textChange.bind(this)
    this.add = this.add.bind(this)
  }

  add() {
    this.props.addHandler(this.state.input)
    this.setState({ input: "" })
  }

  textChange(ev) {
    this.setState({ input: ev.target.value })
  }

  render() {
    return (<div>
            <input id="symbol-add" type="text" value={this.state.input} onChange={this.textChange} />
            <button onClick={this.add}>Add</button>
           </div>)
  }
}

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      stocks: []
    }

    this.update = this.update.bind(this)
  }

  componentDidMount() {
    Store.subscribe(this.update.bind(this))
  }

  update(data) {
    switch(data.action) {
    case "list":
      this.setState({ stocks: data.stocks })
    case "data":
    }
  }

  addStock(stock) {
    Store.send({ action: "add", symbol: stock })
  }

  removeStock(stock) {
    Store.send({ action: "remove", symbol: stock })
  }

  render() {
    return (<div>
            <Chart />
            <StocksList stocks={this.state.stocks} addHandler={this.addStock} />
            </div>)
  }
}
