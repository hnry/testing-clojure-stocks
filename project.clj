(defproject testing-clojure-stock "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.8.0"]
                 [compojure "1.5.0"]
                 [http-kit "2.2.0-alpha1"]
                 [environ "1.0.2"]
                 [selmer "1.0.4"]
                 [com.novemberain/monger "3.0.2"]
                 [com.yahoofinance-api/YahooFinanceAPI "3.1.0"]
                 [org.clojure/data.json "0.2.6"]
                 [ring/ring-defaults "0.2.0"]]
  :main ^:skip-aot testing-clojure-stock.core
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}})
