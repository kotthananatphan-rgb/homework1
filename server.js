const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // ยอมให้หน้าเว็บ HTML เข้ามาดึงข้อมูลได้

// 🔌 1. สั่งเชื่อมต่อเข้ากับไฟล์ฐานข้อมูล SQLite ที่หนูทำไว้
const db = new sqlite3.Database('./music_database.db', (err) => {
    if (err) return console.error('เชื่อมต่อฐานข้อมูลล้มเหลว:', err.message);
    console.log('🎉 เชื่อมต่อฐานข้อมูล music_database.db สำเร็จแล้ว!');
});

// 📊 2. API สำหรับหน้า Dashboard: ดึงข้อมูลเพลงแบบ [SQL JOIN] 3 ตารางมารวมกัน
app.get('/api/dashboard', (req, joinRes) => {
    const sql = `
        SELECT songs.id, songs.title, songs.duration, songs.album_id,
               albums.title AS album_title, 
               artists.name AS artist_name
        FROM songs
        LEFT JOIN albums ON songs.album_id = albums.id
        LEFT JOIN artists ON albums.artist_id = artists.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return joinRes.status(500).json({ error: err.message });
        joinRes.json(rows); // ส่งข้อมูลที่ JOIN กันเสร็จแล้วไปให้หน้าเว็บโชว์
    });
});

// 📋 3. API สำหรับดึงข้อมูลตารางเพลงเฉด ๆ (ดึงข้อมูลธรรมดา)
app.get('/api/songs', (req, res) => {
    db.all('SELECT * FROM songs', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ➕ 4. API สำหรับเพิ่มเพลงใหม่ [Create] (ฟอร์มฝั่งซ้ายของหน้าเว็บ)
app.post('/api/songs', (req, res) => {
    const { title, duration, album_id } = req.body;
    const sql = `INSERT INTO songs (title, duration, album_id) VALUES (?, ?, ?)`;
    
    db.run(sql, [title, duration, album_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'เพิ่มเพลงสำเร็จ', id: this.lastID });
    });
});

// 🗑️ 5. API สำหรับลบเพลงตามไอดี [Delete] (ปุ่มถังขยะบนหน้าเว็บ)
app.delete('/api/songs/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM songs WHERE id = ?', id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'ลบเพลงสำเร็จ', rowsAffected: this.changes });
    });
});

// สั่งให้เซิร์ฟเวอร์เปิดทำงานที่พอร์ต 5000
app.listen(5000, () => {
    console.log('🚀 Server กำลังรันอยู่ที่ http://localhost:5000');
});