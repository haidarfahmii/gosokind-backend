import rateLimit from "express-rate-limit";

// Aggressive limiting for transactional actions to prevent button-mashing
// 5 requests per minute per IP
export const actionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests. Please wait a moment before trying again.",
  },
});
