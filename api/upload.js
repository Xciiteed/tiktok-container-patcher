const multer = require('multer');

// Menggunakan memory storage agar ramah lingkungan serverless (tanpa local disk)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // Batas aman maksimal file 100MB
}).single('video');

// Fungsi pembantu parsing form data multi-part di serverless environment
const runMiddleware = (req, res, fn) => {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });
};

// MENGGUNAKAN STANDAR EKSPOR COMMONJS AGAR TIDAK CRASH DI VERCEL
module.exports = async (req, res) => {
    // Pengaman agar serverless endpoint hanya merespons metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await runMiddleware(req, res, upload);

        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded.' });
        }

        const videoBuffer = req.file.buffer;

        // METODE BYPASS INSTAN METADATA MOOV ATOM
        // Menyisipkan identitas biner buatan ke baris paling depan kontainer file
        const secretPadding = Buffer.from([0x00, 0x00, 0x00, 0x02, 0x6d, 0x6f, 0x6f, 0x76]);
        const patchedBuffer = Buffer.concat([secretPadding, videoBuffer]);

        // Mengirimkan kembali file sebagai data stream unduhan langsung ke browser
        res.setHeader('Content-Type', req.file.mimetype || 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="patched_60fps_${Date.now()}.mp4"`);
        return res.send(patchedBuffer);

    } catch (error) {
        console.error('Patcher Engine Error:', error);
        return res.status(500).json({ error: 'Internal structural patch deployment error.' });
    }
};
