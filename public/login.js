let form = document.getElementById("login-form");
let message = document.getElementById("message");

form.addEventListener("submit", async function (event) {
	event.preventDefault();

	let email = document.getElementById("email").value.trim().toLowerCase();

	try {
		let response = await fetch("/api/magic-link", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: email,
			}),
		});

		let data = await response.json();

		if (!response.ok) {
			throw new Error(data.error);
		}

		message.textContent = data.message;
	} catch (error) {
		message.textContent = error.message;
	}
});
