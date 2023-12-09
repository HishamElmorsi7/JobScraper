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
        country: '🇪🇬 Egypt',
        url: 'https://www.linkedin.com/jobs/search?keywords=Back%20End%20Developer&location=Egypt&locationId=&geoId=106155005&f_TPR=r86400&position=1&pageNum=0'
    }
    ,
    {
        country: '🇪🇬 Egypt',
        url: 'https://www.linkedin.com/jobs/search?keywords=Software%20Developer&location=Egypt&locationId=&geoId=106155005&f_TPR=r86400&position=1&pageNum=0'
    }
    ,
    {
        country:'🇸🇦 Saudi Arabia',
        url: 'https://www.linkedin.com/jobs/search?keywords=Back%20End%20Developer&location=Saudi%20Arabia&locationId=&geoId=100459316&f_TPR=r86400&position=1&pageNum=0'
    },
    {
        country:'🇦🇪 Emirates',
        url: 'https://www.linkedin.com/jobs/search?keywords=Back%20End%20Developer&location=United%20Arab%20Emirates&locationId=&geoId=104305776&f_TPR=r86400&position=1&pageNum=0' 
    },
    {
        country:'🇰🇼 Kuwait',
        url: 'https://www.linkedin.com/jobs/search?keywords=Software%20Developer&location=Kuwait&locationId=&geoId=103239229&f_TPR=r86400&position=1&pageNum=0' 
    },
    {
        country:'🇶🇦 Qatar',
        url: 'https://www.linkedin.com/jobs/search?keywords=Software%20Developer&location=Qatar&locationId=&geoId=104170880&f_TPR=r86400&original_referer=https%3A%2F%2Fwww.linkedin.com%2Fjobs%2Fsearch%3Fkeywords%3DSoftware%2520Developer%26location%3DQatar%26geoId%3D104170880%26trk%3Dpublic_jobs_jobs-search-bar_search-submit%26position%3D1%26pageNum%3D0&position=1&pageNum=0' 
    }

    
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
    console.log('OOO')
    let notFoundjobs = []
    let newJobs = []

    for (let countryUrl of urls) {
        const {scrapedJobs, notScrapedJobs} = await scrapeJobs(countryUrl)
        newJobs.push(scrapedJobs)
        notFoundjobs.push(notScrapedJobs)
    }

    newJobs = newJobs.flat()
    notFoundjobs = notFoundjobs.flat()


    console.log(`Final Scraped Jobs = ${urlsCount}(Total Urls Count) - [ ${notFoundjobs.length}(Couldn't Scrap) + ${linksRepititions}(jobsRepititions) + ${notBackendJobs.length}(notBackendJobs) ]`)
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

const isBackendJob = (title) => {

    const notBackKeywords =
    [
    'system', 'automation', 'process', 'statistic',
    'autosar', 'flutter', 'cloud', 'utility', 'epc',
    'firmware', 'quality', 'business', 'security',
    'mobile', 'application', 'front', 'full', 'scien', 'vision',
    'machine', 'embedded', 'android', 'ios',
    'react', 'product', 'devops', 'artificial', 'mobile',
    'angular', 'qc', 'design', 'recipe', 'environment', ' it ', 'analytic', 'method', 'simulation',
    'argumented', 'service', 'unity', 'game','ui', 'project', 'testing',
     ' qa ', 'presales', ' sales ', 'vue', 'plc', ' wan ', 'microsoft', ' ai ', 'ml', 'sharepoint'
    ]

    const lowercaseTitle = title.toLowerCase()

    const hasNotBackendKeyword = notBackKeywords.some( keyword => lowercaseTitle.includes(keyword))

    return !hasNotBackendKeyword

}

const isDesiredCompany = (company) => {
    const notDesiredKeywords = ['crossover', 'talent pal', 'canonical'];

    const lowercaseCompany = company.toLowerCase()

    const hasNotDesiredKeyword = notDesiredKeywords.some( keyword => lowercaseCompany.includes(keyword))

    return !hasNotDesiredKeyword

}

const checkTechKeyword = (field) => {

    const javascriptKeywords = ['javascript', 'js', 'node'];
    const pythonKeywords = ['python', 'django'];
    const rubyKeywords = ['ruby', 'rails'];
    const cSharpKeywords = ['c#', 'dotnet', '.net'];
    const javaKeywords = ['java', 'spring'];
    const goKeywords = ['go', 'golang', 'go lang'];
    const phpKeywords = ['php', 'laravel'];

    const keywordCheck = keyword => {
        const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
        return pattern.test(field);
    };

    if (pythonKeywords.some( keywordCheck )) {
        return 'python';
    } else if (rubyKeywords.some( keywordCheck )) {
        return 'ruby';
    } else if (cSharpKeywords.some( keywordCheck )) {
        return 'c#';
    } else if (javaKeywords.some( keywordCheck )) {
        return 'java';
    } else if (goKeywords.some( keywordCheck )) {
        return 'go';
    } else if (phpKeywords.some( keywordCheck )) {
        return 'php';
    }else if  (javascriptKeywords.some( keywordCheck )) {
        return 'javascript';
    }
}


const categorizeJobTech = (title, description) => {

    const titleLower = title.toLowerCase()
    const descriptionLower = description.toLowerCase()

    const titleCategory = checkTechKeyword(titleLower)
    const descriptionCategory = checkTechKeyword(descriptionLower)

    return titleCategory || descriptionCategory || '-'

}

const checkLevelKeyword = (field) => {
    const internKeywords = ['intern', 'internship']
    const juniorKeywords = ['junior', 'entry-level', 'entry level', 'trainee', 'jr.', 'jr']
    const midSeniorKeywords = ['mid-level', 'mid level', 'mid senior', 'mid-senior', 'intermediate']
    const seniorKeywords = ['senior', 'senior-level', 'sr', 'sr.']
    const architectKeywords = ['architect', 'architect-level']
    const leadKeywords = ['lead', 'team-lead', 'lead-level']

    const keywordCheck = keyword => {
        const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
        return pattern.test(field);
    };

    if (internKeywords.some( keywordCheck )) {
        return 'intern';
    } else if (juniorKeywords.some( keywordCheck )) {
        return 'junior';
    } else if (midSeniorKeywords.some( keywordCheck )) {
        return 'mid-senior';
    } else if (seniorKeywords.some( keywordCheck )) {
        return 'senior';
    } else if (architectKeywords.some( keywordCheck )) {
        return 'architect';
    } else if (leadKeywords.some( keywordCheck )) {
        return 'lead';
    }
}

const categorizeJobLevel = (title, description) => {
    const titleLower = title.toLowerCase()
    const descriptionLower = description.toLowerCase()

    const titleCategory = checkLevelKeyword(titleLower)
    const descriptionCategory = checkLevelKeyword(descriptionLower)

    return titleCategory || descriptionCategory || '-'

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
                const link = jobUrl.split('?')[0]
                const tech = categorizeJobTech(title, description)
                let level = categorizeJobLevel(title, description)

                // if(!level) {

                //     level = $jobPage('ul.description__job-criteria-list').contents().eq(1).contents().eq(3).text().trim()

                //     if(level === 'مستوى المبتدئين'){
                        
                //         level = 'junior'

                //     } else if( level === 'مستوى متوسط الأقدمية'){

                //         level = 'mid-senior'

                //     }  else if(level === 'فترة تدريب'){

                //         level = 'intern'

                //     } else {

                //         level = '-'

                //     }
                // }
                // else if( level === 'غير مطبق'  || level === 'مساعد' || level === '' || level === 'مدير إداري'){
                //     level = '-'
                // } 

                let job = {

                    title,
                    company,
                    location: country,
                    description,
                    level,
                    application: link,
                    email: 'x@gmail.com',
                    website: '',
                    workplace_type: '-',
                    tech,
                    revised: true
                    

                }

                if (title == '' || company == '' || country == '' || description == '' || level == ''){
                    throw new Error('Some field lost')
                }
                else if(!isBackendJob(title) || !isDesiredCompany(company) ) {
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
        initialize()

        if(fs.existsSync('scraped_url.json')) {
            console.log('xxx')
            let data = fs.readFileSync('scraped_url.json', 'utf8')
            scrapedUrls = JSON.parse(data)
    
            data = fs.readFileSync('scraped_jobs.json', 'utf8')
            scrapedJobx = JSON.parse(data)
            
    
            console.log('xxx')
        }
    
        const newJobs = await scrapeAllLinks()
        return newJobs
    
    } catch(err) {
        // console.log(err)
        console.log('Something went wrong when reading scraped_url.json file')
    }
    

}

const initialize = () => {
    linksRepititions = 0
    urlsCount = 0
    notBackendJobs = []


}

module.exports = crawl