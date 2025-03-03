const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const url = "https://bulletin.du.edu/undergraduate/majorsminorscoursedescriptions/traditionalbachelorsprogrammajorandminors/computerscience/#coursedescriptionstext";

axios.get(url)
  .then(response => {
    const html = response.data;
    const $ = cheerio.load(html);
    const courses = [];

    // Regex to match "Prerequisite:" or "Prerequisites:" (case-insensitive)
    const prereqRegex = /prerequisite(s)?:/i;

    // Select all course blocks
    $('.courseblock').each((i, elem) => {
      const titleElem = $(elem).find('.courseblocktitle');
      if (titleElem.length) {
        const titleText = titleElem.text().trim();
        // Flexible regex to capture COMP code and course title
        const match = titleText.match(/^(COMP[-\s]?(\d{4}))[\s.:-]+(.+)$/i);
        if (match) {
          const courseCode = match[1];   // e.g., "COMP-3030" or "COMP 3030"
          const courseNumber = parseInt(match[2], 10);
          const courseTitle = match[3].trim();

          // Only consider upper-division courses (3000-level or higher)
          if (courseNumber >= 3000) {
            // Grab the description text
            const description = $(elem).find('.courseblockdesc').text().trim();

            // Exclude if "Prerequisite(s):" is mentioned
            if (!prereqRegex.test(description)) {
              courses.push({
                course: courseCode,
                title: courseTitle
              });
            }
          }
        } else {
          // Uncomment to debug unmatched titles:
          // console.log("No match for title:", titleText);
        }
      }
    });

    // Prepare JSON output
    const output = { courses };

    // Ensure the "results" directory exists and save the JSON file
    fs.mkdirSync("results", { recursive: true });
    fs.writeFileSync(path.join("results", "bulletin.json"), JSON.stringify(output, null, 4));

    console.log(`Found ${courses.length} upper-division COMP courses without prerequisites.`);
    console.log("Data saved to results/bulletin.json");
  })
  .catch(error => {
    console.error("Error fetching the DU Bulletin page:", error);
  });
