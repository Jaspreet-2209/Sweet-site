require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- CONFIGURATION ---
const app = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI ;
const JWT_SECRET = process.env.JWT_SECRET;

// --- MIDDLEWARE ---
app.use(cors()); // Allow frontend access
app.use(express.json()); // Parse JSON bodies

// --- DATABASE CONNECTION ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- MODELS ---

// 1. User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  name: { type: String, default: 'Sweet Lover' }
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// 2. Sweet Schema
const sweetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  image: { type: String, default: 'https://placehold.co/400?text=Sweet' }
}, { timestamps: true });

const Sweet = mongoose.model('Sweet', sweetSchema);

// --- AUTH MIDDLEWARE ---

// Verify Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user; // Attach user payload to request
    next();
  });
};

// Check Admin Role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access Denied: Admins Only' });
  }
};

// --- ROUTES ---

// 1. AUTH ROUTES
// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Create new user (allow role setting for demo purposes, restrict in prod)
    const user = new User({ email, password, name, role: role || 'user' });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate Token
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// 2. SWEETS ROUTES

// GET /api/sweets (Public) - List all sweets
app.get('/api/sweets', async (req, res) => {
  try {
    const sweets = await Sweet.find();
    res.json(sweets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sweets', error: error.message });
  }
});

// GET /api/sweets/search (Public) - Search by name, category, or price range
app.get('/api/sweets/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    let query = {};

    // Text Search (Name or Description)
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    // Category Filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Price Range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const sweets = await Sweet.find(query);
    res.json(sweets);
  } catch (error) {
    res.status(500).json({ message: 'Error searching sweets', error: error.message });
  }
});

// POST /api/sweets (Protected, Admin Only) - Add new sweet
app.post('/api/sweets', authenticateToken, isAdmin, async (req, res) => {
  try {
    const sweet = new Sweet(req.body);
    const savedSweet = await sweet.save();
    res.status(201).json(savedSweet);
  } catch (error) {
    res.status(400).json({ message: 'Error creating sweet', error: error.message });
  }
});

// PUT /api/sweets/:id (Protected, Admin Only) - Update sweet
app.put('/api/sweets/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const updatedSweet = await Sweet.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true } // Return updated doc, run validations
    );
    if (!updatedSweet) return res.status(404).json({ message: 'Sweet not found' });
    res.json(updatedSweet);
  } catch (error) {
    res.status(400).json({ message: 'Error updating sweet', error: error.message });
  }
});

// DELETE /api/sweets/:id (Protected, Admin Only) - Delete sweet
app.delete('/api/sweets/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const deletedSweet = await Sweet.findByIdAndDelete(req.params.id);
    if (!deletedSweet) return res.status(404).json({ message: 'Sweet not found' });
    res.json({ message: 'Sweet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting sweet', error: error.message });
  }
});

// 3. INVENTORY ROUTES

// POST /api/sweets/:id/purchase (Protected) - Decrease quantity
app.post('/api/sweets/:id/purchase', authenticateToken, async (req, res) => {
  try {
    const sweet = await Sweet.findById(req.params.id);
    if (!sweet) return res.status(404).json({ message: 'Sweet not found' });

    if (sweet.quantity < 1) {
      return res.status(400).json({ message: 'Item is out of stock' });
    }

    sweet.quantity -= 1;
    await sweet.save();

    res.json({ message: 'Purchase successful', sweet });
  } catch (error) {
    res.status(500).json({ message: 'Purchase failed', error: error.message });
  }
});

// POST /api/sweets/:id/restock (Protected, Admin Only) - Increase quantity
app.post('/api/sweets/:id/restock', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { amount } = req.body; // Expect JSON body { "amount": 10 }
    const restockAmount = amount ? parseInt(amount) : 10; // Default to 10 if not specified

    const sweet = await Sweet.findById(req.params.id);
    if (!sweet) return res.status(404).json({ message: 'Sweet not found' });

    sweet.quantity += restockAmount;
    await sweet.save();

    res.json({ message: `Restocked ${restockAmount} items`, sweet });
  } catch (error) {
    res.status(500).json({ message: 'Restock failed', error: error.message });
  }
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});