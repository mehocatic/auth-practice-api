require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_KEY,
);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// POST /auth/signup
app.post("/auth/signup", async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ error: "Email and password are required" });
	}

	const { data, error } = await supabase.auth.signUp({ email, password });

	if (error) {
		return res.status(400).json({ error: error.message });
	}

	res.status(201).json({ user: data.user });
});

// POST /auth/login
app.post("/auth/login", async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ error: "Email and password are required" });
	}

	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		return res.status(401).json({ error: "Invalid login credentials" });
	}

	res.status(200).json({
		access_token: data.session.access_token,
		refresh_token: data.session.refresh_token,
	});
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT} and connected to Supabase`);
});
