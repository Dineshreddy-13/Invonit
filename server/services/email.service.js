// services/email.service.js
import { emailQueue } from "../jobs/queues/email.queue.js";

export const sendOTPEmail = async ({ to, name, otp, expiry = "10 minutes" }) => {
  await emailQueue.add("send-email", {
    to,
    subject: "Your Invonit Verification Code",
    template: "otpEmail",
    data: { name, otp, expiry },
  });
};
