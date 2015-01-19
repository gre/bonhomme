
var env = {
  MONGO: process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://127.0.0.1:27017/bonhomme',
  PORT: process.env.PORT || 9832
};

module.exports = env;
