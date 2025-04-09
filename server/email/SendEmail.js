import nodemailer from "nodemailer";
import {
  getVerificationTemplate,
  getResetTemplate,
  getDeleteTemplate,
  getFeeReceiptTemplate,
  getFeeNotificationTemplate,
  getPaymentSuccessTemplate,
  getPaymentFailureTemplate,
  getFeeUpdateTemplate,
  getCertificateGeneratedTemplate,
  getContactFormTemplate
} from "../email/temp/EmailTemplate.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMPT_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMPT_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const SendEmail = async ({ email, subject, message, emailType, attachments }) => {
  try {
    let htmlContent;

    switch (emailType) {
      case "VERIFY":
        subject = "Verify your email - Bansuri Vidya Mandir ";
        htmlContent = getVerificationTemplate(message);
        break;
      case "DELETE":
        subject = "Delete your account - Bansuri Vidya Mandir ";
        htmlContent = getDeleteTemplate(message);
        break;
      case "RESET":
        subject = "Reset your password - Bansuri Vidya Mandir ";
        htmlContent = getResetTemplate(message);
        break;
      case "FEE_RECEIPT":
        subject = subject || "Fee Payment Receipt - Bansuri Vidya Mandir ";
        htmlContent = getFeeReceiptTemplate(message);
        break;
      case "FEE_NOTIFICATION":
        subject = subject || "New Fee Assignment - Bansuri Vidya Mandir ";
        htmlContent = getFeeNotificationTemplate(message);
        break;
      case "PAYMENT_SUCCESS":
        subject = subject || "Payment Successful - Bansuri Vidya Mandir ";
        htmlContent = getPaymentSuccessTemplate(message);
        break;
      case "PAYMENT_FAILURE":
        subject = subject || "Payment Failed - Bansuri Vidya Mandir ";
        htmlContent = getPaymentFailureTemplate(message);
        break;
      case "FEE_UPDATE":
        subject = subject || "Fee Update Notification - Bansuri Vidya Mandir ";
        htmlContent = getFeeUpdateTemplate(message);
        break;
      case "CERTIFICATE_GENERATED":
        subject = "Course Completion Certificate - Bansuri Vidya Mandir ";
        htmlContent = getCertificateGeneratedTemplate(message);
        break;
      case "CONTACT_FORM":
        subject = subject || "New Contact Form Submission - Bansuri Vidya Mandir";
        htmlContent = getContactFormTemplate(message);
        break;
      default:
        htmlContent = message;
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject,
      html: htmlContent,
      attachments: attachments || []
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};