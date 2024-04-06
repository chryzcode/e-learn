import { Payment } from "../models/payment"

export const paymentSuccessful = async (req: any, res: any) => {
    const { paymentId } = req.params
    const payment = await Payment
}