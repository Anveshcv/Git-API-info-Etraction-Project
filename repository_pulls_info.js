const https = require("https");
const csv = require('csv-parser');
const fs = require('fs');
var moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format")
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

let username = "anveshcv@gmail.com";
let password = "amicus1994";
var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
var a = 10006;
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
                    if (i <= no_of_pages) {
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
                                                { id: 'pull_created_at', title: 'Pull Created At' },
                                                { id: 'pull_updated_at', title: 'Pull Updated At' },
                                                { id: 'pull_request_state', title: 'Pull request State' },
                                                { id: 'pull_updation_time_diff', title: 'Pulls Updation Timedifference (dd:hh:mm:ss)' },
                                                { id: 'commit_message', title: 'Commit message' },
                                                { id: 'commit_message_time', title: 'Commit message Time' },
                                                { id: 'commit_time_diff', title: 'Commits Timedifference (dd:hh:mm:ss)'},
                                                { id: 'pull_commit_time_diff', title: 'Pull Commit Time Difference (dd:hh:mm:ss)'},
                                                { id: 'pull_commit_updation_time_diff', title: 'Pull Commit Updation Time ifference (dd:hh:mm:ss)'}
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
                                                onRepoDataFetched();
                                            }
                                            i++;
                                            setTimeout(getRepoDetailsByIndex.bind(this, i), 1000);
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
                                        //**Time difference code */

                                        var pullUpdationTime = pulls_data[y].updated_at;
                                        var pullCreatedTime = pulls_data[y].created_at;
                                        var pullTime = moment(pullUpdationTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ").diff(moment(pullCreatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ"));
                                        var pT = moment.duration(pullTime);
                                        var pullUpdationTimeDiff = pT.format("dd:hh:mm:ss");

                                        //console.log(issueUpdationTimeDiff);
                                        if (pullRequestBody != null) {
                                            //console.log(issueBody);
                                            var pullRequestWithoutCode = pullRequestBody.replace(/(`[^*]*`)|(```[^*]*```)|(''[^*]*'')|(<kml[^*]*kml>)/g, '');
                                        }
                                        else {
                                            pullRequestWithoutCode = "";
                                        }


                                        if (commits_info.length == 0) {
                                            var resultWithoutCommits = {
                                                api_id: apiNames[a].ID,
                                                rep_id: repId,
                                                api_name: apiName,
                                                rep_name: repName,
                                                pull_request_title: pulls_data[y].title,
                                                pull_request_body: pullRequestWithoutCode,
                                                pull_request_id: pulls_data[y].id,
                                                pull_created_at: pulls_data[y].created_at,
                                                pull_updated_at: pulls_data[y].updated_at,
                                                pull_closed_at: pulls_data[y].closed_at ? pulls_data[y].closed_at : "Not yet closed",
                                                pull_request_state: pulls_data[y].state,
                                                pull_updation_time_diff: pullUpdationTimeDiff
                                            }
                                            results.push(resultWithoutCommits);
                                        }
                                        else {
                                            for (c = 0; c < commits_info.length; c++) {
                                                //**Time difference code */

                                                var commitUpdatedTime = commits_info[c].updated_at;
                                                var commitCreatedTime = commits_info[c].created_at;
                                                var commitTime = moment(commitUpdatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ").diff(moment(commitCreatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ"));
                                                var cT = moment.duration(commitTime);
                                                var commitUpdationTimeDiff = cT.format("dd:hh:mm:ss");
                                                //console.log(commentUpdationTimeDiff);
                                                //**Issue comment time diff code*/
                                                var pullCommitTime = moment(commitCreatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ").diff(moment(pullCreatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ"));
                                                var pcT = moment.duration(pullCommitTime);
                                                var pullCommitCreatedTimeDiff= pcT.format("dd:hh:mm:ss");
                                                
                                                var pullCommitUpdationTime = moment(commitUpdatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ").diff(moment(pullCreatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ"));
                                                var pcuT = moment.duration(pullCommitUpdationTime);
                                                var pullCommitUpdationTimeDiff= pcuT.format("dd:hh:mm:ss");
                                                //**Issue comment im e diff code ends here */
                                                //**Time difference code ends here */
                                                //**code block removal */
                                                var commitBody = commits_info[c].commit.message;
                                                
                                                if (commitBody != null) {
                                                    //console.log(issueBody);
                                                    var commitWithoutCode = commitBody.replace(/(`[^*]*`)|(```[^*]*```)|(''[^*]*'')|(<kml[^*]*kml>)/g, '');
                                                }
                                                else {
                                                    commitWithoutCode = "";
                                                } 
                                                //**code block removal code ends here */
                                                var resultWithCommits = {
                                                    api_id: apiNames[a].ID,
                                                    rep_id: repId,
                                                    api_name: apiName,
                                                    rep_name: repName,
                                                    pull_request_title: pulls_data[y].title,
                                                    pull_request_body: pullRequestWithoutCode,
                                                    pull_request_id: pulls_data[y].id,
                                                    pull_created_at: pulls_data[y].created_at,
                                                    pull_updated_at: pulls_data[y].updated_at,
                                                    pull_closed_at: pulls_data[y].closed_at ? pulls_data[y].closed_at : "Not yet closed",
                                                    pull_request_state: pulls_data[y].state,
                                                    pull_updation_time_diff: pullUpdationTimeDiff,
                                                    commit_message: commitWithoutCode,
                                                    commit_message_time: commits_info[c].commit.author.date,
                                                    commit_time_diff: commitUpdationTimeDiff,
                                                    pull_commit_time_diff: pullCommitCreatedTimeDiff,
                                                    pull_commit_updation_time_diff: pullCommitUpdationTimeDiff
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
                                        setTimeout(getCommitsByPulls.bind(this, y, pulls_data, onSuccess), 1000);
                                    });

                                }).on('error', (e) => {
                                    console.error(e);
                                });
                                // console.log(options1);
                            }
                        }
                    }
                }
                getRepositoriesInfo(1);
            });
        });
        request.end();
    }
}





