const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // ফাইল সিস্টেম ব্যবহার করার জন্য

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

app.get('/', (req, res) => {
    try {
        res.send('nice code');
    } catch (error) {
        res.send('error');
    }
});

app.delete('/images/:id', (req, res) => {
    const { id } = req.params;

    // প্রথমে ডাটাবেজ থেকে ইমেজের নাম নিয়ে আসুন
    db.query('SELECT image FROM images WHERE id = ?', [id], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const image = results[0].image;
            const imagePath = path.join(__dirname, 'uploads', image);

            // ফাইল সিস্টেম থেকে ফাইল মুছুন
            fs.unlink(imagePath, (err) => {
                if (err) {
                    return res.status(500).send('Error deleting the file.');
                }

                // এরপর ডাটাবেজ থেকে ইমেজ রেকর্ড মুছুন
                const sql = 'DELETE FROM images WHERE id = ?';
                db.query(sql, [id], (err, result) => {
                    if (err) throw err;
                    res.send('Image deleted!');
                });
            });
        } else {
            res.status(404).send('Image not found.');
        }
    });
});

app.put('/images/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const image = req.file ? req.file.filename : null; // নতুন ইমেজ যদি আপলোড হয়

    if (image) {
        // প্রথমে ডাটাবেজ থেকে পুরনো ইমেজের নাম নিয়ে আসুন
        db.query('SELECT image FROM images WHERE id = ?', [id], (err, results) => {
            if (err) throw err;

            if (results.length > 0) {
                const oldImage = results[0].image;
                const oldImagePath = path.join(__dirname, 'uploads', oldImage);

                // পুরনো ফাইলটি মুছুন
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        return res.status(500).send('Error deleting the old file.');
                    }

                    // এরপর নতুন ইমেজ ডাটাবেজে আপডেট করুন
                    const sql = 'UPDATE images SET image = ? WHERE id = ?';
                    db.query(sql, [image, id], (err, result) => {
                        if (err) throw err;
                        res.send('Image updated!');
                    });
                });
            } else {
                res.status(404).send('Image not found.');
            }
        });
    } else {
        res.status(400).send('No new image uploaded.');
    }
});

app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});
