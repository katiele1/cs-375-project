let { WebSocketServer, WebSocket } = require("ws");
let wss = new WebSocketServer({port: 8080})

let express = require("express");
let db = require("./database.js");
let session = require("express-session");
let crypto = require("node:crypto");


let app = express();
let hostname = "localhost";
let port = 3000;

app.use(
	session({
		secret: "temporary-project-secret",
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			sameSite: "lax",
			secure: false,
		},
	}),
);

app.use(express.json());
app.use(express.static("../public"));

wss.on('connection', (ws) => {
	ws.username = "Someone"
	ws.lobby = "Lobby 1"

	let broadcastToLobby = (lobbyName, payload) => {
		wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN && client.lobby === lobbyName) {
					client.send(JSON.stringify(payload));
				}
		});
	};

	let updateLobbyCount = (lobbyName) => {
		let count = 0;
		wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN && client.lobby === lobbyName) {
				count++;
			}
		});
		broadcastToLobby(lobbyName, {type: 'countUpdate', count: count});
	};

	ws.on('message', (message, isBinary) => {
		let rawMessage = message.toString();
		try {
			let data = JSON.parse(rawMessage);

			if (data.type === 'join') {
				ws.username = data.username;
				ws.lobby = data.lobby;

				console.log(`${ws.username} joined lobby: ${ws.lobby}`);

				broadcastToLobby(ws.lobby, {type: 'message', text: `${ws.username} has joined the lobby!`});
				updateLobbyCount(ws.lobby);
				return;
			}

			if (data.type === 'switchLobby') {
				let oldLobby = ws.lobby;
				let newLobby = data.lobby;

				if (oldLobby === newLobby) {
					return;
				}

				broadcastToLobby(oldLobby, {type: 'message', text: `${ws.username} has left the lobby.`});
				
				ws.lobby = newLobby;

				broadcastToLobby(newLobby, {type: 'message', text: `${ws.username} has joined the lobby!`});
				updateLobbyCount(oldLobby);
				updateLobbyCount(newLobby);
			}

			if (data.type === "catch") {
				broadcastToLobby(ws.lobby, {type: "message", text: data.text});
				return;
			}
		} catch (e) {
			broadcastToLobby(ws.lobby, { type: 'message', text: rawMessage });
		}
	});

	ws.on('close', () => {
		console.log(`${ws.username} disconnected.`);
		broadcastToLobby(ws.lobby, {type: 'message', text: `${ws.username} has left the lobby.` });
		updateLobbyCount(ws.lobby);
	});
});

function hashToken(token) {
	return crypto.createHash("sha256").update(token).digest("hex");
}

app.post("/api/fish", function (req, res) {
	if (!req.session.userId) {
		return res.status(401).json({
			error: "You must be logged in to fish.",
		});
	}

	let fish = {
		name: "Bluegill",
		weight: 1.4,
		rarity: "Common",
		value: 10,
		id: 0,
	};

	let user = db.prepare(`
		SELECT username
		FROM users
		WHERE id = ?
	`).get(req.session.userId);

	let insert = db.prepare(
		`INSERT INTO catches (user, fish_id, weight, value) VALUES (?, ?, ?, ?)`,
	);
	insert.run(user.username, fish.id, fish.weight, fish.value);

	res.json(fish);
});

app.post("/api/inventory", function (req, res) {
	if (!req.session.userId) {
		return res.status(401).json({
			error: "You must be logged in."
		});
	}

	let user = db.prepare(`
		SELECT username
		FROM users
		WHERE id = ?
	`).get(req.session.userId);

	let results = db.prepare(`
		SELECT fish_id, weight, value
		FROM catches
		WHERE user = ?
	`).all(user.username);

	res.json(results);
});

app.post("/api/register", function (req, res) {
	let username =
		typeof req.body.username === "string" ? req.body.username.trim() : "";

	let email =
		typeof req.body.email === "string"
			? req.body.email.trim().toLowerCase()
			: "";

	if (username === "" || email === "") {
		return res.status(400).json({
			error: "Username and email are required.",
		});
	}

	try {
		let statement = db.prepare(`
			INSERT INTO users (username, email)
			VALUES (?, ?)
		`);

		let result = statement.run(username, email);
		req.session.userId = Number(result.lastInsertRowid);

		res.status(201).json({
			message: "Account created.",
			user: {
				id: Number(result.lastInsertRowid),
				username: username,
				email: email,
			},
		});
	} catch (error) {
		if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
			return res.status(409).json({
				error: "That username or email is already being used.",
			});
		}

		console.error(error);

		res.status(500).json({
			error: "Something went wrong.",
		});
	}
});

app.get("/api/me", function (req, res) {
	if (!req.session.userId) {
		return res.status(401).json({
			loggedIn: false,
		});
	}

	let user = db
		.prepare(
			`
			SELECT id, username, email, coins, level, experience
			FROM users
			WHERE id = ?
		`,
		)
		.get(req.session.userId);

	if (!user) {
		return res.status(401).json({
			loggedIn: false,
		});
	}

	res.json({
		loggedIn: true,
		user: user,
	});
});

app.post("/api/magic-link", function (req, res) {
	let email =
		typeof req.body.email === "string"
			? req.body.email.trim().toLowerCase()
			: "";

	if (email === "") {
		return res.status(400).json({
			error: "Email is required.",
		});
	}

	let user = db
		.prepare(
			`
			SELECT id, username, email
			FROM users
			WHERE email = ?
		`,
		)
		.get(email);

	if (!user) {
		return res.status(404).json({
			error: "No account was found with that email.",
		});
	}

	let token = crypto.randomBytes(32).toString("hex");
	let expiresAt = Date.now() + 15 * 60 * 1000;

	try {
		db.prepare(
			`
			INSERT INTO magic_links (
				user_id,
				token,
				expires_at,
				used
			)
			VALUES (?, ?, ?, 0)
		`,
		).run(user.id, token, expiresAt);

		let link = `http://localhost:3000/api/verify-magic-link?token=${token}`;

		console.log("Magic link:");
		console.log(link);

		res.json({
			message: "Magic link created. Check the server terminal.",
		});
	} catch (error) {
		console.error(error);

		res.status(500).json({
			error: "Something went wrong.",
		});
	}
});

app.get("/api/verify-magic-link", function (req, res) {
	let token = typeof req.query.token === "string" ? req.query.token : "";

	if (token === "") {
		return res.status(400).send("Invalid magic link.");
	}

	let magicLink = db
		.prepare(
			`
			SELECT id, user_id, expires_at, used
			FROM magic_links
			WHERE token = ?
		`,
		)
		.get(token);

	if (!magicLink) {
		return res.status(400).send("Invalid magic link.");
	}

	if (magicLink.used === 1) {
		return res.status(400).send("This magic link has already been used.");
	}

	if (Date.now() > magicLink.expires_at) {
		return res.status(400).send("This magic link has expired.");
	}

	db.prepare(
		`
		UPDATE magic_links
		SET used = 1
		WHERE id = ?
	`,
	).run(magicLink.id);

	req.session.userId = magicLink.user_id;

	res.redirect("/");
});

app.post("/api/logout", function (req, res) {
	req.session.destroy(function (error) {
		if (error) {
			return res.status(500).json({
				error: "Could not log out.",
			});
		}

		res.json({
			message: "Logged out.",
		});
	});
});

app.listen(port, hostname, function () {
	console.log(`http://${hostname}:${port}`);
});
