/**
 * think of as...
 * arr.diff(arr2) but without attaching to Array prototype
 *
 * returns an array of the difference of arr2 in arr1
 * based on pred fn
 */
function diff(arr, arr2, pred) {
  return arr2.filter(b => {
    return arr.some(a => {
      return pred(a, b)
    }) !== true
  })
}

class Chart extends React.Component {
  constructor() {
    super()
    this.chart = null
  }

  parseStockData(data) {
    const round = function(n) {
      return parseFloat(n.toFixed(2))
    }

    return data.map(quote => {
      const date = new Date(quote.date)
      return [date.getTime(), round(quote.open), round(quote.high), round(quote.low), round(quote.close)]
    }).reverse()
  }

  componentDidMount() {
    this.chart = new Highcharts.StockChart({
      chart: { renderTo: this.refs.chart },
      title: { text: "" },
      credits: { enabled: false },
      rangeSelector: {
        selected: 1
      },
      series: { type: "candlestick" }
    })
  }

  shouldComponentUpdate(newProp) {
    // add missing stocks to chart
    diff(this.chart.series, newProp.stocks, (chart, stock) => {
      return chart.name === stock.symbol
    }).forEach(stock => {
      const symbol = stock.symbol
      const data = newProp.stockData
      if (stock.status != "invalid" && data[symbol] && data[symbol].length) {
        const convertedData = this.parseStockData(data[symbol])
        const series = this.chart.addSeries({ name: symbol, data: convertedData })
        newProp.updateStatus(symbol, series)
      }
    })

    // remove stocks that are not active anymore
    diff(newProp.stocks, this.chart.series, (stock, chart) => {
      return chart.name === stock.symbol || chart.name === "Navigator"
    }).forEach(chart => {
      chart.remove()
    })

    return false
  }

  render() {
    return (<div ref="chart" style={{height:"400px",width:"100%"}}></div>)
  }
}

function Stock(props) {
  var cls, styl
  switch(props.stock.status) {
  case "invalid":
    cls = "stock-invalid"
    break
  case "waiting":
    cls = "stock-waiting"
    break
  default: // a color ~ data is in
    cls = "stock-ok"
    styl = { borderBottomColor: props.stock.status }
  }

  return (<li className={cls} style={styl}>
      <div id="remove-stock" onClick={props.removeHandler.bind(null, props.stock.symbol)}>x</div>{props.stock.symbol}
              </li>)
}

function StocksList(props) {
  const list = (stocks) => {
    return stocks.map((stock, idx) => {
      return (<Stock key={idx} stock={stock} removeHandler={props.removeHandler} />)
    })
  }

  return (<div className="stock-list-wrap">
             <div className="stock-header">
                 <h3>Stocks</h3>
                 <StocksForm addHandler={props.addHandler} />
             </div>

          <ul id="stock-list">
          {list(props.stocks)}
          </ul>
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
    const txt = this.state.input.trim()
    if (txt) {
      this.props.addHandler(txt)
      this.setState({ input: "" })
    }
  }

  textChange(ev) {
    this.setState({ input: ev.target.value.toUpperCase() })
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
      list: [],  // [{symbol: XYZ,
                 //   status: #color, "waiting", "invalid" }]
      stocks: {} // {symbol: data}
    }

    this.update = this.update.bind(this)
  }

  componentDidMount() {
    Store.subscribe(this.update.bind(this))
  }

  // returns index
  findStockFromList(stock) {
    for (let i = 0; i < this.state.list.length; i++) {
      if (this.state.list[i].symbol === stock) {
        return i
      }
    }
    return false
  }

  update(data) {
    switch(data.action) {
    case "list":
      const newlist = data.stocks.map(stock => {
        const oldstock = this.findStockFromList(stock)
        let status = "waiting"
        if (oldstock !== false) status = this.state.list[oldstock].status
        return { symbol: stock, status }
      })

      this.setState({ list: newlist })

      // get stock data for unknown stocks
      newlist.forEach((stock) => {
        if (stock.status == "waiting") Store.getStockData(stock.symbol)
      })
      break
    case "data":
      let stocks = this.state.stocks
      let list = this.state.list
      if (data.data.error) {
        const updateStock = this.findStockFromList(data.symbol)
        list[updateStock].status = "invalid"
      } else {
        stocks[data.symbol] = data.data
      }
      this.setState({ stocks, list })
      break
    }
  }

  addStock(stock) { Store.addStock(stock) }
  removeStock(stock) { Store.removeStock(stock) }

  /*
   * updates the symbol's status to be of the color line in the chart
   */
  updateStockStatus(stock, chart) {
    const i = this.findStockFromList(stock)
    const list = this.state.list
    list[i].status = chart.color
    this.setState({ list })
  }

  render() {
    return (<div>
            <Chart stocks={this.state.list} stockData={this.state.stocks} updateStatus={this.updateStockStatus.bind(this)} />
            <StocksList stocks={this.state.list} addHandler={this.addStock} removeHandler={this.removeStock} />
            </div>)
  }
}
