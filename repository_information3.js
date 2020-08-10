const https = require("https");
const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

let username = "anvesh@umich.edu";
let password = "3623f22cf7c1e81aae0f16541c93f6681cd1c52d";
var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
var a = 3770;
//** Api File reading code */
var csvData = [];
var apiNames = [];
fs.createReadStream("APIsName.csv")
.pipe(csv(['ID',"API"]))
  .on('data', function (csvrow) {
    csvData.push(csvrow);
  })
  .on('end', function () {

    for (i = 0; i < csvData.length; i++) {
      str = csvData[i].API;
      var id=csvData[i].ID
      var replaced = str.split(' ').join('%20');

      var apiFileResults = {
        ID:id,
        names: replaced
      }
      apiNames.push(apiFileResults);
    }

    //console.log(apiNames);
    //**file reading code ends here */
    setTimeout(apiInformation.bind(this, a, onRepoDataFetched), 3000);

  });
var onRepoDataFetched = function () {
  a++;
  if (a < apiNames.length)
    setTimeout(apiInformation.bind(this, a, onRepoDataFetched), 3000);
};

var apiInformation = function (a, repoDataFetched) {

  //console.log(apiNames.length);
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
            //console.log(i);

            // console.log("page" + i);
            //console.log(apiNames);
            console.log("fetching page " + i + " of " + csvData[a].API + "(" + apiNames[a].ID + ")");
            var options1 = {
              host: 'api.github.com',
              path: '/search/repositories?q=' + apiNames[a].names + '&page=' + i,
              method: 'GET',
              headers: {
                'user-agent': 'node.js',
                "Authorization": auth
              }
            };
            //console.log(options1);
            https.get(options1, (res) => {
             //console.log("hello")
              let data = "";
              res.on('data', (d) => {
                data += d;
              });
              res.on('end', () => {
                //console.log(options1);
                
                let repositories_data = JSON.parse(data);
                if(repositories_data.total_count==0)
                {
                  onRepoDataFetched();
                }
                let rep_per_page = repositories_data.items.length;
                //console.log(rep_per_page);
                for (y = 0; y < rep_per_page; y++) {
                  var result = {
                    repository_name: repositories_data.items[y].full_name
                  }
                  repositories.push(result);
                }

                i++;
                //console.log(i);
                setTimeout(getRepositoriesInfo.bind(this, i), 3000);
              });
            });
          }

          else {
            function recursion(i) {
              // console.log("inside fucntion",i);
              if (i < repositories.length) {
                //  console.log("inside if block",i);
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
                  //console.log("")
                  let data = "";
                  resp.on("data", chunk => {
                    data += chunk;
                  });
                  resp.on("end", () => {

                    //**code for writing data into csv file  */

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

                    //console.log(error_msg);
                    if (error_msg == "Not Found" || error_msg == "Moved Permanently") {
                      console.log(i, "Repository not found")
                      i++
                      setTimeout(recursion.bind(this, i), 3000);
                    }
                    else {
                      results.push(result);
                      console.log("Pushed results of", i, "repository of " + apiNames[a].names);
                      if (i == repositories.length - 1) {
                        console.log('file writing initiated');
                        csvWriter
                          .writeRecords(results)
                          .then(() => console.log('The CSV file was written successfully'));
                        repoDataFetched();
                      }
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