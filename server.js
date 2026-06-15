const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi penyimpanan video sementara
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Pastikan direktori operasional tersedia
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

// Menyajikan file statis untuk frontend
app.use(express.static('public'));
app.use('/download', express.static('outputs'));

// API Endpoint untuk Pemrosesan Video
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Tidak ada file video yang diunggah.' });
    }

    const inputPath = req.file.path;
    const outputFilename = 'patched_' + req.file.filename;
    const outputPath = path.join('outputs', outputFilename);

    // PARAMETER BYPASS ALGORITMA COMPRESSION TIKTOK
    const ffmpegCommand = `ffmpeg -i ${inputPath} -vcodec libx264 -profile:v high -level:v 4.2 -pix_fmt yuv420p -b:v 15M -maxrate:v 20M -bufsize:v 30M -movflags +faststart ${outputPath}`;

    console.log('Menjalankan kompilasi FFmpeg bypass...');

    exec(ffmpegCommand, (error, stdout, stderr) => {
        // Hapus file mentah untuk mengosongkan storage server
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

        if (error) {
            console.error(`Eror FFmpeg: ${error.message}`);
            return res.status(500).json({ error: 'Gagal memproses video.' });
        }

        // Mengirimkan endpoint url unduhan ke browser pengguna
        res.json({ downloadUrl: `/download/${outputFilename}` });
    });
});

app.listen(PORT, () => {
    console.log(`Server aktif dan aman di http://localhost:${PORT}`);
});
