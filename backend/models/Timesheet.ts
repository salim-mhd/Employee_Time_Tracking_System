import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITimesheet extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  totalHours: number;
  overtimeHours: number;
  status: 'pending' | 'approved' | 'rejected';
  location?: string;
}

const timesheetSchema: Schema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  clockIn: { type: Date },
  clockOut: { type: Date },
  totalHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  location: { type: String }
}, { timestamps: true });

const Timesheet: Model<ITimesheet> = mongoose.model<ITimesheet>('Timesheet', timesheetSchema);
export default Timesheet;