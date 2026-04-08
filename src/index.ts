import "dotenv/config";
import app from "./app";
import connectDB from "./configs/db.config";

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
    await connectDB();

    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    const shutdown = (signal: string) => {
        console.log(`${signal} received. Shutting down gracefully...`);
        server.close(() => {
            console.log("HTTP server closed");
            process.exit(0);
        });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason: unknown) => {
        console.error("Unhandled Rejection:", reason);
        server.close(() => process.exit(1));
    });
};

startServer();