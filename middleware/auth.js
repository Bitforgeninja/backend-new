import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Authorization Header:', req.header('Authorization'));

    if (!token) {
      return res.status(401).json({ msg: 'No token provided. Authorization denied.' });
    }

    // Verify the token and decode its payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user ID to the request object for further use in routes
    req.user = decoded.id;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    console.error('Error during token verification:', err.message);
    return res.status(401).json({ msg: 'Invalid token. Authorization denied.' });
  }
};


export default auth;
