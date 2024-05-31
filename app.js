const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { bindUser, ensureAuthenticated, checkRole } = require('./bind-user');  // Correct path to bind-user.js

// Connect to MongoDB
mongoose.connect('mongodb+srv://bigouawe:Bigouawe07@niguel0.7va3loc.mongodb.net/Hireme', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

const User = require('./models/User');  // Ensure this path is correct

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: 'mongodb+srv://bigouawe:Bigouawe07@niguel0.7va3loc.mongodb.net/Hireme' })
}));

// Use bindUser middleware
app.use(bindUser);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes and other middleware here

app.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = await User.create({ name, email, password, role });

        req.session.userId = newUser._id;

        if (role === 'recruiter') {
            res.sendFile(path.join(__dirname, 'public', 'recruiter-dashboard.html'));
        } else {
            res.sendFile(path.join(__dirname, 'public', 'employee-dashboard.html'));
        }
    } catch (error) {
        console.error('Error signing up user:', error);
        res.status(500).json({ message: 'Error signing up user', error });
    }
});

app.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        req.session.userId = user._id;

        if (user.role === 'recruiter') {
            res.sendFile(path.join(__dirname, 'public', 'recruiter-dashboard.html'));
        } else {
            res.sendFile(path.join(__dirname, 'public', 'employee-dashboard.html'));
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Error logging in user', error });
    }
});

// Protect routes (example usage)
app.get('/recruiter-dashboard', ensureAuthenticated, checkRole('recruiter'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'recruiter-dashboard.html'));
});

app.get('/talent-dashboard', ensureAuthenticated, checkRole('talent'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'employee-dashboard.html'));
});

app.get('/Login', ensureAuthenticated, checkRole('talent'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Login.html'));
});

app.get('/home', ensureAuthenticated, checkRole('talent'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});