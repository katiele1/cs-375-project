require("dotenv").config({
	path: "../.env",
});

let { WebSocketServer, WebSocket } = require("ws");
let wss = new WebSocketServer({port: 8080})

let express = require("express");
let db = require("./database.js");
let session = require("express-session");
let crypto = require("node:crypto");
let nodemailer = require("nodemailer");

let app = express();
let hostname = "localhost";
let port = 3000;

let transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
});

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


app.post("/api/generateFish", function (req, res) {
	if (!req.session.userId) {
		return res.status(401).json({
			error: "You must be logged in to fish.",
		});
	}

	let fish = db.prepare(`
		SELECT id, name, avg_weight_kg, rarity, cost, image, location
		FROM fishes
		ORDER BY RANDOM()
		LIMIT 1
	`).get();

	if (!fish) {
		return res.status(500).json({
			error: "Could not generate a fish."
		});
	}
	
	res.json({
		fish_id: fish.id,
		name: fish.name,
		weight: fish.avg_weight_kg,
		rarity: fish.rarity,
		value: fish.cost,
		image: fish.image,
		location: fish.location
});
});


app.post("/api/catchFish", function (req, res) {
	if (!req.session.userId) {
		return res.status(401).json({
			error: "You must be logged in to fish.",
		});
	}

	let fishId = req.body.fish_id;

	let user = db.prepare(`
		SELECT username
		FROM users
		WHERE id = ?
	`).get(req.session.userId);

	if (!user) {
		return res.status(401).json({
			error: "User not found."
		});
	}

	let fish = db.prepare(`
        SELECT id, name, avg_weight_kg, cost
        FROM fishes
        WHERE id = ?
    `).get(fishId);

	if (!fish) {
        return res.status(404).json({
            error: "Fish not found."
        });
    }

	db.prepare(`INSERT INTO catches (user, fish_id, weight, value) VALUES (?, ?, ?, ?)`).run
	(user.username, fish.id, fish.avg_weight_kg, fish.cost);

	db.prepare(`UPDATE users SET experience = experience + ? WHERE id = ?`).run(10, req.session.userId); 
	
	res.json({
        message: "Fish caught!",
		fish_id: fish.id,
		name: fish.name,
		weight: fish.avg_weight_kg,
		value: fish.cost
    });
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
		SELECT
			c.id AS catch_id,
			f.id AS fish_id,
			f.name,
			f.rarity,
			f.image,
			c.weight,
			c.value,
			f.location
		FROM catches AS c
		JOIN fishes AS f ON f.id = c.fish_id
		WHERE c.user = ?
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

app.post("/api/magic-link", async function (req, res) {
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
		return res.json({
			message: "If an account exists for that email, we've sent a login link."
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

		let link = `${process.env.BASE_URL}/api/verify-magic-link?token=${token}`;

		await transporter.sendMail({
			from: `"Fishing Game" <${process.env.EMAIL_USER}>`,
			to: user.email,
			subject: "Fishing Game Login Link",

			text:
				`Click this link to log in:\n\n${link}\n\n` +
				"This link expires in 15 minutes.",

			html: `
				<h2>Fishing Game</h2>

				<p>Click the button below to log in.</p>

				<p>
					<a href="${link}"
						style="
							background:#3b82f6;
							color:white;
							padding:12px 20px;
							text-decoration:none;
							border-radius:6px;
							display:inline-block;">
						Log In
					</a>
				</p>

				<p>This link expires in 15 minutes.</p>
			`
		});

		res.json({
			message: "Check your email for your login link.",
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
