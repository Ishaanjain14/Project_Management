import mongoose from "mongoose";

let mongoServer;

const connectDB = async () => {
    try {
        // If MONGODB_URI is set (production), connect directly to it
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log(`MongoDB Connected: ${mongoose.connection.host}`);
            return;
        }

        // Local development: try local MongoDB, then fall back to MongoMemoryServer
        const uri = "mongodb://localhost:27017/projecthub";
        try {
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 2000,
            });
            console.log(`MongoDB Connected: ${mongoose.connection.host}`);
        } catch (error) {
            console.log("Local MongoDB not found, falling back to MongoMemoryServer...");
            const { MongoMemoryServer } = await import("mongodb-memory-server");
            mongoServer = await MongoMemoryServer.create();
            const memoryUri = mongoServer.getUri();
            await mongoose.connect(memoryUri);
            console.log(`MongoDB Memory Server Connected at ${memoryUri}`);
        }
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
