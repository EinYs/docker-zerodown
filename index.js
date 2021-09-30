const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const redis = require('redis')
let redisStore = require('connect-redis')(session)

const app = express()
app.use(express.json())

const { MONGO_USER, MONGO_PASSWORD, MONGO_IP, MONGO_PORT, REDIS_URL, REDIS_PORT, SESSION_SECRET} = require("./config")
const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`
const mongoconnect = () => { return mongoose.connect(mongoURL, { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(()=>{
    console.log("Mongodb connected")
}) }

retryUntilSuccess( mongoconnect )

/**
 * Retries the given function until it succeeds given a number of retries and an interval between them. They are set
 * by default to retry 5 times with 1sec in between. There's also a flag to make the cooldown time exponential
 * @author Daniel Iñigo <danielinigobanos@gmail.com> https://gitlab.com/snippets/1775781
 * @param {Function} fn - Returns a promise
 * @param {Number} retriesLeft - Number of retries. If -1 will keep retrying
 * @param {Number} interval - Millis between retries. If exponential set to true will be doubled each retry
 * @param {Boolean} exponential - Flag for exponential back-off mode
 * @return {Promise<*>}
 */
 async function retryUntilSuccess(fn, retriesLeft = -1, interval = 1000, exponential = false) {
    try {
        const val = await fn();
        return val;
    } catch (error) {
        console.log(error);
        if (retriesLeft) {
            await new Promise(r => setTimeout(r, interval));
            console.log(`retrying in ${interval}...`)
            return retryUntilSuccess(fn, retriesLeft - 1, exponential ? interval * 2 : interval, exponential);
        } else return Promise.reject(new Error(error.message + ' (Max retries reached) error at this function : ' + fn.toString()));
    }
}

// redis
let redisClient = redis.createClient({
    host: REDIS_URL,
    port: REDIS_PORT
})
app.enable('trust proxy')
app.use(session({
    store: new redisStore({client: redisClient}),
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 360000,
        httpOnly: true
    }
}))

app.get("/", (req, res) => {
    res.send("<h2> Hi There ^.^ </h2>")
    console.log("I'm here")
})

const postRouter = require('./router')
app.use("/api/v1", postRouter)

app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500).send({status: false, error:{ name: err.name, message: err.message }});
})

const port = process.env.PORT || 3000
app.listen(port, ()=> console.log(`listening on port ${port}`))

process.on('SIGINT', (event)=>{
    process.exit(0)
})
