let Database = require("better-sqlite3");
let db = new Database("gamedata.db");

db.prepare(
	`CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		email TEXT UNIQUE NOT NULL,
		coins INTEGER NOT NULL DEFAULT 0,
		level INTEGER NOT NULL DEFAULT 1,
		experience INTEGER NOT NULL DEFAULT 0)`,
).run();

db.prepare(
	`CREATE TABLE IF NOT EXISTS catches (id INTEGER PRIMARY KEY AUTOINCREMENT, user STRING, fish_id INT, weight INT, value INT)`,
).run();

db.prepare(
	`
	CREATE TABLE IF NOT EXISTS magic_links (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		token TEXT UNIQUE NOT NULL,
		expires_at INTEGER NOT NULL,
		used INTEGER NOT NULL DEFAULT 0,
		FOREIGN KEY (user_id) REFERENCES users(id)
	)
`,
).run();

module.exports = db;
