let express = require("express");

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
	};

	res.json(fish);
});

app.listen(port, hostname, function () {
	console.log(`http://${hostname}:${port}`);
});
