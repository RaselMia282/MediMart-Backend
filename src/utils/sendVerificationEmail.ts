import path from "path";
import ejs from "ejs";
import { transporter } from "../lib/nodemailer";
import { from } from "stream/iter";
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
