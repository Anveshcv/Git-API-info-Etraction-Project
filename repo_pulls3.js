const https = require("https");
const csv = require('csv-parser');
const fs = require('fs');
var moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format")
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

let username = "anvesh.sunny94@gmail.com";
let password = "e79a0d9538e854b2c661da16f75cc976299480aa";
//** anvesh umich token---- 3623f22cf7c1e81aae0f16541c93f6681cd1c52d  */
//** anvesh token ---- 1d1fd2968b1cfebb807f52b51271e042768c350a */
//**anvesh apple token-----  e79a0d9538e854b2c661da16f75cc976299480aa */
var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
var a = 9170;
let reaction_type = "";
//** Api File reading code */
var csvData = [];
var apiNames = [];
let commit_body="";
let commitTime="";
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
        setTimeout(apiInformation.bind(this, a), 2000);
    });
var onRepoDataFetched = function () {
    a++;
    if (a < apiNames.length)
        setTimeout(apiInformation.bind(this, a), 2000);
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
                                setTimeout(getRepositoriesInfo.bind(this, i), 2000);
                            });
                        });
                    }
                    else {
                        //** */
                        function getRepoDetailsByIndex(i) {
                            if (i < repositories.length) {
                                // console.log("inside if block",i);
                                var options = {
                                    host: 'api.github.com',
                                    path: '/repos/' + repositories[i].rep_name + '/pulls',
                                    method: 'GET',
                                    headers: {
                                        'user-agent': 'node.js',
                                        "Authorization": auth
                                    }
                                };
                                //console.log(options)
                                var request = https.request(options, function (resp) {
                                    //console.log("")
                                    let data = "";
                                    resp.on("data", chunk => {
                                        data += chunk;
                                    });
                                    resp.on("end", () => {
                                        error_msg = JSON.parse(data).message;
                                        //console.log(error_msg)
                                        let activity_data = JSON.parse(data);
                                        // console.log(activity_data);
                                        //**code for writing data into csv file  */
                                        //console.log(activity_data)
                                        const csvWriter = createCsvWriter({
                                            path: 'CSV files/Repository pulls information/' + apiNames[a].ID + '.csv',
                                            header: [
                                                { id: 'api_id', title: 'API Id' },
                                                { id: 'rep_id', title: 'Repository Id' },
                                                { id: 'api_name', title: 'API Name' },
                                                { id: 'rep_name', title: 'Repository name' },
                                                { id: 'pull_title', title: 'Pull Title' },
                                                { id: 'pull_body', title: 'Pull Body' },
                                                { id: 'pull_user_id', title: 'Pull User ID' },
                                                { id: 'pull_id', title: 'Pull ID' },
                                                { id: 'pull_created_at', title: 'Pull Created At' },
                                                { id: 'pull_updated_at', title: 'Pull Updated At' },
                                                { id: 'pull_closed_at', title: 'Pull Closed At' },
                                                { id: 'pull_updation_time_diff', title: 'Pull Updation Timedifference (dd:hh:mm:ss)' },
                                                { id: 'pull_label', title: 'Pull Label' },
                                                { id: 'pull_state', title: 'Pull State' },
                                                { id: 'pull_reaction', title: 'Pull Reaction' },
                                                { id: 'commit_message', title: 'Commit message' },
                                                { id: 'commit_message_time', title: 'Commit message Time' },
                                                { id: 'commenter_id', title: 'Commenter ID' },
                                                { id: 'comments_body', title: 'Comments Body' },
                                                { id: 'comments_created_at', title: 'Comments Created At' },
                                                { id: 'comments_updated_at', title: 'Comments Updated At' },
                                                { id: 'comments_time_diff', title: 'Comments Timedifference (dd:hh:mm:ss)' },
                                                { id: 'pull_comment_time_diff', title: 'Pull Comment Time Difference (dd:hh:mm:ss)' },
                                                { id: 'pull_comment_updation_time_diff', title: 'Pull comment Updation Time ifference (dd:hh:mm:ss)' }
                                            ]
                                        });
                                        repName = repositories[i].rep_name;
                                        repId = repositories[i].rep_id;
                                        apiName = repositories[i].api_name;
                                        getCommentsByPulls(0, activity_data, function () {
                                            // console.log(activity_data)
                                            console.log("Pushed results of", i, "repository of " + csvData[a].API);
                                            if (i == repositories.length - 1) {
                                                console.log('file writing initiated');
                                                csvWriter
                                                    .writeRecords(results)
                                                    .then(() => console.log('The CSV file was written successfully'));
                                                onRepoDataFetched();
                                            }
                                            i++;
                                            setTimeout(getRepoDetailsByIndex.bind(this, i), 2000);
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

                        //**---------------------------Comments code------------------------------ */

                        var getCommentsByPulls = function (y, activity_data, onSuccess) {
                            // console.log("inside comments_recursion", y);
                            if (!activity_data || !activity_data.length || activity_data.length == 0) {
                                onSuccess();
                                return;
                            }
                            if (y < activity_data.length) {
                                //console.log(activity_data.length);
                                comments_url = activity_data[y].comments_url;
                                commit_url = activity_data[y].commits_url;
                                let commitOptions = {
                                    headers: {
                                        'user-agent': 'node.js',
                                        "Authorization": auth
                                    }
                                };
                                https.get(commit_url, commitOptions, (res) => {
                                    let data = "";
                                    res.on('data', (d) => {
                                        data += d;
                                    });
                                    res.on('end', () => {
                                        // console.log(data);
                                        let commits_info = JSON.parse(data);
                                        // console.log(comments_url);
                                        pull_url = activity_data[y].url;
                                        reactions_url = pull_url + '/reactions';
                                        let options = {
                                            headers: {
                                                'user-agent': 'node.js',
                                                'Accept': 'application/vnd.github.squirrel-girl-preview+json',
                                                "Authorization": auth
                                            }
                                        };
                                        https.get(reactions_url, options, (res) => {
                                            let data = "";
                                            res.on('data', (d) => {
                                                data += d;
                                            })
                                            res.on('end', () => {
                                                let reactions_info = JSON.parse(data);
                                                //console.log(reactions_info);
                                                //let reaction_value=[];
                                                let reaction_value = "";
                                                let reaction_type = "";
                                                if (reactions_info.length != 0) {
                                                    for (r = 0; r < reactions_info.length; r++) {
                                                        reaction_value = reactions_info[r].content;
                                                    }

                                                    if (reaction_value == "+1") {
                                                        reaction_type = "Liked";
                                                    }
                                                    else if (reaction_value == "-1") {
                                                        reaction_type = "Disliked"
                                                    }
                                                    else {
                                                        reaction_type = reaction_value;
                                                    }
                                                }
                                                https.get(comments_url, options, (res) => {
                                                    let data = "";
                                                    res.on('data', (d) => {
                                                        data += d;
                                                    });
                                                    res.on('end', () => {
                                                        // console.log(data);
                                                        let comments_info = JSON.parse(data);
                                                        let label_value = [];
                                                        //let index= a-1;
                                                        for (l = 0; l < activity_data[y].labels.length; l++) {
                                                            label_value[0] = activity_data[y].labels[l].name;
                                                        }
                                                        //console.log(label_value);
                                                        // console.log(comments_info);

                                                        //**Time difference code */

                                                        var pullUpdationTime = activity_data[y].updated_at;
                                                        var pullCreatedTime = activity_data[y].created_at;
                                                        var pullTime = moment(pullUpdationTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ").diff(moment(pullCreatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ"));
                                                        var pT = moment.duration(pullTime);
                                                        var pullUpdationTimeDiff = pT.format("dd:hh:mm:ss");
                                                        //console.log(issueUpdationTimeDiff);

                                                        //**Time difference code ends here */

                                                        //**pulls code block removal */
                                                        var pullsBody = activity_data[y].body;
                                                        if (pullsBody != null) {
                                                            //console.log(issueBody);
                                                            var pullWithoutCode = pullsBody.replace(/(`[^*]*`)|(```[^*]*```)|(''[^*]*'')|(<kml[^*]*kml>)|(,)|(<[^*]*>)/g, ' ');
                                                        }
                                                        else {
                                                            pullWithoutCode = "";
                                                        }

                                                        //**pulls code block removal code ends here */

                                                        if (comments_info.length == 0) {
                                                            for (d = 0; d < commits_info.length; d++) {
                                                                //**commit code block removal */
                                                                commit_body = commits_info[d].commit.message;
                                                                commitTime= commits_info[d].commit.author.date
                                                                if (commit_body != null) {
                                                                    //console.log(issueBody);
                                                                    var commitWithoutCode = commit_body.replace(/(`[^*]*`)|(```[^*]*```)|(''[^*]*'')|(<kml[^*]*kml>)/g, '');
                                                                }
                                                                else {
                                                                    commitWithoutCode = "";
                                                                }
                                                                //**commit code block removal code ends here */
                                                                var resultWithoutComments = {
                                                                    api_id: apiNames[a].ID,
                                                                    rep_id: repId,
                                                                    api_name: apiName,
                                                                    rep_name: repName,
                                                                    pull_title: activity_data[y].title,
                                                                    pull_body: pullWithoutCode,
                                                                    pull_user_id: activity_data[y].user.id,
                                                                    pull_id: activity_data[y].id,
                                                                    pull_created_at: activity_data[y].created_at,
                                                                    pull_updated_at: activity_data[y].updated_at,
                                                                    pull_closed_at: activity_data[y].closed_at ? activity_data[z].closed_at : "Not yet closed",
                                                                    pull_updation_time_diff: pullUpdationTimeDiff,
                                                                    pull_label: label_value,
                                                                    pull_state: activity_data[y].state,
                                                                    pull_reaction: reaction_type,
                                                                    commit_message: commitWithoutCode,
                                                                    commit_message_time: commitTime,

                                                                }
                                                                results.push(resultWithoutComments);
                                                                //console.log(results)
                                                            }
                                                        }
                                                        else {
                                                            for (c = 0; c < comments_info.length; c++) {

                                                                //**commit code block removal */
                                                                //var commitBody = commits_info[c].commit.message;

                                                                if (commit_body != null) {
                                                                    //console.log(issueBody);
                                                                    var commitWithoutCode = commit_body.replace(/(`[^*]*`)|(```[^*]*```)|(''[^*]*'')|(<kml[^*]*kml>)/g, '');
                                                                }
                                                                else {
                                                                    commitWithoutCode = "";
                                                                }
                                                                //**commit code block removal code ends here */

                                                                //**Time difference code */

                                                                var commentUpdatedTime = comments_info[c].updated_at;
                                                                var commentCreatedTime = comments_info[c].created_at;
                                                                var commentTime = moment(commentUpdatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ").diff(moment(commentCreatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ"));
                                                                var cT = moment.duration(commentTime);
                                                                var commentUpdationTimeDiff = cT.format("dd:hh:mm:ss");
                                                                //console.log(commentUpdationTimeDiff);
                                                                //**Issue comment time diff code*/
                                                                var pullcommentTime = moment(commentCreatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ").diff(moment(pullCreatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ"));
                                                                var pcT = moment.duration(pullcommentTime);
                                                                var pullCommentCreatedTimeDiff = pcT.format("dd:hh:mm:ss");

                                                                var pullcommentUpdationTime = moment(commentUpdatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ").diff(moment(pullCreatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ"));
                                                                var pcuT = moment.duration(pullcommentUpdationTime);
                                                                var pullCommentUpdationTimeDiff = pcuT.format("dd:hh:mm:ss");
                                                                //**Issue comment im e diff code ends here */
                                                                //**Time difference code ends here */
                                                                //**code block removal */
                                                                var commentBody = comments_info[c].body;
                                                                if (commentBody != null) {
                                                                    //console.log(issueBody);
                                                                    var commentWithoutCode = commentBody.replace(/(`[^*]*`)|(```[^*]*```)|(''[^*]*'')|(<kml[^*]*kml>)|(,)|(<[^*]*>)/g, ' ');
                                                                }
                                                                else {
                                                                    commentWithoutCode = "";
                                                                }
                                                                //**code block removal code ends here */
                                                                var resultWithComments = {
                                                                    api_id: apiNames[a].ID,
                                                                    rep_id: repId,
                                                                    api_name: apiName,
                                                                    rep_name: repName,
                                                                    pull_title: activity_data[y].title,
                                                                    pull_body: pullWithoutCode,
                                                                    pull_user_id: activity_data[y].user.id,
                                                                    pull_id: activity_data[y].id,
                                                                    pull_created_at: activity_data[y].created_at,
                                                                    pull_updated_at: activity_data[y].updated_at,
                                                                    pull_closed_at: activity_data[y].closed_at ? activity_data[z].closed_at : "Not yet closed",
                                                                    pull_updation_time_diff: pullUpdationTimeDiff,
                                                                    pull_label: label_value,
                                                                    pull_state: activity_data[y].state,
                                                                    pull_reaction: reaction_type,
                                                                    commit_message: commitWithoutCode,
                                                                    commit_message_time: commitTime,
                                                                    commenter_id: comments_info[c].user.id,
                                                                    comments_body: commentWithoutCode,
                                                                    comments_created_at: comments_info[c].created_at,
                                                                    comments_updated_at: comments_info[c].updated_at,
                                                                    comments_time_diff: commentUpdationTimeDiff,
                                                                    pull_comment_time_diff: pullCommentCreatedTimeDiff,
                                                                    pull_comment_updation_time_diff: pullCommentUpdationTimeDiff
                                                                }
                                                                // console.log(comments_obj.comments_created_at);
                                                                results.push(resultWithComments);

                                                                //console.log(results);
                                                            }
                                                        }
                                                        if (y == (activity_data.length - 1)) {
                                                            onSuccess();
                                                            return;
                                                        }
                                                        y++;
                                                        setTimeout(getCommentsByPulls.bind(this, y, activity_data, onSuccess), 2000);
                                                    });

                                                }).on('error', (e) => {
                                                    console.error(e);
                                                });
                                            })
                                        })
                                    });
                                });
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






