import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employee';
import hrRoutes from './routes/hr';
import managerRoutes from './routes/manager';
import Employee from './models/Employee';

const seedManager = async () => {
  try {
    const managerEmail = 'manager@gmail.com';
    const existingManager = await Employee.findOne({ email: managerEmail });
    
    if (!existingManager) {
      const manager = new Employee({
        name: 'Manager',
        email: managerEmail,
        password: '121212',
        role: 'manager',
        hourlyWage: 0
      });
      await manager.save();
      console.log('✅ Manager user created:', managerEmail);
    } else {
      console.log('ℹ️  Manager user already exists:', managerEmail);
    }
  } catch (error) {
    console.error('❌ Error seeding manager:', error);
  }
};

const startServer = async () => {
  // Validate required environment variables
  if (!process.env.JWT_SECRET) {
    console.error('❌ ERROR: JWT_SECRET is not defined in environment variables');
    console.error('Please create a .env file in the backend directory with:');
    console.error('JWT_SECRET=your-secret-key-here');
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI is not defined in environment variables');
    console.error('Please create a .env file in the backend directory with:');
    console.error('MONGODB_URI=your-mongodb-connection-string');
    process.exit(1);
  }

  await connectDB();
  await seedManager();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/test', (req, res) => {
    res.send('Hello World');
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/employee', employeeRoutes);
  app.use('/api/hr', hrRoutes);
  app.use('/api/manager', managerRoutes);

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();