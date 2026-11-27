import path from "path";
import ejs from "ejs";
import { transporter } from "../lib/nodemailer";

import config from "../config";

export const sendVerificationEmail = async (
  email: string,
  name: string,
  otp: string,
) => {
  const templatePath = path.join(
    process.cwd(),
    "src/templates/verification-email.ejs",
  );
  const html = await ejs.renderFile(templatePath, {
    name,
    otp,
  });
   await transporter.sendMail({
    from:config.smtp_user,
    to:email,
    subject:"Verification Email",
    html,
   })

};


export const sendWelcomeEmail = async (email: string, name: string) => {
  const templatePath = path.join(
    process.cwd(),
    "src/templates/welcome-message.ejs",
  );
  const html = await ejs.renderFile(templatePath, {
    name,
  });

  await transporter.sendMail({
    from: config.smtp_user,
    to: email,
    subject: "Welcome to MediMart!",
    html,
  });
};
