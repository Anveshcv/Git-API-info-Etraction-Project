const https = require("https");
const csv = require('csv-parser');
const fs = require('fs');
var moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format")
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

let username = "anveshcv@gmail.com";
let password = "amicus1994";
var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
var a = 1;
let reaction_type = "";
//** Api File reading code */
var csvData = [];
var apiNames = [];
fs.createReadStream("APIsName.csv")
    .pipe(csv(['ID', "API"]))
    .on('data', function (csvrow) {
        csvData.push(csvrow);
    })
    .on('end', function () {

        for (i = 0; i < csvData.length; i++) {
            str = csvData[i].API;
            var id = csvData[i].ID
            var replaced = str.split(' ').join('%20');

            var apiFileResults = {
                ID: id,
                names: replaced
            }
            apiNames.push(apiFileResults);
        }
        setTimeout(apiInformation.bind(this, a), 1000);
    });
var onRepoDataFetched = function () {
    a++;
    if (a < apiNames.length)
        setTimeout(apiInformation.bind(this, a), 1000);
};

var apiInformation = function (a) {

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
            let no_of_pages = "";
            res.on('data', (d) => {
                data += d;
            });
            res.on('end', () => {

                var parse = require('parse-link-header');
                var parsed = parse(res.headers.link);
                if (parsed == null) {
                    no_of_pages = 1;
                }
                //console.log(data);
                // console.log(res.headers);
                else {
                    no_of_pages = parsed.last.page;
                }
                //console.log(res.headers.link);
                function getRepositoriesInfo(i) {
                    if (i <= 3) {
                        //console.log(i);

                        // console.log("page" + i);
                        //console.log(apiNames);
                        console.log("fetching page " + i + " of " + csvData[a].API);
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
                                if (repositories_data.total_count == 0) {
                                    onRepoDataFetched();
                                }
                                let rep_per_page = repositories_data.items.length;
                                //console.log(rep_per_page);
                                for (y = 0; y < rep_per_page; y++) {
                                    var result = {
                                        rep_name: repositories_data.items[y].full_name,
                                        rep_id: repositories_data.items[y].id,
                                        api_name: repositories_data.items[y].name
                                    }
                                    repositories.push(result);
                                }
                                //console.log(repositories)
                                i++;
                                //console.log(i);
                                setTimeout(getRepositoriesInfo.bind(this, i), 1000);
                            });
                        });
                    }
                    else {
                        function getRepoDetailsByIndex(i) {
                            // console.log("inside fucntion",i);
                            if (i < repositories.length) {
                                //  console.log("inside if block",i);
                                var options = {
                                    host: 'api.github.com',
                                    path: '/repos/' + repositories[i].rep_name + '/pulls',
                                    method: 'GET',
                                    headers: {
                                        'user-agent': 'node.js',
                                        "Authorization": auth
                                    }
                                };
                                var request = https.request(options, function (resp) {
                                    //console.log("inside request");

                                    let data = "";
                                    resp.on("data", chunk => {
                                        data += chunk;
                                    });
                                    resp.on("end", () => {
                                        let pulls_data = JSON.parse(data);
                                        //console.log(pulls_data.message);
                                        // **code for writing data into csv file  */

                                        const csvWriter = createCsvWriter({
                                            path: 'CSV files/Repository pulls information/' + apiNames[a].ID + '.csv',
                                            header: [
                                                { id: 'api_id', title: 'API Id' },
                                                { id: 'rep_id', title: 'Repository Id' },
                                                { id: 'api_name', title: 'API Name' },
                                                { id: 'rep_name', title: 'Repository name' },
                                                { id: 'pull_request_title', title: 'Pull request title' },
                                                { id: 'pull_request_body', title: 'Pull request Body' },
                                                { id: 'pull_request_id', title: 'Pull request ID' },
                                                { id: 'pull_request_state', title: 'Pull request State' },
                                                { id: 'commit_message', title: 'Commit message' },
                                                { id: 'commit_message_time', title: 'Commit message Time' }
                                            ]
                                        });
                                        repName = repositories[i].rep_name;
                                        repId = repositories[i].rep_id;
                                        apiName = repositories[i].api_name;
                                        getCommitsByPulls(0, pulls_data, function () {
                                            console.log("Pushed results of", i, "repository of " + csvData[a].API);
                                            // console.log(activity_data)
                                            if (i == repositories.length - 1) {
                                                console.log('file writing initiated');
                                                csvWriter
                                                    .writeRecords(results)
                                                    .then(() => console.log('The CSV file was written successfully'));
                                            }
                                            i++;
                                            setTimeout(getRepoDetailsByIndex.bind(this, i), 200);
                                        });
                                    });

                                })
                                request.on('error', (e) => {
                                    console.error(e);
                                });
                                request.end();
                            }
                        }
                        getRepoDetailsByIndex(0);

                        var getCommitsByPulls = function (y, pulls_data, onSuccess) {
                            // console.log("inside comments_recursion", y);
                            if (!pulls_data || !pulls_data.length || pulls_data.length == 0) {
                                onSuccess();
                                return;
                            }
                            if (y < pulls_data.length) {
                                //console.log(activity_data.length);
                                commit_url = pulls_data[y].commits_url;
                                // console.log(commits_url);
                                let options = {
                                    headers: {
                                        'user-agent': 'node.js',
                                        "Authorization": auth
                                    }
                                };
                                https.get(commit_url, options, (res) => {
                                    let data = "";
                                    res.on('data', (d) => {
                                        data += d;
                                    });
                                    res.on('end', () => {
                                        // console.log(data);
                                        let commits_info = JSON.parse(data);
                                        // console.log(commits_info);
                                        var pullRequestBody = pulls_data[y].body;
                                        var pullRequestWithoutCode = pullRequestBody.replace(/(`[^*]*`)|(```[^*]*```)|(''[^*]*'')|(<kml[^*]*kml>)/g, '');
                                        if (commits_info.length == 0) {
                                            var resultWithoutCommits = {
                                                api_id: apiNames[a].ID,
                                                rep_id: repId,
                                                api_name: apiName,
                                                rep_name: repName,
                                                pull_request_title: pulls_data[y].title,
                                                pull_request_body: pullRequestWithoutCode,
                                                pull_request_id: pulls_data[y].id,
                                                pull_request_state: pulls_data[y].state,
                                            }
                                            results.push(resultWithoutCommits);
                                        }
                                        else {
                                            for (c = 0; c < commits_info.length; c++) {
                                                //**code block removal */
                                                var commitBody = commits_info[c].commit.message;
                                                var commitWithoutCode = commitBody.replace(/(`[^*]*`)|(```[^*]*```)|(''[^*]*'')/g, '');
                                                //**code block removal code ends here */
                                                var resultWithCommits = {
                                                    api_id: apiNames[a].ID,
                                                    rep_id: repId,
                                                    api_name: apiName,
                                                    rep_name: repName,
                                                    pull_request_title: pulls_data[y].title,
                                                    pull_request_body: pullRequestWithoutCode,
                                                    pull_request_id: pulls_data[y].id,
                                                    pull_request_state: pulls_data[y].state,
                                                    commit_message: commitWithoutCode,
                                                    commit_message_time: commits_info[c].commit.author.date
                                                }
                                                // console.log(comments_obj.comments_created_at);
                                                results.push(resultWithCommits);
                                            }
                                        }
                                        if (y == (pulls_data.length - 1)) {
                                            onSuccess();
                                            return;
                                        }
                                        y++;
                                        setTimeout(getCommitsByPulls.bind(this, y, pulls_data, onSuccess), 200);
                                    });

                                }).on('error', (e) => {
                                    console.error(e);
                                });
                                // console.log(options1);
                            }
                        }
                    }
                }
                getRepositoriesInfo(3);
            });
        });
        request.end();
    }
}






