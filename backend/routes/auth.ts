import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Employee, { IUser } from '../models/Employee';
import { protect, AuthRequest } from '../middleware/auth';

interface LoginRequestBody {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

const router = express.Router();

// Login
router.post('/login', async (req: express.Request<{}, {}, LoginRequestBody>, res: express.Response<LoginResponse | { message: string }>) => {
  const { email, password } = req.body;
  
  // Check if JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    return res.status(500).json({ message: 'Server configuration error' });
  }
  
  const user = await Employee.findOne({ email }) as IUser | null;
  if (user && await user.matchPassword(password)) {
    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ 
      token, 
      user: { id: userId, name: user.name, role: user.role } 
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Get current user
router.get('/me', protect, (req: AuthRequest, res) => {
  if (req.user) {
    res.json({
      id: (req.user._id as mongoose.Types.ObjectId).toString(),
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    });
  } else {
    res.status(401).json({ message: 'User not found' });
  }
});

export default router;