const cheerio = require('cheerio');
const {gotScraping} = require('got-scraping')

const url = 'https://www.linkedin.com/jobs/search?keywords=Back%20End%20Developer&location=Egypt&locationId=&geoId=106155005&f_TPR=r86400&position=1&pageNum=0'
const scrape = async ()=> {

    const response = await gotScraping(url)
    const html = response.body
    // any selection contains child nodes inside so we can't use methods on them
    // Initialize a cheerio instanc with html to have interface that enables us to work with the html doc

    const $ = cheerio.load(html)
    const cards = $('.base-search-card__info')

    // each element inside the loop is a representation of the current dom element as an js object
    // The $(element) call is used to convert the native DOM element to a Cheerio object tob be able touse its methods
    // it takes a string or an object the string for selection and the object for turning into a selection object so it turns both to a selection 
    // so that you can access Cheerio methods like text().
    // The text() method is a function provided by Cheerio to extract the text content from the selected element.
    const jobs = {}
    cards.each((index, card) => {
        const titleSelection = $(card).find('.base-search-card__title')
        const titleText = titleSelection.text().split('\n').join('').trim()

        const companySelection = $(card).find('.base-search-card__subtitle')
        const companyText = companySelection.text().split('\n').join('').trim()

        if(titleText && companyText){
            jobs[index] = {
                title: titleText,
                company: companyText
            }
        }

    })

    console.log(jobs)
}
// base-search-card__title

scrape()
// $ is initialized with the page
// selected all the cards using $('cardClass')
// looped through them


