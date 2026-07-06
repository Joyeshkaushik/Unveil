const express = require('express')
const router = express.Router()
const {
  createCheckout,
  verifyPayment,
  cancelSubscription,
  getSubscription
} = require('../controllers/paymentsController')
const authMiddleware = require('../middleware/auth')

// All payments routes are authenticated
router.post('/checkout', authMiddleware, createCheckout)
router.post('/verify', authMiddleware, verifyPayment)
router.post('/cancel', authMiddleware, cancelSubscription)
router.get('/subscription', authMiddleware, getSubscription)

module.exports = router
