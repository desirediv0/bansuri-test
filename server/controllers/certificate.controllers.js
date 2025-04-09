import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import PDFDocument from "pdfkit";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import { format } from "date-fns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure temp directory exists
const tempDir = path.join(__dirname, "../temp");
fs.mkdir(tempDir, { recursive: true }).catch(console.error);

const generateCertificatePDF = async (certificateData) => {
    const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 50
    });

    // Background color
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');

    // Add elegant border
    const borderWidth = 20;
    doc.rect(borderWidth, borderWidth, doc.page.width - (borderWidth * 2), doc.page.height - (borderWidth * 2))
        .lineWidth(2)
        .stroke('#FFD700');

    // Title
    doc.fontSize(36)
        .font('Times-Bold')
        .fillColor('#002366')
        .text('Bansuri Vidya Mandir', {
            align: 'center'
        })
        .moveDown(0.5);

    // Decorative line
    doc.moveTo(doc.page.width * 0.2, doc.y)
        .lineTo(doc.page.width * 0.8, doc.y)
        .lineWidth(2)
        .stroke('#FFD700');

    // Certificate title
    doc.moveDown()
        .fontSize(32)
        .font('Times-Bold')
        .fillColor('#800020')
        .text('Certificate of Achievement', { align: 'center' })
        .moveDown();

    // Certificate content
    doc.fontSize(20)
        .font('Times-Roman')
        .fillColor('#333333')
        .text('This is to certify that', { align: 'center' })
        .moveDown(0.5);

    // Student name
    doc.fontSize(28)
        .font('Times-Bold')
        .fillColor('#002366')
        .text(certificateData.userName, { align: 'center' })
        .moveDown(0.5);

    // Course details
    doc.fontSize(20)
        .font('Times-Roman')
        .fillColor('#333333')
        .text('has successfully completed the course', { align: 'center' })
        .moveDown(0.5)
        .fontSize(24)
        .font('Times-Bold')
        .text(certificateData.courseTitle, { align: 'center' })
        .moveDown();

    // Date and grade
    doc.fontSize(18)
        .font('Times-Roman')
        .text(`Awarded on ${format(new Date(certificateData.completedDate), 'MMMM dd, yyyy')}`, { align: 'center' });

    if (certificateData.grade) {
        doc.moveDown(0.5)
            .text(`Grade Achieved: ${certificateData.grade}`, { align: 'center' });
    }

    // Verification URL at bottom right
    doc.moveDown(1.5); // Add some space before the verification URL
    doc.fontSize(10)
        .fillColor('#666666')
        .text(
            `Verify at: ${process.env.FRONTEND_URL}/verify/${certificateData.certificateId}`,
            doc.page.width - 200,
            doc.y
        );

    return doc;
};

export const getUserCertificates = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const certificates = await prisma.courseCompletion.findMany({
        where: {
            userId
        },
        include: {
            course: {
                select: {
                    title: true,
                    description: true
                }
            }
        }
    });

    return res.status(200).json(
        new ApiResponsive(200, certificates, "Certificates retrieved successfully")
    );
});

export const downloadCertificate = asyncHandler(async (req, res) => {
    const { certificateId } = req.params;

    const certificate = await prisma.courseCompletion.findUnique({
        where: {
            certificateId
        },
        include: {
            user: true,
            course: true
        }
    });

    if (!certificate) {
        throw new ApiError(404, "Certificate not found");
    }

    // Create certificate data object
    const certificateData = {
        userName: certificate.user.name,
        courseTitle: certificate.course.title,
        completedDate: certificate.completedAt,
        certificateId: certificate.certificateId,
        grade: certificate.grade
    };

    // Generate PDF using the existing elegant template
    const doc = await generateCertificatePDF(certificateData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificateId}.pdf`);

    // Pipe the PDF directly to the response
    doc.pipe(res);
    doc.end();
});

export const shareCertificate = asyncHandler(async (req, res) => {
    const { certificateId } = req.params;
    const userId = req.user.id;

    const certificate = await prisma.courseCompletion.findUnique({
        where: { certificateId },
        include: {
            user: true,
            course: true
        }
    });

    if (!certificate) {
        throw new ApiError(404, "Certificate not found");
    }

    if (certificate.userId !== userId && req.user.role !== 'ADMIN') {
        throw new ApiError(403, "Not authorized to share this certificate");
    }

    const shareUrl = `${process.env.FRONTEND_URL}/verify/${certificateId}`;

    return res.status(200).json(
        new ApiResponsive(200, { shareUrl }, "Share URL generated successfully")
    );
});

export const getAllCertificates = asyncHandler(async (req, res) => {
    const certificates = await prisma.courseCompletion.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            },
            course: {
                select: {
                    title: true
                }
            }
        },
        orderBy: { completedAt: 'desc' }
    });

    return res.status(200).json(
        new ApiResponsive(200, certificates, "All certificates fetched successfully")
    );
});

export const generateCertificate = asyncHandler(async (req, res) => {
    const { userId, courseId, grade } = req.body;

    // Check if certificate already exists
    const existingCertificate = await prisma.courseCompletion.findFirst({
        where: { userId, courseId }
    });

    if (existingCertificate) {
        throw new ApiError(400, "Certificate already exists for this user and course");
    }

    const certificate = await prisma.courseCompletion.create({
        data: {
            userId,
            courseId,
            grade,
            certificateId: nanoid(10)
        },
        include: {
            user: true,
            course: true
        }
    });

    return res.status(201).json(
        new ApiResponsive(201, certificate, "Certificate generated successfully")
    );
});

export const updateCertificate = asyncHandler(async (req, res) => {
    const { certificateId } = req.params;
    const { grade } = req.body;

    const certificate = await prisma.courseCompletion.update({
        where: { certificateId },
        data: { grade },
        include: {
            user: true,
            course: true
        }
    });

    return res.status(200).json(
        new ApiResponsive(200, certificate, "Certificate updated successfully")
    );
});

export const deleteCertificate = asyncHandler(async (req, res) => {
    const { certificateId } = req.params;

    await prisma.courseCompletion.delete({
        where: { certificateId }
    });

    return res.status(200).json(
        new ApiResponsive(200, null, "Certificate deleted successfully")
    );
});

export const verifyCertificate = asyncHandler(async (req, res) => {
    const { certificateId } = req.params;

    const certificate = await prisma.courseCompletion.findUnique({
        where: { certificateId },
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            },
            course: {
                select: {
                    title: true,
                    description: true
                }
            }
        }
    });

    if (!certificate) {
        throw new ApiError(404, "Certificate not found or invalid");
    }

    // Return verification data
    return res.status(200).json(
        new ApiResponsive(200, {
            isValid: true,
            certificateData: {
                studentName: certificate.user.name,
                courseName: certificate.course.title,
                issueDate: format(new Date(certificate.completedAt), 'MMMM dd, yyyy'),
                grade: certificate.grade,
                certificateId: certificate.certificateId
            }
        }, "Certificate verified successfully")
    );
}); 