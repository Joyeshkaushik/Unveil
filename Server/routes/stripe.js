const express = require('express')
const router = express.Router()
const { createCheckout, createPortal, getSubscription, handleWebhook } = require('../controllers/stripeController')
const authMiddleware = require('../middleware/auth')

// Webhook needs raw body (before JSON parsing)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook)

// Protected routes
router.post('/checkout', authMiddleware, createCheckout)
router.post('/portal', authMiddleware, createPortal)
router.get('/subscription', authMiddleware, getSubscription)

module.exports = router
