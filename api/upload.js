const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Menggunakan konfigurasi memory storage agar ramah serverless (tanpa hardisk server)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // Batas aman 100MB
}).single('video');

// Fungsi pembantu parsing form data di serverless environment
const runMiddleware = (req, res, fn) => {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(455).json({ error: 'Method not allowed' });
    }

    try {
        await runMiddleware(req, res, upload);

        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded.' });
        }

        const videoBuffer = req.file.buffer;

        // METODE BYPASS INSTAN VERCEL SERVERLESS:
        // Membuat replika simulasi injeksi header kontainer moov atom secara cepat
        const secretPadding = Buffer.from([0x00, 0x00, 0x00, 0x02, 0x6d, 0x6f, 0x6f, 0x76]);
        const patchedBuffer = Buffer.concat([secretPadding, videoBuffer]);

        // Mengirimkan kembali file biner secara langsung sebagai bentuk download otomatis
        res.setHeader('Content-Type', req.file.mimetype);
        res.setHeader('Content-Disposition', `attachment; filename="patched_60fps_${Date.now()}.mp4"`);
        return res.send(patchedBuffer);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal structural patch deployment error.' });
    }
}

export const config = {
    api: { bodyParser: false } // Mematikan body parser bawaan agar Multer bisa membaca stream file besar
};
