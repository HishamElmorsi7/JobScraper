const cheerio = require('cheerio')
const {gotScraping} = require('got-scraping')
const websiteUrl = 'https://www.linkedin.com'

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const urls = [
    {
        country: 'Egypt',
        url: 'https://www.linkedin.com/jobs/search?keywords=Back%20End%20Developer&location=Egypt&locationId=&geoId=106155005&f_TPR=r86400&position=1&pageNum=0'
    },
    {
        country: 'Egypt',
        url: 'https://www.linkedin.com/jobs/search?keywords=Software%20Developer&location=Egypt&locationId=&geoId=106155005&f_TPR=r86400&position=1&pageNum=0'
    },
    {
        country:'Saudi',
        url: 'https://www.linkedin.com/jobs/search?keywords=Back%20End%20Developer&location=Saudi%20Arabia&locationId=&geoId=100459316&f_TPR=r86400&position=1&pageNum=0'
    },


    {
        country:'emirates',
        url: 'https://www.linkedin.com/jobs/search?keywords=Back%20End%20Developer&location=United%20Arab%20Emirates&locationId=&geoId=104305776&f_TPR=r86400&position=1&pageNum=0' 
    }
]

const scrapeAllLinks = async ()=> {
    let jobs = []
    let notFoundjobs = []

    for (let countryUrl of urls) {
        const {scrapedJobs, notScrapedJobs} = await scrapeJobs(countryUrl)
        jobs.push(scrapedJobs)
        notFoundjobs.push(notScrapedJobs)
    }

    jobs = jobs.flat()
    notFoundjobs = notFoundjobs.flat()

    console.log('Found Jobs', jobs.length)
    console.log('\n\n\n\n\n\n\n\n\n\n')
    console.log('NotFound Jobs', notFoundjobs.length)

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
                const link = jobUrl


                if(level === 'مستوى المبتدئين'){
                    level = 'junior'
                } else if( level === 'مستوى متوسط الأقدمية'){
                    level = 'mid-level'
                }  else if(level === 'فترة تدريب'){
                    level = 'intern'
                } else if(level === 'مدير إداري'){
                    level = 'lead'
                } else if( level === 'غير مطبق'  || level === 'مساعد' || level === ''){
                    level = 'other'
                } 

                let job = {

                    title,
                    company,
                    country,
                    description,
                    level,
                    link

                }

                

                if (title == '' || company == '' || country == '' || description == '' || level == ''){
                    throw new Error('Some field lost')
                }
                else {
                    scrapedJobs.push(job)
                }

                await sleep(1000)
    
                // catching the error will help to continue running the code and only printing the error
            } catch(error){
                notScrapedJobs.push(jobUrl)

            }

    }


    return { scrapedJobs, notScrapedJobs }

}



scrapeAllLinks()
