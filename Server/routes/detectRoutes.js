const express=require('express');
const router=express.Router();
const multer=require('multer')
const authMiddleware=require('../middleware/auth');
const {  detectText, detectImage, detectImageUrl, detectVideo, detectFakeNews, getHistory } = require('../controllers/detectController');
const upload=multer({
    storage:multer.memoryStorage(),
    limits:{fileSize:100*1024*1024}
})
router.post('/text',authMiddleware,detectText)
router.post('/image', authMiddleware, upload.single('image'), detectImage)
router.post('/image-url', authMiddleware, detectImageUrl)
router.post('/video', authMiddleware, upload.single('video'), detectVideo)
router.post('/fakenews', authMiddleware, detectFakeNews)
router.get('/history', authMiddleware, getHistory)
module.exports=router;