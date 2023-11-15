const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const crawl = require('./crawler.js')
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json())

app.get('/jobs', async (req, res) => {
    try {
        const jobsData = await crawl()
        res.status(200).json({
            status: 'success',
            data: {
                jobsData
            }
        })

    } catch(error) {
        console.log('Error during web Scraping', error)
        res.status(500).json({
            status: 'fail',
            message: 'Internal server error',
        })
    }

})

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`)
})