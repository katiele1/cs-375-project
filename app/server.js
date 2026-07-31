let express = require("express");
let db = require('./database.js')

let app = express();
let hostname = "localhost";
let port = 3000;

app.use(express.json());
app.use(express.static("../public"));

app.post("/api/fish", function (req, res) {
	let fish = {
		name: "Bluegill",
		weight: 1.4,
		rarity: "Common",
		value: 10,
		id: 0
	};

	let insert = db.prepare(`INSERT INTO catches (user, fish_id, weight, value) VALUES (?, ?, ?, ?)`);
	insert.run("fakeemail@gmail.com", fish.id, fish.weight, fish.value);

	res.json(fish);
});

app.post("/api/inventory", function (req, res) {
	let results = db.prepare(`SELECT fish_id, weight, value FROM catches WHERE user = ?`).all("fakeemail@gmail.com");
	res.json(results);
});

app.listen(port, hostname, function () {
	console.log(`http://${hostname}:${port}`);
});
