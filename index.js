const express = require('express')
const bodyParser = require('body-parser')
const connectDB = require('./config/db')
const cookieParser = require('cookie-parser')
require('dotenv').config()

const userRoutes = require('./routes/userRoutes')
const tweetRoutes = require('./routes/tweetRoutes')

const app = express()

app.use(express.json())
app.use(bodyParser.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))

const PORT = 3002

connectDB()

app.use('/api/user', userRoutes)
app.use('/api/tweet', tweetRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
