let form = document.getElementById("register-form");
let message = document.getElementById("message");

form.addEventListener("submit", async function (event) {
	event.preventDefault();

	let username = document.getElementById("username").value.trim();

	let email = document.getElementById("email").value.trim();

	try {
		let response = await fetch("/api/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username: username,
				email: email,
			}),
		});

		let data = await response.json();

		if (!response.ok) {
			throw new Error(data.error);
		}

		message.textContent = "Account created successfully.";
	} catch (error) {
		message.textContent = error.message;
	}
});
