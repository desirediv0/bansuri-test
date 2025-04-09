import { prisma } from "../config/db.js";
import { SendEmail } from "../email/SendEmail.js";

export const submitContactForm = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !phone || !message) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields",
            });
        }

        // Data validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid 10-digit phone number",
            });
        }

        // Save contact form submission to database
        await prisma.contact.create({
            data: {
                name,
                email,
                phone,
                subject,
                message,
            }
        });

        // Send email to admin
        const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;

        const formattedSubject = subject ?
            `Contact Form: ${subject}` :
            "New Contact Form Submission";

        const emailSent = await SendEmail({
            email: adminEmail,
            subject: formattedSubject,
            message: { name, email, phone, subject, message },
            emailType: "CONTACT_FORM",
        });

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to send your message. Please try again later.",
            });
        }

        // Optional: Send confirmation email to the user
        await SendEmail({
            email: email,
            subject: "Thank you for contacting Bansuri Vidya Mandir",
            message: `Dear ${name},<br><br>Thank you for reaching out to us. We have received your message and will get back to you shortly.<br><br>Regards,<br>Bansuri Vidya Mandir Team`,
            emailType: "DEFAULT",
        });

        return res.status(200).json({
            success: true,
            message: "Your message has been sent successfully. We'll contact you soon!",
        });
    } catch (error) {
        console.error("Contact form submission error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};


export const getContactFormSubmissions = async (req, res) => {
    try {
        const contactSubmissions = await prisma.contact.findMany({
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({
            success: true,
            data: contactSubmissions,
        });
    } catch (error) {
        console.error("Get contact form submissions error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
}