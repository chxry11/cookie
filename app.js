const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

// Create MySQL connection
const connection = mysql.createConnection({
  //host: '',
  //user: 'root',
  //password: '',
  //port: 3307,
  //database: 'cookie'

  host: 'mysql-cheryl.alwaysdata.net',
  user: 'cheryl',
  password:'Ccly28022005',
  database: 'cheryl_cookie'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images'); 
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Set up view engine
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// Home route
app.get('/', (req, res) => {
  const sql = 'SELECT * FROM product';
  connection.query(sql, (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving products');
    }
    res.render('index', { product: results });
  });
});

// Add to cart route
app.get('/user/:userid/add-to-cart/:id', (req, res) => {
  const userId = req.params.userid;
  const productId = req.params.id;

  const sql = 'SELECT * FROM product WHERE productId = ?';
  connection.query(sql, [productId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving product');
    }
    if (results.length > 0) {
      res.render('add-to-cart', { product: results[0], userid: userId });
    } else {
      res.status(404).send('Product not found');
    }
  });
});

// Cart route (GET)
app.get('/user/:userid/cart', (req, res) => {
  const userId = req.params.userid;

  const sql = `
    SELECT c.cartId, c.msg, c.qty, p.productId, p.productName, p.price, p.image
    FROM cart c
    JOIN product p ON c.productId = p.productId
    WHERE c.userid = ?`;
  
  connection.query(sql, [userId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving cart items');
    }
    res.render('cart', { cartItems: results, userid: userId });
  });
});

// Handle adding item to cart (POST)
app.post('/user/:userid/cart', (req, res) => {
  const userId = req.params.userid;
  const { productId, quantity, message } = req.body;

  const sql = 'INSERT INTO cart (userid, productId, qty, msg) VALUES (?, ?, ?, ?)';
  connection.query(sql, [userId, productId, quantity, message], (error, results) => {
    if (error) {
      console.error('Database insert error:', error.message);
      return res.status(500).send('Error adding item to cart');
    }
    res.redirect(`/user/${userId}/cart`); // Redirect to cart page
  });
});

// Login route
app.get('/login', (req, res) => {
  res.render('login');
});

// Registration route
app.get('/register', (req, res) => {
  res.render('register');
});

// Handle login post
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM user WHERE username = ? AND password = ?';
  
  connection.query(sql, [username, password], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error logging in');
    }
    if (results.length > 0) {
      const userId = results[0].userid; // Assuming userid is in the user table
      res.redirect(`/user/${userId}`); // Redirect to user page
    } else {
      res.status(401).send('Invalid username or password');
    }
  });
});

// Handle registration post
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const sql = 'INSERT INTO user (username, password) VALUES (?, ?)';
  
  connection.query(sql, [username, password], (error, results) => {
    if (error) {
      console.error('Database insert error:', error.message);
      return res.status(500).send('Error registering user');
    }
    res.redirect('/login'); // Redirect to login page
  });
});

// User index route
app.get('/user/:userid', (req, res) => {
  const userId = req.params.userid;

  // Fetch the user's username based on the userId
  const userSql = 'SELECT username FROM user WHERE userid = ?';
  connection.query(userSql, [userId], (userError, userResults) => {
    if (userError) {
      console.error('Database query error:', userError.message);
      return res.status(500).send('Error retrieving user information');
    }

    if (userResults.length > 0) {
      const username = userResults[0].username; // Get the username

      // Fetch all products
      const productSql = 'SELECT * FROM product';
      connection.query(productSql, (productError, productResults) => {
        if (productError) {
          console.error('Database query error:', productError.message);
          return res.status(500).send('Error retrieving products');
        }
        res.render('loggedindex', { product: productResults, userid: userId, username: username });
      });
    } else {
      res.status(404).send('User not found');
    }
  });
});

// Get to home
app.get('/user/:userid/loggedindex', (req, res) => {
  const userId = req.params.userid;

  const userSql = 'SELECT username FROM user WHERE userid = ?';
  connection.query(userSql, [userId], (userError, userResults) => {
    if (userError) {
      console.error('Database query error:', userError.message);
      return res.status(500).send('Error retrieving user information');
    }

    if (userResults.length > 0) {
      const username = userResults[0].username; 

      const productSql = 'SELECT * FROM product';
      connection.query(productSql, (productError, productResults) => {
        if (productError) {
          console.error('Database query error:', productError.message);
          return res.status(500).send('Error retrieving products');
        }
        res.render('loggedindex', { product: productResults, userid: userId, username: username });
      });
    } else {
      res.status(404).send('User not found');
    }
  });
});


// Edit cart item route (GET)
app.get('/user/:userid/edit-cart/:cartId', (req, res) => {
  const userId = req.params.userid;
  const cartId = req.params.cartId;

  const sql = 'SELECT c.cartId, c.qty, c.msg, p.productName, p.price, p.image FROM cart c JOIN product p ON c.productId = p.productId WHERE c.cartId = ?';
  
  connection.query(sql, [cartId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving cart item');
    }
    if (results.length > 0) {
      res.render('edit-cart', { cartItem: results[0], userid: userId });
    } else {
      res.status(404).send('Cart item not found');
    }
  });
});

// Handle updating the cart item (POST)
app.post('/user/:userid/cart/:cartId', (req, res) => {
  const userId = req.params.userid;
  const cartId = req.params.cartId;
  const { quantity, message } = req.body;

  const sql = 'UPDATE cart SET qty = ?, msg = ? WHERE cartId = ? AND userid = ?';
  connection.query(sql, [quantity, message, cartId, userId], (error, results) => {
    if (error) {
      console.error('Database update error:', error.message);
      return res.status(500).send('Error updating cart item');
    }
    res.redirect(`/user/${userId}/cart`); // Redirect to cart page after update
  });
});



app.post('/user/:userid/delete-cart/:cartId', (req, res) => {
  const userId = req.params.userid;
  const cartId = req.params.cartId;

  const sql = 'DELETE FROM cart WHERE cartId = ? AND userid = ?';
  connection.query(sql, [cartId, userId], (error, results) => {
    if (error) {
      console.error('Database delete error:', error.message);
      return res.status(500).send('Error deleting cart item');
    }
    res.redirect(`/user/${userId}/cart`);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
