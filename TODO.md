## things to do...

1. stock results are cached in memory, it should be expired either way, right now it basically relies on the fact heroku will sleep the app anyway eventually to expire things
    
2. super ideally data should be incrementally updated... if switch to a database, this would take an awful lot of storage eventually... (and this project is not meant to be a data collector / super serious)

3. stagger adding a stock to the stock list when the stock data has not come in yet

4. show invalid symbols being added

5. match stock list color for a stock to it's line color in the chart

