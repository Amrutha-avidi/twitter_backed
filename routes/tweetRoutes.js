const express = require('express')
const Tweet = require('../models/tweet')
const { authenticate } = require('../helpers/auth')

const router = express.Router()

// Create Tweet
router.post('/create', authenticate, async (req, res) => {
    try {
        const tweet = new Tweet({
            userId: req.userId,
            text: req.body.text,
            createdAt: new Date()
        })

        await tweet.save()
        res.status(201).json(tweet)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// Update Tweet
router.put('/update/:tweetId', authenticate, async (req, res) => {
    try {
        const { tweetId } = req.params
        const { text } = req.body

        const tweet = await Tweet.findById(tweetId)
        if (!tweet) return res.status(404).json({ error: 'Tweet not found' })

        if (tweet.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized' })
        }

        tweet.text = text || tweet.text
        await tweet.save()

        res.status(200).json({ message: 'Tweet updated successfully', tweet })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router
