let Database = require("better-sqlite3")
let db = new Database("gamedata.db");

db.prepare(`CREATE TABLE IF NOT EXISTS catches (id INTEGER PRIMARY KEY AUTOINCREMENT, user STRING, fish_id INT, weight INT, value INT)`).run();

module.exports = db;