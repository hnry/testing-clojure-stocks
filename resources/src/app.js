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
      return chart.name === stock
    }).forEach(stock => {
      const data = newProp.stockData
      if (data[stock] && data[stock].length) {
        const convertedData = this.parseStockData(data[stock])
        this.chart.addSeries({ name: stock, data: convertedData })
      }
    })

    // remove stocks that are not active anymore
    diff(newProp.stocks, this.chart.series, (stock, chart) => {
      return chart.name === stock || chart.name === "Navigator"
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
  return (<li>
          {props.stock} <div onClick={props.removeHandler.bind(null, props.stock)}>remove</div>
         </li>)
}

function StocksList(props) {
  const list = (stocks) => {
    return stocks.map((stock, idx) => {
      return (<Stock key={idx} stock={stock} removeHandler={props.removeHandler} />)
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
      list: [],
      stocks: {} // {symbol: data}
    }

    this.update = this.update.bind(this)
  }

  componentDidMount() {
    Store.subscribe(this.update.bind(this))
  }

  update(data) {
    switch(data.action) {
    case "list":
      this.setState({ list: data.stocks })
      // get stock data for unknown stocks
      data.stocks.forEach((stock) => {
        if (!this.state.stocks[stock]) Store.getStockData(stock)
      })
      break
    case "data":
      let stocks = this.state.stocks
      stocks[data.symbol] = data.data
      this.setState({ stocks: stocks })
      break
    }
  }

  addStock(stock) { Store.addStock(stock) }
  removeStock(stock) { Store.removeStock(stock) }

  render() {
    return (<div>
            <Chart stocks={this.state.list} stockData={this.state.stocks} />
            <StocksList stocks={this.state.list} addHandler={this.addStock} removeHandler={this.removeStock} />
            </div>)
  }
}
