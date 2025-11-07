import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'manager' | 'hr';
  hourlyWage: number;
  managerId?: mongoose.Types.ObjectId;
  team?: mongoose.Types.ObjectId[];
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const employeeSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employee', 'manager', 'hr'], default: 'employee' },
  hourlyWage: { type: Number, default: 0 },
  managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
}, { timestamps: true });

employeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  (this as unknown as IUser).password = await bcrypt.hash((this as unknown as IUser).password, 10);
  next();
});

employeeSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, (this as unknown as IUser).password);
};

const Employee: Model<IUser> = mongoose.model<IUser>('Employee', employeeSchema);
export default Employee;