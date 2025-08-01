import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'backend/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let subfolder = '';
        // Determine subfolder based on field name
        if (file.fieldname === 'files') {
            subfolder = 'project';
        } else if (file.fieldname === 'image') {
            subfolder = 'post';
        } else if (file.fieldname === 'profilePicture' || file.fieldname === 'bannerImg') {
            subfolder = 'profile';
        } else {
            subfolder = 'other';
        }
        const dest = path.join(uploadsDir, subfolder);
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter function - accepting all file types as requested
const fileFilter = (req, file, cb) => {
    // Accept all file types
    return cb(null, true);
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // Increased to 50MB file size limit
});

export default upload;