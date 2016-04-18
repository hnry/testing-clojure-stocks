(ns testing-clojure-stock.core
  (:gen-class)
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
            [selmer.parser :refer [render-file]]
            [environ.core :refer [env]]
            [clojure.data.json :as json]
            [org.httpkit.server :refer [run-server with-channel on-receive on-close send!]])
  (:import yahoofinance.YahooFinance))

(def stocklist (atom #{}))
(def channels (atom #{}))

(defn route-stock [stock-orig]
  (let [symbol (.toUpperCase stock-orig)
        stock (-> symbol
                  .toUpperCase
                  YahooFinance/get
                  .getQuote)
        payload {:symbol symbol
                 :price (.getPrice stock)
                 :ask (.getAsk stock)
                 :bid (.getBid stock)
                 :close (.getPreviousClose stock)}]
    {:status 200 :headers {"Content-Type" "application/json"} :body (json/write-str payload)}))


(defn route-home []
  (render-file "views/index.html" []))

(defn socket-receive [channel data] ;; TODO needs work
  (let [data (json/read-str data)]
    (case (data "action")
      "symbol" (do
                 (swap! stocklist conj (data "symbol"))
                 (socket-send! @channels))
      (socket-send! [channel])))) ;; default send back list to specific client

(defn socket-send! [users]
  (doseq [channel users]
    (send! channel (json/write-str {:stocks @stocklist}))))

(defn socket-connect! [channel]
  (swap! channels conj channel))

(defn socket-disconnect! [channel status]
  (println "client disconnected")
  (swap! channels #(remove #{channel} %)))

(defn ws-handler [request]
  (with-channel request channel
    (socket-connect! channel)
    (on-close channel (partial socket-disconnect! channel))
    (on-receive channel (partial socket-receive channel))))

(defroutes app
  (GET "/" [] (route-home))
  (GET "/ws" request (ws-handler request))
  (GET "/api/stock/:stock" [stock] (route-stock stock))
  (route/resources "/asset/")
  (route/not-found "Not Found"))

(defn -main [& port]
  (let [port (Integer. (or (first port) (env :port) 3000))]
    (println "HTTP Server starting on:" port)
    (run-server (wrap-defaults #'app site-defaults) {:port port})))
