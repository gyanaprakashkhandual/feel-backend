import "dotenv/config";
import app from "./app";
import connectDB from "./configs/db.config";

// Fix: Extract just the port number
const PORT = process.env.PORT ? parseInt(process.env.PORT.split(':').pop() || '5000') : 5000;

const startServer = async (): Promise<void> => {
    try {
        console.log("🚀 Starting server initialization...");
        console.log("📁 Environment variables loaded:", {
            PORT: PORT,
            RAW_PORT: process.env.PORT,
            NODE_ENV: process.env.NODE_ENV,
            API_BASE_URL: process.env.API_BASE_URL,
            hasMongoURI: !!process.env.MONGO_URI,
            hasSpotifyClientId: !!process.env.SPOTIFY_CLIENT_ID,
            hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        });

        // Connect to MongoDB
        console.log("📦 Attempting MongoDB connection...");
        await connectDB();
        console.log("✅ MongoDB connected successfully");

        // Debug: List all registered routes (fixed)
        console.log("\n📋 Registered Routes:");
        const routes: any[] = [];
        
        // @ts-ignore - Check if router exists
        if (app._router && app._router.stack) {
            // @ts-ignore
            app._router.stack.forEach((middleware: any) => {
                if (middleware.route) {
                    // Routes registered directly
                    const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
                    routes.push({
                        path: middleware.route.path,
                        methods: methods
                    });
                    console.log(`   ${methods} ${middleware.route.path}`);
                } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
                    // Router middleware
                    middleware.handle.stack.forEach((handler: any) => {
                        if (handler.route) {
                            const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
                            let basePath = '';
                            
                            // Extract base path from regex
                            if (middleware.regexp) {
                                basePath = middleware.regexp.source
                                    .replace(/\\\//g, '/')
                                    .replace(/\^/g, '')
                                    .replace(/\?\(\?=\\\/\|\$\)\/i/g, '')
                                    .replace(/\?\(\?=\\\/\|\$\)/g, '')
                                    .replace(/\\/g, '');
                            }
                            
                            const fullPath = basePath + handler.route.path;
                            routes.push({
                                path: fullPath,
                                methods: methods
                            });
                            console.log(`   ${methods} ${fullPath}`);
                        }
                    });
                }
            });
            console.log(`   Total routes: ${routes.length}\n`);
        } else {
            console.log("   ⚠️ No routes registered yet\n");
        }

        // Start server with explicit binding
        console.log(`🔌 Attempting to bind server to 127.0.0.1:${PORT}...`);
        
        const server = app.listen(PORT, '127.0.0.1', () => {
            console.log(`\n✅ Server successfully started!`);
            console.log(`📍 Local: http://127.0.0.1:${PORT}`);
            console.log(`📍 Localhost: http://localhost:${PORT}`);
            console.log(`\n🔗 Test endpoints:`);
            console.log(`   Health check: http://127.0.0.1:${PORT}/health (if exists)`);
            console.log(`   API base: http://127.0.0.1:${PORT}/api`);
            console.log(`\n💡 Tip: Use http://127.0.0.1:${PORT} not localhost for Spotify OAuth\n`);
        });

        // Error handling for server
        server.on('error', (error: any) => {
            console.error('❌ Server error:', error);
            if (error.code === 'EADDRINUSE') {
                console.error(`\n⚠️ Port ${PORT} is already in use!`);
                console.error(`Run this command to find and kill the process:`);
                console.error(`Windows: netstat -ano | findstr :${PORT}`);
                console.error(`Mac/Linux: lsof -i :${PORT}`);
            } else if (error.code === 'EACCES') {
                console.error(`\n⚠️ Permission denied to bind to port ${PORT}`);
                console.error(`Try using a port > 1024 or run with admin privileges`);
            }
            process.exit(1);
        });

        // Graceful shutdown
        const shutdown = (signal: string) => {
            console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
            server.close(() => {
                console.log("✅ HTTP server closed");
                process.exit(0);
            });
            
            // Force close after 10 seconds
            setTimeout(() => {
                console.error("❌ Could not close connections in time, forcefully shutting down");
                process.exit(1);
            }, 10000);
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));

        process.on("unhandledRejection", (reason: unknown, promise: Promise<any>) => {
            console.error("❌ Unhandled Rejection at:", promise);
            console.error("Reason:", reason);
            server.close(() => process.exit(1));
        });

        process.on("uncaughtException", (error: Error) => {
            console.error("❌ Uncaught Exception:", error);
            server.close(() => process.exit(1));
        });

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

// Start with error boundary
startServer().catch((error) => {
    console.error("❌ Fatal error during startup:", error);
    process.exit(1);
});