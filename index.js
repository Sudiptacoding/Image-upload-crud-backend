const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'collage'
});

db.connect(err => {
    if (err) throw err;
    console.log('Database connected!');
});

app.post('/upload', upload.single('image'), (req, res) => {
    const image = req.file.filename;
    const sql = 'INSERT INTO images (image) VALUES (?)';
    db.query(sql, [image], (err, result) => {
        if (err) throw err;
        res.send('Image uploaded!');
    });
});

app.get('/images', (req, res) => {
    db.query('SELECT * FROM images', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.delete('/images/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM images WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) throw err;
        res.send('Image deleted!');
    });
});


app.put('/images/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const image = req.file ? req.file.filename : null; // নতুন ইমেজ যদি আপলোড হয়
    const sql = 'UPDATE images SET image = ? WHERE id = ?';

    db.query(sql, [image, id], (err, result) => {
        if (err) throw err;
        res.send('Image updated!');
    });
});





app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});
