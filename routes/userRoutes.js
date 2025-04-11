const express = require('express')
const User = require('../models/user')
const { hashPassword, comparePassword } = require('../helpers/auth')
const jwt = require('jsonwebtoken')

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
    try {
        const { userName, email, password } = req.body
        if (!userName) return res.json({ error: 'Name is required' })
        if (!password || password.length < 6) return res.json({ error: 'Password should be atleast 6 characters' })

        const exist = await User.findOne({ email })
        if (exist) return res.json({ error: 'User already exists' })

        const hashedPassword = await hashPassword(password)

        const newUser = await User.create({ userName, email, password: hashedPassword })
        res.status(201).json(newUser)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email })
        if (!user) return res.json({ error: 'No user found' })

        const match = await comparePassword(password, user.password)
        if (!match) return res.json({ error: 'Invalid credentials' })

        jwt.sign({ id: user._id, email: user.email, userName: user.userName }, process.env.JWT_SECRET, {}, (err, token) => {
            if (err) throw err
            res.cookie('token', token).json(user)
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router
