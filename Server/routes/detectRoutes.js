const express = require('express')
const router = express.Router()
const multer = require('multer')
const { detectText, detectImage, detectImageUrl, detectVideo, detectFakeNews, getHistory, detectUrl } = require('../controllers/detectController')
const authMiddleware = require('../middleware/auth')
const { detectLimiter, videoLimiter } = require('../middleware/rateLimit')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
})

// Text, image, news - standard rate limit (20/hour free)
router.post('/text', authMiddleware, detectLimiter, detectText)
router.post('/image', authMiddleware, detectLimiter, upload.single('image'), detectImage)
router.post('/image-url', authMiddleware, detectLimiter, detectImageUrl)
router.post('/fakenews', authMiddleware, detectLimiter, detectFakeNews)
router.post('/url', authMiddleware, detectLimiter, detectUrl)

// Video - stricter limit (5/hour free) - expensive to process
router.post('/video', authMiddleware, videoLimiter, upload.single('video'), detectVideo)

// History - no rate limit needed (just reading)
router.get('/history', authMiddleware, getHistory)

module.exports = router