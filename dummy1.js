const https = require("https");
// var url = "https://api.github.com/search/repositories?q=google maps api";

let username = "anveshcv@gmail.com";
let password = "amicus1994";
auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');

let repositories = [];
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
  let no_of_pages="";
  res.on('data', (d) => {
    data += d;
  });
  res.on('end', () => {
    var parse = require('parse-link-header');
    var parsed = parse(res.headers.link);
    console.log(parsed);
    if(parsed==null){
      no_of_pages=1;
    }
    else{
      no_of_pages=parsed.last.page;
    }
    //no_of_pages = parsed.last.page;
    //console.log(res.headers.link);
    function getRepositoriesInfo(i) {
      if (i <= no_of_pages) {
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

            console.log(repositories);
            i++;
            //console.log(i);
            setTimeout(getRepositoriesInfo.bind(this, i), 200);
          });
        });

      }
      
    }
    getRepositoriesInfo(1);
  });
});
request.end();