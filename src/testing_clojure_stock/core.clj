(ns testing-clojure-stock.core
  (:gen-class)
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
            [selmer.parser :refer [render-file]]
            [clojure.core.async :as async]
            [environ.core :refer [env]]
            [clojure.data.json :as json]
            [org.httpkit.server :refer [run-server with-channel on-receive on-close send!]])
  (:import yahoofinance.YahooFinance
           yahoofinance.histquotes.Interval))

(def stocklist (atom #{"YHOO" "MSFT" "GOOG" "AAPL"}))
(def stock-data-cache (atom {}))
(def channels (atom #{}))

(defn parse-yahoo-result
  "A historical obj or whatever that YahooFinance returns"
  [data]
  (map #(hash-map :volume (.getVolume %)
                  :adj-close (.getAdjClose %)
                  :close (.getClose %)
                  :high (.getHigh %)
                  :low (.getLow %)
                  :open (.getOpen %)
                  :date (.format (java.text.SimpleDateFormat. "MM-dd-yyyy") (.getTime (.getDate %)))
                  :symbol (.getSymbol %)) data))

(defn get-historical-stock-quote
  [symbol]
  (let [symbol (.toUpperCase symbol)]
    (try (do
           (let [stock (YahooFinance/get symbol Interval/DAILY)
                 data (.getHistory stock)]
             (parse-yahoo-result data)))
         (catch Exception e {:symbol symbol :error (.toString e)}))))

(defn get-quote [symbol]
  (let [data (@stock-data-cache (keyword symbol))]
    (if (nil? data)
      (do
        (let [result (get-historical-stock-quote symbol)]
          (swap! stock-data-cache assoc (keyword symbol) result)
          result))
      data)))

;; don't really need
;; (defn route-stock [stock]
;;   (let [result (get-historical-stock-quote stock)]
;;     {:status 200 :headers {"Content-Type" "application/json"} :body (json/write-str result)}))

(defn route-home []
  (render-file "views/index.html" []))

(defn socket-send-list! [users]
  (doseq [channel users]
    (send! channel (json/write-str {:action "list" :stocks @stocklist}))))

(defn socket-send-data! [channel symbol]
  (let [data (get-quote symbol)]
    (send! channel (json/write-str {:action "data" :symbol symbol :data (get-quote symbol)}))))

(defn socket-receive [channel data]
  (let [data (json/read-str data)
        ^String symbol (data "symbol")]
    (case (data "action")
      "add" (do
                 (swap! stocklist conj (.toUpperCase symbol))
                 (socket-send-list! @channels))
      "remove" (do
                 (swap! stocklist #(remove #{symbol} %))
                 (socket-send-list! @channels))
      "data" (socket-send-data! channel symbol)
      (socket-send-list! [channel])))) ;; default send back list to specific client

(defn socket-connect! [channel]
  (swap! channels conj channel))

(defn socket-disconnect! [channel status]
  (swap! channels #(remove #{channel} %)))

(defn ws-handler [request]
  (with-channel request channel
    (socket-connect! channel)
    (on-close channel (partial socket-disconnect! channel))
    (on-receive channel (partial socket-receive channel))))

(defroutes app
  (GET "/" [] (route-home))
  (GET "/ws" request (ws-handler request))
;;  (GET "/api/stock/:stock" [stock] (route-stock stock))
  (route/resources "/asset/")
  (route/not-found "Not Found"))

(defn -main [& port]
  (let [port (Integer. (or (first port) (env :port) 3000))]
    (println "HTTP Server starting on:" port)
    (run-server (wrap-defaults #'app site-defaults) {:port port})))
