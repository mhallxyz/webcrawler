var request = require("request");
var cheerio = require("cheerio");
var URL = require("url-parse");
const argv = require("yargs").argv;

var START_URL = `${argv._[0]}`;
var SEARCH_WORD = (argv._[1] !== undefined ? `${argv._[0]}` : undefined);
var MAX_PAGES_TO_VISIT = 100;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;

//To use first with your terminal enter the webcrawler directory with your terminal and type "npm install" to install node modules.
//Then enter "npm start 'https://website.url.com' 'wordToSearchOnPages'"


pagesToVisit.push(START_URL);
crawl();

function crawl() {
  if (numPagesVisited >= MAX_PAGES_TO_VISIT) {
    console.log("Reached max limit of number of pages to visit.");
    return;
  }
  var nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else {
    // New page we haven't visited
    visitPage(nextPage, crawl);
  }
}

function visitPage(url, callback) {
  // Add page to our set
  pagesVisited[url] = true;
  numPagesVisited++;

  // Make the request
  console.log("Visiting page " + url);
  request(url, function(error, response, body) {
    // Check status code (200 is HTTP OK)
    console.log("Status code: " + response.statusCode);
    if (response.statusCode !== 200) {
      callback();
      return;
    }
    // Parse the document body
    var $ = cheerio.load(body);
    var isWordFound = searchForWord($, SEARCH_WORD);
    if (isWordFound) {
      console.log("Word " + SEARCH_WORD + " found at page " + url);
    } else {
      collectInternalLinks($);
      // In this short program, our callback is just calling crawl()
      callback();
    }
  });
}

function searchForWord($, word) {
  if (argv._[1] === undefined || argv._[1] === null) {
    return;
  }
  var bodyText = $("html > body")
    .text()
    .toLowerCase();
  return bodyText.indexOf(word.toLowerCase()) !== -1;
}

function collectInternalLinks($) {
  var relativeLinks = $("a[href^='/']");
  console.log("Found " + relativeLinks.length + " relative links on page");
  relativeLinks.each(function() {
    pagesToVisit.push(baseUrl + $(this).attr("href"));
  });
}
