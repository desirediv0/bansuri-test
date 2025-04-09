import PDFDocument from 'pdfkit';

export const generatePDF = async (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Add logo
            // doc.image('path/to/logo.png', 50, 45, { width: 50 });

            // Header
            doc.fontSize(20)
                .fillColor('#ef4444')
                .text('Bansuri Vidya Mandir ', { align: 'center' })
                .moveDown();

            // Receipt title
            doc.fontSize(16)
                .fillColor('#000')
                .text('Payment Receipt', { align: 'center' })
                .moveDown();

            // Receipt box
            doc.rect(50, doc.y, 500, 200)
                .stroke()
                .moveDown();

            // Receipt Details
            const startY = doc.y;
            doc.fontSize(10)
                .text('Receipt Number:', 70, startY)
                .text(data.receiptNumber, 200, startY)
                .text('Date:', 70, startY + 25)
                .text(new Date(data.paymentDate).toLocaleDateString('en-IN'), 200, startY + 25)
                .text('Student Name:', 70, startY + 50)
                .text(data.userName, 200, startY + 50)
                .text('Fee Type:', 70, startY + 75)
                .text(data.feeType, 200, startY + 75)
                .text('Payment ID:', 70, startY + 100)
                .text(data.razorpay_payment_id, 200, startY + 100)
                .moveDown();

            // Amount box
            doc.rect(50, startY + 140, 500, 40)
                .fillAndStroke('#f9fafb', '#000');

            doc.fontSize(12)
                .fillColor('#000')
                .text('Amount Paid:', 70, startY + 150)
                .fontSize(14)
                .fillColor('#ef4444')
                .text(`₹${data.amount.toFixed(2)}`, 200, startY + 150);

            // Footer
            doc.fontSize(10)
                .fillColor('#666')
                .text('This is a computer generated receipt.', 50, doc.page.height - 100, {
                    align: 'center',
                    width: doc.page.width - 100
                })
                .text('For any queries, please contact support@Bansuri Vidya Mandir .com', {
                    align: 'center',
                    width: doc.page.width - 100
                });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};