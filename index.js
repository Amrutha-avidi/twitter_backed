const express = require('express')
const bodyParser = require('body-parser')
const connectDB = require('./config/db')
// const cors = require('cors')
const cookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken")
const User = require('./models/user')
const Tweet = require('./models/tweet')

const { hashPassword, comparePassword,authenticate } = require("./helpers/auth")


const app = express()
app.use(express.json())
app.use(bodyParser.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))

const PORT = 3002

connectDB()
app.post('/register', async (req, res) => {
    try {
        const { userName, email, password } = req.body
        if (!userName) {
            return res.json({
                error: 'name is required'
            })
        }
        if (!password || password.length < 6) {
            return res.json({
                error: 'Password is required and should be atleast 6 characters long'
            })
        }
        const exist = await User.findOne({ email })
        if (exist) {
            return res.json({
                error: 'User with this email already exist'
            })
        }

        const hashedPassword = await hashPassword(password)
        const newUser = await User.create({
            userName,
            email,
            password: hashedPassword
        })
        newUser.save()
        return res.json(newUser)

    } catch (err) {
        console.log(err.message)
    }

})

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })
        if (!user) {
            return res.json({
                error: 'No user found'
            })
        }
        //chekc if passwords match
        const match = await comparePassword(password, user.password)
        if (match) {
            jwt.sign({ email: user.email, id: user._id, userName: user.userName }, process.env.JWT_SECRET, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token).json(user)
            })
        } if (!match) {
            res.json({
                error: 'Passwords do not match'
            })
        }
    } catch (error) {
        console.log(error)

    }
})

app.post('/createTweet', authenticate, async (req, res) => {
    try {
      const tweet = new Tweet({
        userId: req.userId,
        text: req.body.text,
        createdAt: new Date()
      });
  
      await tweet.save();
      res.status(201).json(tweet);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Update Tweet
app.put('/updateTweet/:tweetId', authenticate, async (req, res) => {
    try {
      const { tweetId } = req.params;
      const { text } = req.body;
  
      const tweet = await Tweet.findById(tweetId);
  
      if (!tweet) {
        return res.status(404).json({ error: 'Tweet not found' });
      }
  
      if (tweet.userId.toString() !== req.userId) {
        return res.status(403).json({ error: 'You can update only your own tweet' });
      }
  
      tweet.text = text || tweet.text;
      await tweet.save();
  
      res.status(200).json({ message: 'Tweet updated successfully', tweet });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  
  // Delete Tweet
  app.delete('/deleteTweet/:tweetId', authenticate, async (req, res) => {
    try {
      const { tweetId } = req.params;
  
      const tweet = await Tweet.findById(tweetId);
  
      if (!tweet) {
        return res.status(404).json({ error: 'Tweet not found' });
      }
  
      if (tweet.userId.toString() !== req.userId) {
        return res.status(403).json({ error: 'You can delete only your own tweet' });
      }
  
      await tweet.deleteOne();
  
      res.status(200).json({ message: 'Tweet deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

app.get('/:userId/timeline', async (req, res) => {
try {
    const userId = req.params.userId;
    const cursor = req.query.cursor;
    const limit = parseInt(req.query.limit) || 3;

    // Build the query to fetch tweets
    const query = { userId };
    if (cursor) {
      query._id = { $lt: cursor }; // Fetch tweets with IDs less than the cursor
    }
    const tweets = await Tweet
    .find(query)
    .sort({ createdAt: -1 }) // Sort tweets by newest first
    .limit(limit)

    const nextCursor = tweets.length > 0 ? tweets[tweets.length - 1]._id : null; //for the first request cursor params is optional but if we need the next set of records to be displayed, then the value of the nextCursor of the first set of records need to be given for the cursor key in the url

    res.json({tweets,nextCursor});
} catch (e) {
    res.status(500).json({ error: e.message });
}
});

app.post('/logout', (req, res) => {
    res.clearCookie('token'); // this will clear the token from cookies
    res.json({ message: 'Logout successful' });
  });
  
app.get('/', (req, res) => {
    res.json("twitter backend is working")
})


app.listen(PORT, () => {
    console.log(`server is running fine on  http://localhost:${PORT}`)
})