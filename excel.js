const https = require("https");
// var url = "https://api.github.com/search/repositories?q=google maps api";
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

let username = "anveshcv@gmail.com";
let password = "amicus1994";
auth = "Basic " + new Buffer(username + ":" + password).toString("base64");

let repositories = [];
var results = [];
var options = {
  host: 'api.github.com',
  path: '/search/repositories?q=google%20maps%20api',
  method: 'GET',
  headers: {
    'user-agent': 'node.js',
    "Authorization": auth
  }
};
var request = https.request(options, function (res) {
  let data = "";
  res.on('data', (d) => {
    data += d;
  });
  res.on('end', () => {
    var parse = require('parse-link-header');
    var parsed = parse(res.headers.link);
    no_of_pages = parsed.last.page;
    //console.log(res.headers.link);
    function getRepositoriesInfo(i) {
      if (i <= 1) {
        //console.log(i);
        console.log("page" + i);
        var options1 = {
          host: 'api.github.com',
          path: '/search/repositories?q=google%20maps%20api&page=' + i,
          method: 'GET',
          headers: {
            'user-agent': 'node.js',
            "Authorization": auth
          }
        };
        //console.log(options1);
        https.get(options1, (res) => {
          let data = "";
          res.on('data', (d) => {
            data += d;
          });
          res.on('end', () => {

            let repositories_data = JSON.parse(data);
            let rep_per_page = repositories_data.items.length;
            //console.log(rep_per_page);
            for (y = 0; y < rep_per_page; y++) {
              var result = {
                repository_name: repositories_data.items[y].full_name
              }
              repositories.push(result);
            }

            // console.log(repositories);
            i++;
            //console.log(i);
            setTimeout(getRepositoriesInfo.bind(this, i), 200);
          });
        });
        // console.log(repositories);
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
              console.log("")
              let data = "";
              resp.on("data", chunk => {
                data += chunk;
              });
              resp.on("end", () => {

                //**code for writing data into csv file  */

                const csvWriter = createCsvWriter({
                  path: 'CSV files/Google Maps API/Google Maps API(Rep_info).csv',
                  header: [
                    { id: 'api_id', title: 'API Id' },
                    { id: 'rep_id', title: 'Repository Id' },
                    { id: 'rep_name', title: 'Repository Name' },
                    { id: 'rep_fullname', title: 'Repository Fullname' },
                    { id: 'watch', title: 'Watch' },
                    { id: 'star', title: 'Star' },
                    { id: 'fork', title: 'Forks' },
                    { id: 'subscribers', title: 'Subscribers' },
                  ]
                });
                var result =
                {
                  api_id:"1",
                  rep_id:JSON.parse(data).id,
                  rep_name: JSON.parse(data).name,
                  rep_fullname: JSON.parse(data).full_name,
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
                  setTimeout(recursion.bind(this, i), 2000);
                }
                else {
                  results.push(result);
                  console.log("Pushed results of", i, "repository");
                  if (i == repositories.length - 1) {
                    console.log('file writing initiated');
                    csvWriter
                      .writeRecords(results)
                      .then(() => console.log('The CSV file was written successfully'));
                  }
                  i++;
                  setTimeout(recursion.bind(this, i), 2000);
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