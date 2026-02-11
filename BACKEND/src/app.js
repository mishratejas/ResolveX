import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';

// Import your routes
import userRoutes from "./routes/user.routes.js";
import staffRoutes from "./routes/staf.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import user_issue from "./routes/user_issue.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import adminIssueRoutes from "./routes/admin_issue.routes.js";
import staffIssueRoutes from "./routes/staff_issue.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import notificationRoutes from './routes/notification.routes.js';
import chatRoutes from "./routes/chat.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import adminDepartmentRoutes from "./routes/admin.department.routes.js";
import adminStaffRoutes from "./routes/admin.staff.routes.js";
import adminUserRoutes from "./routes/admin.user.routes.js";
import auditRoutes from "./routes/audit.routes.js";

const app = express();
const server = createServer(app);

// ✅ SIMPLE CORS FIX - Use basic CORS middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://webster-2025.onrender.com'
];

// Apply CORS middleware with proper configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            return callback(new Error(`Not allowed by CORS: ${origin}`), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

// ✅ FIXED: Don't use app.options() with wildcards
// Express will handle preflight automatically with the cors() middleware above

// Socket.IO Configuration
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
});

// Make io available globally
global.io = io;

// Other middleware
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware
app.use((req, res, next) => {
    next();
});

// Debug route
app.get("/api/debug/routes", (req, res) => {
    res.json({
        message: "Server is running",
        port: process.env.PORT || 3000,
        cors_origins: allowedOrigins,
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use("/api/upload", uploadRouter);
app.use("/api/users", userRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/staff/issues', staffIssueRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/issues", adminIssueRoutes);
app.use("/api/user_issues", user_issue);
app.use("/api/admin/departments", adminDepartmentRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/staff", adminStaffRoutes);
app.use(express.static("public"));
app.use('/api/audit', auditRoutes)
// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        port: process.env.PORT || 3000
    });
});

// Test endpoint
app.get("/api/test-cors", (req, res) => {
    res.json({
        success: true,
        message: "CORS is working!",
        origin: req.headers.origin,
        timestamp: new Date().toISOString()
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);
    
    socket.on('join', (userId) => {
        socket.join(userId.toString());
        console.log(`User ${userId} joined room`);
    });
    
    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
    });
    
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Error:", err.message);

    // CORS error handling
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: err.message,
            allowedOrigins: allowedOrigins
        });
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'File too large. Max 10MB allowed.'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Server error'
    });
});

export { app, server, io };