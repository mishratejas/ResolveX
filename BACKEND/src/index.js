import dotenv from 'dotenv'
import connectDB from "./db/index.js"
import { server } from "./app.js";

dotenv.config({
    path:'./.env'
});

const PORT = process.env.PORT || 3000;

connectDB()
.then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running at port: ${PORT}`);
        console.log(`Allowed CORS origins: http://localhost:5173, http://127.0.0.1:5173`);
        console.log(`Socket.IO server is running on the same port`);
        
        // Test that server is responding
        console.log(`📡 Test endpoint: http://localhost:${PORT}/api/test-cors`);
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!!", err);
    process.exit(1);
});