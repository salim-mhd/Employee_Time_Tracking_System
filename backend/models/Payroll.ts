import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPayroll extends Document {
  employeeId: mongoose.Types.ObjectId;
  period: string;
  basePay: number;
  overtimePay: number;
  deductions: number;
  totalPay: number;
  status: string;
}

const payrollSchema: Schema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  period: { type: String, required: true },
  basePay: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  totalPay: { type: Number, default: 0 },
  status: { type: String, default: 'processed' }
}, { timestamps: true });

const Payroll: Model<IPayroll> = mongoose.model<IPayroll>('Payroll', payrollSchema);
export default Payroll;