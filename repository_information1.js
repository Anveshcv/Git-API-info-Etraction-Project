//**Initializing libraries*//
const https = require("https");
const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
//**Libraries initialization ends here*//

//**GitHun Token initialization */
let username = "deeraj89@gmail.com";
let password = "9709e61138f8848ef17a76ef8edfdcf8c84b87ca";
var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
//**GitHub Token initialization ends here */

//** Api File reading code */
var a = 1;// Value of 'a' is the line number in excel file. It always starts from '1' as 0th index has headings
var csvData = [];//Global Variables
var apiNames = [];//Global variables
fs.createReadStream("APIsName.csv")
.pipe(csv(['ID',"API"]))
  .on('data', function (csvrow) {
    csvData.push(csvrow);// All data(including id and API Names) in the file is stored in 'csvData' array
  })// Reading the file
  .on('end', function () {

    for (i = 0; i < csvData.length; i++) {
      str = csvData[i].API;
      var id=csvData[i].ID
      var replaced = str.split(' ').join('%20');

      var apiFileResults = {
        ID:id,
        names: replaced
      }
      apiNames.push(apiFileResults);// All API names are now stored in the array 'apiNames'
    }
//**file reading code ends here */
    setTimeout(apiInformation.bind(this, a, onRepoDataFetched), 3000);// Calling apiInformation function
  });
var onRepoDataFetched = function () {
  a++;
  if (a < apiNames.length)
    setTimeout(apiInformation.bind(this, a, onRepoDataFetched), 3000);
};

var apiInformation = function (a, repoDataFetched) {

  if (a < apiNames.length) {
    let repositories = [];
    var results = [];
    var options = {
      host: 'api.github.com',
      path: '/search/repositories?q=' + apiNames[a].names,
      method: 'GET',
      headers: {
        'user-agent': 'node.js',
        "Authorization": auth
      }
    };
    var request = https.request(options, function (res) {
      let data = "";
      let no_of_pages="";
      res.on('data', (d) => {
        data += d;
      });
      res.on('end', () => {

        var parse = require('parse-link-header');
        var parsed = parse(res.headers.link);
        if(parsed==null)
        {
          no_of_pages=1;
        }
        //console.log(data);
        // console.log(res.headers);
        else
        {
        no_of_pages = parsed.last.page;
        }
        //console.log(res.headers.link);
        function getRepositoriesInfo(i) {
          if (i <= no_of_pages) {
            
            console.log("fetching page " + i + " of " + csvData[a].API + "(" + apiNames[a].ID + ")");
            //** Preparing PI end point URL in variable options1*/
            var options1 = {
              host: 'api.github.com',
              path: '/search/repositories?q=' + apiNames[a].names + '&page=' + i,
              method: 'GET',
              headers: {
                'user-agent': 'node.js',
                "Authorization": auth
              }//Initializing accept headers
            };
            //** Prepared End point URL */

            //** Repository names extraction code */
            https.get(options1, (res) => { //Rest API call to GitHub
              let data = "";
              res.on('data', (d) => {
                data += d;
              });
              res.on('end', () => {
                let repositories_data = JSON.parse(data);
                if(repositories_data.total_count==0)
                {
                  onRepoDataFetched();
                }
                let rep_per_page = repositories_data.items.length;
                for (y = 0; y < rep_per_page; y++) {
                  var result = {
                    repository_name: repositories_data.items[y].full_name
                  }
                  repositories.push(result);//** All repository names are stored in repositories[] array */
                }
                i++;
                setTimeout(getRepositoriesInfo.bind(this, i), 3000);
              });
            });
            //** Repository names extraction code ends here */
          }

          else {
            function recursion(i) {
              if (i < repositories.length) { 
                //** We are iterating through each repository that has been stored in repositories API */
                //**Specific URL end point initialization */
                var options = {
                  host: 'api.github.com',
                  path: '/repos/' + repositories[i].repository_name,
                  method: 'GET',
                  headers: {
                    'user-agent': 'node.js',
                    "Authorization": auth
                  }
                };
                var request = https.request(options, function (resp) {
                  let data = "";
                  resp.on("data", chunk => {
                    data += chunk;
                  });
                  resp.on("end", () => {

                    //** .csv file wrting headers declaration */
                    const csvWriter = createCsvWriter({
                      path: 'CSV files/Repository information/' + apiNames[a].ID + '.csv',
                      header: [
                        { id: 'api_id', title: 'API Id' },
                        { id: 'rep_id', title: 'Repository Id' },
                        { id: 'api_name', title: 'API Name' },
                        { id: 'rep_name', title: 'Repository name' },
                        { id: 'watch', title: 'Watch' },
                        { id: 'star', title: 'Star' },
                        { id: 'fork', title: 'Forks' },
                        { id: 'subscribers', title: 'Subscribers' },
                      ]
                    });
                     //** .csv file wrting headers declaration ends here*/

                    //** Extracting data from parsed JSON object and storing them in a variable 'result' */
                    var result =
                    {
                      api_id: apiNames[a].ID,
                      rep_id: JSON.parse(data).id,
                      api_name: JSON.parse(data).name,
                      rep_name: JSON.parse(data).full_name,
                      watch: JSON.parse(data).watchers_count,
                      star: JSON.parse(data).stargazers_count,
                      fork: JSON.parse(data).forks,
                      subscribers: JSON.parse(data).subscribers_count
                    }
                    error_msg = JSON.parse(data).message;
                     //** Extracting data from parsed JSON object and storing them in a variable 'result' ends here*/
                    
                    //** If there is no information avaliable in the repository , 'i' value wll be incremented and function recursively calls another repository */ 
                    if (error_msg == "Not Found" || error_msg == "Moved Permanently") {
                      console.log(i, "Repository not found")
                      i++
                      setTimeout(recursion.bind(this, i), 3000);
                    }
                    //**else data stored in variable 'result' will be pushed into a global array called 'results' */
                    else {
                      results.push(result);
                      console.log("Pushed results of", i, "repository of " + apiNames[a].names);
                      if (i == repositories.length - 1) {
                    //**.csv file writing */
                        console.log('file writing initiated');
                        csvWriter
                          .writeRecords(results)
                          .then(() => console.log('The CSV file was written successfully'));
                    //**.csv file writing */
                        repoDataFetched();
                      }
                      //**After writing data into .csv file 'i' value will be incremented and recursively next repository is called */
                      i++;
                      setTimeout(recursion.bind(this, i), 3000);
                    }

                  });

                })
                request.on('error', (e) => {
                  console.error(e);
                });
                request.end();
              }
            }
            recursion(0);
          }

        }
        getRepositoriesInfo(1);
      });
    });
    request.end();
  }
}