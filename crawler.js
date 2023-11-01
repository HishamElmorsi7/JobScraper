const cheerio = require('cheerio')
const {gotScraping} = require('got-scraping')

const crawl = async()=>{

    const websiteUrl = 'https://www.linkedin.com'
    const jobSearchUrl = `${websiteUrl}/jobs/search`
    const filterUrl = `${jobSearchUrl}?keywords=Back%20End%20Developer&location=Egypt&locationId=&geoId=106155005&f_TPR=r86400&position=1&pageNum=0`

    const response = await gotScraping(filterUrl)
    const html = response.body

    const $ = cheerio.load(html)
    // To get only a tags that has href attribut
    const links = $("a[class^='base-card']")

    const jobUrls = []

    links.each((index, link) => {
        // using $ here turns the link into a selection object to be able to use cheerio methods on
        const url = $(link).attr('href')
        // resolvedUrl is to make sure that all the links become absolute 
        const resolvedUrl = new URL(url, websiteUrl).href
        jobUrls.push(resolvedUrl)
    })

    for(const jobUrl of jobUrls){   
        try {
            const productResponse = await gotScraping(jobUrl);
            const jobHtml = productResponse.body;
            
            $jobPage = cheerio.load(jobHtml);
            const jobTitle = $jobPage('.top-card-layout__title').text();
            console.log(jobTitle)
            // catching the error will help to continue running the code and only printing the error
        } catch(error){
            console.log(error.message, jobUrl)
        }

    }

}


crawl()