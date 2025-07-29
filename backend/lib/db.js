import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        console.log("MONGO_URI from .env:", process.env.MONGO_URI); // 🔍 Debug line

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};
