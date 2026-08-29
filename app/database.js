let Database = require("better-sqlite3");


let path = require("path");
let dbPath = path.join(__dirname, 'data', "gamedata.db"); 
let db = new Database(dbPath);

const fishes = require("./fishes.json");

db.prepare(
	`CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		email TEXT UNIQUE NOT NULL,
		coins INTEGER NOT NULL DEFAULT 0,
		level INTEGER NOT NULL DEFAULT 1,
		experience INTEGER NOT NULL DEFAULT 0,
		baitLevel INTEGER NOT NULL DEFAULT 1,
		floatLevel INTEGER NOT NULL DEFAULT 1,
		rodLevel INTEGER NOT NULL DEFAULT 1
	)`,
).run();

db.prepare(`
	CREATE TABLE IF NOT EXISTS fishes (
		id INTEGER PRIMARY KEY,
		name TEXT NOT NULL,
		latin_name TEXT,
		description TEXT,
		avg_weight_kg REAL,
		avg_length_cm REAL,
		rarity TEXT NOT NULL,
		cost INTEGER NOT NULL,
		image TEXT,
		location TEXT
	)
`).run();


db.prepare(
	`CREATE TABLE IF NOT EXISTS catches (id INTEGER PRIMARY KEY AUTOINCREMENT, user STRING, fish_id INT, weight INT, value INT)`,
).run();

db.prepare(
	`CREATE TABLE IF NOT EXISTS market (id INTEGER PRIMARY KEY AUTOINCREMENT, user STRING, fish_id INT, weight INT, cost INT)`,
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

const insertFish = db.prepare(`
	INSERT INTO fishes (
		id,
		name,
		latin_name,
		description,
		avg_weight_kg,
		avg_length_cm,
		rarity,
		cost,
		image,
		location
	)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	ON CONFLICT(id) DO UPDATE SET
		name = excluded.name,
		latin_name = excluded.latin_name,
		description = excluded.description,
		avg_weight_kg = excluded.avg_weight_kg,
		avg_length_cm = excluded.avg_length_cm,
		rarity = excluded.rarity,
		cost = excluded.cost,
		image = excluded.image,
		location = excluded.location
`);

const importFishes = db.transaction((fishList) => {
	for (const fish of fishList) {
		insertFish.run(
			fish.fish_id,
			fish.name,
			fish.latin_name,
			fish.description,
			fish.avg_weight_kg,
			fish.avg_length_cm,
			fish.rarity,
			fish.cost,
			fish.image,
			fish.location
		);
	}
});

importFishes(fishes);

module.exports = db;
