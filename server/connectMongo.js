var Q = require("q");
var MongoClient = require('mongodb').MongoClient;
module.exports = Q.nbind(MongoClient.connect, MongoClient);
