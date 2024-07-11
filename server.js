const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const { check, validationResult } = require('express-validator');
const fs = require('fs');

const app = express();

// Configure session middleware
app.use(
  session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
  })
);

// Create MySQL connection (consider using a connection pool for better performance)
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'Admin1234@2024',
  database: 'learning_management',
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as ID:', connection.threadId);
});

// Set up middleware to parse incoming JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define a User representation for clarity
const User = {
  tableName: 'users',
  createUser: function (newUser, callback) {
    connection.query('INSERT INTO ?? SET ?', [this.tableName, newUser], callback);
  },
  getUserByEmail: function (email, callback) {
    connection.query('SELECT * FROM ?? WHERE email = ?', [this.tableName, email], callback);
  },
  getUserByUsername: function (username, callback) {
    connection.query('SELECT * FROM ?? WHERE username = ?', [this.tableName, username], callback);
  },
};

// Serve CSS
app.get('/style.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'style.css'));
});

// Serve JavaScript
app.get('/script.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'script.js'));
});

// Registration route
app.post(
  '/register',
  [
    check('email').isEmail(),
    check('username').isAlphanumeric().withMessage('Username must be alphanumeric'),
    check('email').custom(async (value) => {
      const user = await User.getUserByEmail(value);
      if (user) {
        throw new Error('Email already exists');
      }
    }),
    check('username').custom(async (value) => {
      const user = await User.getUserByUsername(value);
      if (user) {
        throw new Error('Username already exists');
      }
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const newUser = {
      email: req.body.email,
      username: req.body.username,
      password: hashedPassword,
      full_name: req.body.full_name,
    };

    User.createUser(newUser, (error, results, fields) => {
      if (error) {
        console.error('Error inserting user:', error.message);
        return res.status(500).json({ error: error.message });
      }
      console.log('Inserted a new user with ID:', results.insertId);
      res.status(201).json(newUser);
    });
  }
);

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      res.status(401).send('Invalid username or password');
    } else {
      const user = results[0];

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;

        if (isMatch) {
          req.session.user = user;
          res.send('Login successful');
        } else {
          res.status(401).send('Invalid username or password');
        }
      });
    }
  });
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.send('Logout successful');
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Dashboard data route
app.get('/dashboard-data', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }

  const userId = req.session.user.id;
  const userFullName = req.session.user.full_name;

  const sql = 'SELECT * FROM courses'; // Adjust the query as per your database schema
  connection.query(sql, [userId], (err, courses) => {
    if (err) {
      console.error('Error fetching courses:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ fullName: userFullName, courses });
  });
});

// Route to retrieve course content
app.get('/course/:id', (req, res) => {
  const courseId = req.params.id;
  const sql = 'SELECT * FROM courses WHERE id = ?';

  connection.query(sql, [courseId], (err, result) => {
    if (err) {
      throw err;
    }
    res.json(result);
  });
});

// Route to retrieve leaderboard data
app.get('/leaderboard', (req, res) => {
  const sql = 'SELECT name, score FROM leaderboard ORDER BY score DESC';

  connection.query(sql, (err, result) => {
    if (err) {
      throw err;
    }
    res.json(result);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
