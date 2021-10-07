const express = require('express')

const app = express()
app.use(express.json())

app.get("/", (req, res) => {
    setTimeout(() => {
        res.send("<h2> Hi There ~>.<~ </h2>")

    }, 2000)
    console.log("I'm here")
})


app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500).send({status: false, error:{ name: err.name, message: err.message }});
})

const port = process.env.PORT || 3000
app.listen(port, ()=> console.log(`listening on port ${port}`))

process.on('SIGINT', (event)=>{
    process.exit(0)
})
