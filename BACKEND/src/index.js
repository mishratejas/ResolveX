import dotenv from 'dotenv';
dotenv.config();

const { default: connectDB } = await import("./db/index.js");
const { server } = await import("./app.js");

const PORT = process.env.PORT || 5000;

// Quick sanity check so it's obvious in the logs whether the key loaded.
console.log(
    `Gemini key loaded: ${Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)}`
);

connectDB()
.then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running at port: ${PORT}`);
        console.log(`Allowed CORS origins: ${process.env.FRONTEND_URL}, http://localhost:5173, http://127.0.0.1:5173`);
        console.log(`Socket.IO server is running on the same port`);
        console.log(`Test endpoint: http://localhost:${PORT}/api/test-cors`);
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!!", err);
    process.exit(1);
});