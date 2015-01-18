var Q = require("q");
var _ = require("lodash");
var byline = require('byline');
var fs = require("fs");

var DICTCOLL = "dict";

function MapNameGenerator (db) {
  if (!(this instanceof MapNameGenerator)) return new MapNameGenerator(db);
  this.coll = db.collection(DICTCOLL);
}

function capitalize (name) {
  return name.substring(0, 1).toUpperCase() + name.substring(1);
}

MapNameGenerator.prototype = {
  insertDictionary: function (dictfile) {
    var coll = this.coll;
    var streamDefer = Q.defer();
    var i = 0;
    var insertions = [];
    byline(fs.createReadStream(dictfile, { encoding: 'utf8' }))
      .on("data", function (word) {
        var item = { word: word, length: word.length, index: i++ };
        insertions.push(Q.ninvoke(coll, "insert", item));
      })
      .on("end", streamDefer.resolve)
      .on("error", streamDefer.reject);
    return streamDefer.promise.then(function () {
      return Q.all(insertions);
    });
  },

  countDictionary: function () {
    return Q.ninvoke(this.coll, "count");
  },

  cleanDictionary: function () {
    return Q.ninvoke(this.coll, "remove");
  },

  init: function (dictfile, expectedCount) {
    var self = this;
    return this.countDictionary()
      .then(function (count) {
        if ((!expectedCount || count === expectedCount) && count > 0) return; // All good
        console.log("Initializing dictionary... This can takes a few minutes...");
        return self.cleanDictionary()
          .then(function () {
            return self.insertDictionary(dictfile);
          });
      })
      .then(function () {
        return self.countDictionary();
      });
  },

  pick: function (random) {
    var coll = this.coll;
    return this.countDictionary()
      .then(function (count) {
        var indexA = Math.floor(count * random());
        var indexB = Math.floor(count * random());
        return Q.all([
          Q.ninvoke(coll.find({ index: indexA }), "toArray"),
          Q.ninvoke(coll.find({ index: indexB }), "toArray")
        ]);
      })
      .spread(function (a, b) {
        if (a.length !== 1) throw new Error("a has size = "+a.length);
        if (b.length !== 1) throw new Error("b has size = "+b.length);
        a = a[0].word;
        b = b[0].word;

        var allPreA = _.map(_.range(3, 6), function (i) {
          return a.substring(0, i);
        });

        var allEndB = _.union(
          _.map(_.range(2, 5), function (i) {
            return b.substring(b.length - i); // Use the end of the word
          }),
          _.map(_.range(3, 6), function (i) {
            return b.substring(0, i); // Use the beginning of the world
          })
        );


        var all = _.flatten(_.map(allPreA, function (preA) {
          return _.map(allEndB, function (endB) {
            return preA+endB;
          });
        }));

        function vowel (c) {
          return c==="e" || c==="a" || c==="i" || c==="u" || c==="o" || c==="y";
        }

        function score (w) {
          var targetLength = 8;
          var scoreDist = - Math.pow(Math.max(0, Math.abs(w.length - targetLength) - 1), 2);

          var followingVowels = [];
          var followingConsonants = [];
          var vo = 0, co = 0;
          for (var i=0; i<w.length; ++i) {
            var c = w[i];
            if (vowel(c)) {
              ++vo;
              if (co) {
                followingConsonants.push(co);
                co = 0;
              }
            }
            else {
              ++co;
              if (vo) {
                followingVowels.push(vo);
                vo = 0;
              }
            }
          }
          if (co) {
            followingConsonants.push(co);
          }
          if (vo) {
            followingVowels.push(vo);
          }

          var scoreConsonants = - _.reduce(followingConsonants, function (sum, r) { return sum + Math.pow(r, 2); }, 0);
          var scoreVowels = - _.reduce(followingVowels, function (sum, r) { return sum + Math.pow(r, 2); }, 0);

          return scoreConsonants + scoreVowels + scoreDist;
        }

        var name = _.last(_.sortBy(all, score));
        return capitalize(name);
      });
  }
};

module.exports = MapNameGenerator;
