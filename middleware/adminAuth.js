import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';

const adminAuth = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify the admin exists
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(403).json({ message: 'Access denied. Admin not found.' });
    }

    req.admin = decoded.id; // Attach admin ID to the request object
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export default adminAuth;
