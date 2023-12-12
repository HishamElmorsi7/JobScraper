const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const crawl = require('./crawler.js')
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send('Welcome to Job Scraperx')
})
app.get('/jobs', async (req, res) => {
    try {
        const jobsData = await crawl()
        console.log('\n\n\n\n\n\n')
        console.log(jobsData)
        console.log('\n\n\n\n\n\n')

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