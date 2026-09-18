require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./openapi.json");
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_KEY,
);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

async function requireAuth(req, res, next) {
	const authHeader = req.headers.authorization;

	if (
		!authHeader ||
		!authHeader.startsWith("Bearer ") ||
		authHeader.split(" ")[1] === ""
	) {
		return res.status(401).json({ error: "Access token required" });
	}

	const token = authHeader.split(" ")[1];
	const { data, error } = await supabase.auth.getUser(token);

	if (error || !data.user) {
		return res.status(401).json({ error: "Invalid or expired token" });
	}

	req.user = data.user;
	req.token = token;

	next();
}

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

app.post("/auth/logout", requireAuth, async (req, res) => {
	const { error } = await supabase.auth.signOut();

	if (error) {
		return res.status(400).json({ error: error.message });
	}

	res.status(204).send();
});

app.get("/public/info", (req, res) => {
	res.status(200).json({ message: "Welcome stranger! This info is public." });
});

app.get("/protected/profile", requireAuth, (req, res) => {
	res.status(200).json({
		id: req.user.id,
		email: req.user.email,
		created_at: req.user.created_at,
	});
});

app.get("/protected/dashboard", requireAuth, (req, res) => {
	res
		.status(200)
		.json({ message: `Welcome to your dashboard, ${req.user.email}` });
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT} and connected to Supabase`);
});
