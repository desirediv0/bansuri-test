import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const validateFeePayment = asyncHandler(async (req, res, next) => {
    const { feeId, amount } = req.body;

    const fee = await prisma.fee.findUnique({
        where: { id: feeId },
        include: { payments: true },
    });

    if (!fee) {
        throw new ApiError(404, "Fee not found");
    }

    const paidAmount = fee.payments.reduce((sum, payment) =>
        sum + (payment.status === "COMPLETED" ? payment.amount : 0), 0);

    if (paidAmount + amount > fee.amount) {
        throw new ApiError(400, "Payment amount exceeds due amount");
    }

    next();
});