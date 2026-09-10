const express = require('express');
const multer = require('multer');
const controller = require('./importExport.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = express.Router();

router.get('/export/csv', controller.exportCsv);
router.get('/export/json', controller.exportJson);
router.post('/import/csv', upload.single('file'), controller.importCsv);

module.exports = router;
