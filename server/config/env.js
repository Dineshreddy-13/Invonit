import dotenv from "dotenv";
dotenv.config();

export const {
    PORT,
    DATABASE_URL,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    REDIS_URL,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    MAIL_FROM,
    OTP_TTL,
} = process.env;