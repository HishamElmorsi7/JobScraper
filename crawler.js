const cheerio = require('cheerio')
const {gotScraping} = require('got-scraping')


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


const country = 'Egypt'
const websiteUrl = 'https://www.linkedin.com'
const jobSearchUrl = `${websiteUrl}/jobs/search`
const filterJobsUrl = `${jobSearchUrl}?location=Egypt&geoId=106155005&locationId=&keywords=Back%20End%20Developer&f_TPR=r86400&countryRedirected=1&position=1&pageNum=0`


const scrapeJobs = async()=>{

    const jobsPageResponse = await gotScraping(filterJobsUrl)
    const jobsPageHtml = jobsPageResponse.body    
    const $ = cheerio.load(jobsPageHtml)

    // To get only a tags that has href attribut
    const links = $("a[class^='base-card']")

    const jobsUrls = []
    links.each((index, link) => {
        // using $ here turns the link into a selection object to be able to use cheerio methods on
        const url = $(link).attr('href')
        // absoluteUrl is to make sure that all the links become absolute 
        const absoluteUrl = new URL(url, websiteUrl).href
        jobsUrls.push(absoluteUrl)
    })

    let {scrapedJobs, notScrapedJobs} = await scrapeFromUrls(jobsUrls)
    let i = 0

    while(i < 3 ) {

        result = await scrapeFromUrls(notScrapedJobs)

        scrapedJobs = [...scrapedJobs, ...result.scrapedJobs ]
        notScrapedJobs = result.notScrapedJobs

        i++;
        
    }

    console.log('Starting point URL for other urls', filterJobsUrl)
    console.log('\n')
    console.log('No.originalUrls', jobsUrls.length)
    console.log('\n')
    console.log(`No.notScraped = ${scrapedJobs.length}, No.Scraped = ${notScrapedJobs.length}`)
    console.log('\n')
    console.log(scrapedJobs)

}


const scrapeFromUrls= async (jobsUrls) => {

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
                    level

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



scrapeJobs()
