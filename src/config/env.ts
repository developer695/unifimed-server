import dotenv from 'dotenv';

dotenv.config();

export const env = {
    PORT: process.env.PORT || 5000,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    NODE_ENV: process.env.NODE_ENV || 'development',

};