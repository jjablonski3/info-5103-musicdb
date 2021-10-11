const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  username: process.env.USER,
  dburl: process.env.HOST,
  database: process.env.DB,
  authorization: process.env.PASSWORD,
};
