// Handle global variables because they keep their value
const cheerio = require('cheerio')
const {gotScraping} = require('got-scraping')
const websiteUrl = 'https://www.linkedin.com'
const fs = require('fs')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const urls = [
    {
        country: 'Egypt',
        url: 'https://www.linkedin.com/jobs/search?keywords=Back%20End%20Developer&location=Egypt&locationId=&geoId=106155005&f_TPR=r86400&position=1&pageNum=0'
    }
    // ,
    // {
    //     country: 'Egypt',
    //     url: 'https://www.linkedin.com/jobs/search?keywords=Software%20Developer&location=Egypt&locationId=&geoId=106155005&f_TPR=r86400&position=1&pageNum=0'
    // }
    // ,
    // {
    //     country:'Saudi Arabia',
    //     url: 'https://www.linkedin.com/jobs/search?keywords=Back%20End%20Developer&location=Saudi%20Arabia&locationId=&geoId=100459316&f_TPR=r86400&position=1&pageNum=0'
    // },


    // {
    //     country:'emirates',
    //     url: 'https://www.linkedin.com/jobs/search?keywords=Back%20End%20Developer&location=United%20Arab%20Emirates&locationId=&geoId=104305776&f_TPR=r86400&position=1&pageNum=0' 
    // }
]

let urlsCount = 0
let linksRepititions = 0
let scrapedUrls = []
// All scrapedJobs from the file in addition to the scraped from this iteration
let scrapedJobx = []
// new foundJobs
let notBackendJobs = []


const isUrlScraped = (url)=> {
    return scrapedUrls.includes(url)
}

const saveScrapedUrl = (url) => {
    scrapedUrls.push(url);
    fs.writeFileSync('scraped_url.json', JSON.stringify(scrapedUrls, null, 2), 'utf8')
}

const saveScrapedJobs = (job) => {
    scrapedJobx.push(job);
    fs.writeFileSync('scraped_jobs.json', JSON.stringify(scrapedJobx, null, 2), 'utf8')
}

const scrapeAllLinks = async ()=> {
    console.log('OOOOOOOOOOOOOOOO')
    let notFoundjobs = []
    let newJobs = []

    for (let countryUrl of urls) {
        const {scrapedJobs, notScrapedJobs} = await scrapeJobs(countryUrl)
        newJobs.push(scrapedJobs)
        notFoundjobs.push(notScrapedJobs)
    }

    newJobs = newJobs.flat()
    notFoundjobs = notFoundjobs.flat()


    console.log(`Final Scraped Jobs = ${urlsCount}(Total Urls Count) - [ ${notFoundjobs.length}(Couldn't Scrap) + ${linksRepititions}(jobsRepititions) - ${notBackendJobs.length}(notBackendJobs) ]`)
    // Scraped this time
    console.log('Found Jobs', newJobs.length)
    // jobx for total
    console.log('Jobx', scrapedJobx.length)
    return newJobs

}
   
const scrapeJobs = async(countryUrl)=>{

    const country = countryUrl.country
    const url = countryUrl.url


    const jobsPageResponse = await gotScraping(url)
    const jobsPageHtml = jobsPageResponse.body    
    const $ = cheerio.load(jobsPageHtml)

    const links = $("a[class^='base-card']")
    const jobsUrls = []

    links.each((index, link) => {
        // using $ here turns the link into a selection object to be able to use cheerio methods on
        const url = $(link).attr('href')
        // absoluteUrl is to make sure that all the links become absolute 
        const absoluteUrl = new URL(url, websiteUrl).href
        jobsUrls.push(absoluteUrl)
    })

    urlsCount = urlsCount + jobsUrls.length
    
    console.log(`No.urls in ${country}= ${jobsUrls.length}`)
    let {scrapedJobs, notScrapedJobs} = await scrapeFromUrls(jobsUrls, country)
    let i = 0

    while(i < 3 ) {

        result = await scrapeFromUrls(notScrapedJobs, country)

        scrapedJobs = [...scrapedJobs, ...result.scrapedJobs ]
        notScrapedJobs = result.notScrapedJobs

        i++;
        
    }

    return {scrapedJobs, notScrapedJobs}

}

const scrapeFromUrls= async (jobsUrls, country) => {


    const notScrapedJobs = []
    const scrapedJobs = []
    for(const jobUrl of jobsUrls){
        
        if(isUrlScraped(jobUrl.split('?')[0])) {
            // console.log(`Skipping already scraped URL: ${jobUrl}, ${xxx}`);
            linksRepititions += 1
            continue;
        }

            const productResponse = await gotScraping(jobUrl);
            const jobHtml = productResponse.body;
            const $jobPage = cheerio.load(jobHtml);

            try {

                
                const title = $jobPage('h1').text().trim();
                // targets a elements with this class name . .....
                const company = $jobPage('a.topcard__org-name-link').text().trim();
                // .html returns null when non existing but text returns ''
                const description = $jobPage('.description__text .show-more-less-html__markup').html().trim().split('\n').join('')
                let level = $jobPage('ul.description__job-criteria-list').contents().eq(1).contents().eq(3).text().trim()
                const link = jobUrl.split('?')[0]


                if(level === 'مستوى المبتدئين'){
                    level = 'junior'
                } else if( level === 'مستوى متوسط الأقدمية'){
                    level = 'mid-level'
                }  else if(level === 'فترة تدريب'){
                    level = 'intern'
                } else if( level === 'غير مطبق'  || level === 'مساعد' || level === '' || level === 'مدير إداري'){
                    level = 'other'
                } 

                let job = {

                    title,
                    company,
                    location: country,
                    description,
                    level,
                    application: link,
                    email: 'x@gmail.com',
                    website: '',
                    workplace_type: 'other',
                    tech: 'other'
                    

                }
                

                if (title == '' || company == '' || country == '' || description == '' || level == ''){
                    throw new Error('Some field lost')
                }
                else if(title.toLowerCase().includes('front') || title.toLowerCase().includes('full') || title.toLowerCase().includes('scien')) {
                    notBackendJobs.push(job)
                }
                else {

                    scrapedJobs.push(job)

                    saveScrapedJobs(job)
                    saveScrapedUrl(link)
                }

                await sleep(1000)
    
                // catching the error will help to continue running the code and only printing the error
            } catch(error){
                notScrapedJobs.push(jobUrl)

            }

    }


    return { scrapedJobs, notScrapedJobs }

}


const crawl = async ()=> {
    try {

        if(fs.existsSync('scraped_url.json')) {
            console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
            let data = fs.readFileSync('scraped_url.json', 'utf8')
            scrapedUrls = JSON.parse(data)
    
            data = fs.readFileSync('scraped_jobs.json', 'utf8')
            scrapedJobx = JSON.parse(data)
            
    
            console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
        }
    
        const newJobs = await scrapeAllLinks()
        return newJobs
    
    } catch(err) {
        // console.log(err)
        console.log('Something went wrong when reading scraped_url.json file')
    }
    

}

module.exports = crawl