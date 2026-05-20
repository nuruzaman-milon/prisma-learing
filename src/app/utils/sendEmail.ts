import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_SENDER,

    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const sendEmail = async (
  to: string,

  subject: string,

  html: string,
) => {
  await transporter.sendMail({
    from: process.env.EMAIL_SENDER,

    to,

    subject,

    html,
  });
};

export default sendEmail;
