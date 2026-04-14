import { Worker } from "bullmq";
import { redis } from "../../config/redis.js";
import { transporter } from "../../config/mail.js";
import { MAIL_FROM } from "../../config/env.js";
import { renderTemplate } from "../../utils/templateRenderer.js";

const processEmailJob = async (job) => {
  const { to, subject, template, data } = job.data;

  const html = renderTemplate(template, data);
  
  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject,
    html,
  });

  console.log(`Email sent to ${to} | Job: ${job.id}`);
};

export const emailWorker = new Worker("emailQueue", processEmailJob, {
  connection: redis,
});

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed.`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email job ${job.id} failed:`, err.message);
});