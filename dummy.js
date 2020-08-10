const https = require("https");
var results = [];
let username = process.argv[2];
let password = process.argv[3];
auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
var options = {
    host: 'api.github.com',
    path: '/repos/googlemaps/google-maps-services-java/issues',
    method: 'GET',
    headers: {
        'user-agent': 'node.js',
        "Authorization": auth
    }
};
var request = https.request(options, function (resp) {
    //console.log("inside request");
    //console.log(options);
    let data = "";
    resp.on("data", chunk => {
        data += chunk;
    });
    resp.on("end", () => {
        let activity_data = JSON.parse(data);
        function comments_recursion(i) {
            console.log("inside comments_recursion", i)
            if (i < activity_data.length) {
                //console.log(activity_data.length);
                comments_url = activity_data[i].url;
                //console.log(comments_url);
                comments_number = comments_url.slice(comments_url.length - 3);
                // console.log(comments_number);
                //console.log(auth1);
                var options1 = {
                    host: 'api.github.com',
                    path: '/repos/googlemaps/google-maps-services-java/issues/' + comments_number + '/comments',
                    method: 'GET',
                    headers: {
                        'user-agent': 'node.js',
                        "Authorization": auth
                    }
                };
                //console.log(options1);
                var request1 = https.request(options1, function (resp1) {
                    //console.log(options1);
                    //console.log("inside request1");
                    let data1 = "";
                    resp1.on("data", chunk => {
                       // console.log("inside resp1.on")
                        data1 += chunk;
                    });
                    // console.log(data1);
                    resp1.on("end", () => {
                        //console.log("inside resp1 end");
                        let comments_info = JSON.parse(data1);
                        //console.log(comments_info);
                        for (c = 0; c < comments_info.length; c++) {
                            var comments_obj={
                                comments_body:comments_info[c].body,
                                comments_updated_at:comments_info[c].updated_at,
                                comments_closed_at:comments_info[c].created_at,
                            }
                            
                        }
                        i++;
                        setTimeout(comments_recursion.bind(this, i), 2000);
                    });

                })
                request.on('error', (e) => {
                    console.error(e);
                });
                request1.end();
            }
            return;
        }
        comments_recursion(0);

    });
})
request.on('error', (e) => {
    console.error(e);
});
request.end();

