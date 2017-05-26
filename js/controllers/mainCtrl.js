angular.module('compasstic.controllers').controller('mainCtrl',
    ['$scope','$window', '$webServicesFactory', '$appDataProvider', '$q', '$pagesProvider', '$stopWordsProvider',
        function ($scope, $window, $webServicesFactory, $appDataProvider, $q, $pagesProvider, $stopWordsProvider) {
            $scope.loading = true;
            $scope.commentsLimit = 400;
            $scope.comments = [];
            $scope.pages = $pagesProvider;
            $scope.selectedCategory = "_";
            $scope.selectedPage = "_";
            $scope.selectedTopic = "";
            $scope.commentFeeling = "6";
            $scope.categories = {
                person: {
                    id: "person",
                    name: "Person",
                    opinionsURL: "https://compasstic-c2156.firebaseio.com/peopleOpinions",
                    commentsURL: "https://compasstic-c2156.firebaseio.com/peopleComments",
                    underreviewURL: "https://compasstic-c2156.firebaseio.com/peopleUnderreview"
                },
                product: {
                    id: "product",
                    name: "Product",
                    opinionsURL: "https://compasstic-c2156.firebaseio.com/productOpinions",
                    commentsURL: "https://compasstic-c2156.firebaseio.com/productComments",
                    underreviewURL: "https://compasstic-c2156.firebaseio.com/productUnderreview"
                },
                place: {
                    id: "place",
                    name: "Place",
                    opinionsURL: "https://compasstic-c2156.firebaseio.com/placeOpinions",
                    commentsURL: "https://compasstic-c2156.firebaseio.com/placeComments",
                    underreviewURL: "https://compasstic-c2156.firebaseio.com/placeUnderreview"
                },
                event: {
                    id: "event",
                    name: "Event",
                    opinionsURL: "https://compasstic-c2156.firebaseio.com/eventOpinions",
                    commentsURL: "https://compasstic-c2156.firebaseio.com/eventComments",
                    underreviewURL: "https://compasstic-c2156.firebaseio.com/eventUnderreview"
                }
                
            };
            
            function getFBToken() {
                $webServicesFactory.get("https://graph.facebook.com/oauth/access_token", {},
                    {
                        client_id: $appDataProvider.FB.ID,
                        client_secret: $appDataProvider.FB.secret,
                        grant_type: $appDataProvider.FB.grantTypes
                    }
                ).then(
                    function (response) {
                        $scope.accessToken = response.access_token;
                        console.info("Got access token.");
                        $scope.loading = false;
                    }
                );
            }
            getFBToken();


            
            function getRandomNumber(min, max) {
                return Math.floor(Math.random() * (max - min)) + min;
            }
            $scope.cleanText = function (str) {
                return str.toLowerCase().replace(/[^a-zA-Z0-9']/gi, ' ').replace(/_/g, ' ').replace(/\r?\n|\r/g, ' ').replace(/ +(?= )/g,'');
            };
            
            
            
            //getting comments and filling DB
            $scope.getComments = function () {

                $scope.loading = true;
                $scope.comments = [];
                var commentsAfter = "";
                var _postsCount = 0;
                
                //gets latest 100 post from selected page
                function getPosts() {
                    $scope.statue ="Getting most recent 100 post from "+$scope.pages[$scope.selectedPage].name;
                    var deferrd = $q.defer();
                    $webServicesFactory.get("https://graph.facebook.com/"+$scope.selectedPage+"/posts", {}, {
                        access_token: $scope.accessToken,
                        limit: 100
                    }).then(
                        function (response) {
                            console.info("Got "+response.data.length+" post.");
                            $scope.posts = response.data;
                            deferrd.resolve();
                        }
                    );

                    return deferrd.promise;
                }
                //filters posts based on selected topic
                function filterPosts() {
                    $scope.statue = 'Filtering posts by "'+$scope.selectedTopic+'"';
                    var posts = $scope.posts;
                    $scope.posts = {};

                    for(var i=0; i<posts.length; i+=1){
                        if(posts[i].message && posts[i].message.toLowerCase().indexOf($scope.selectedTopic.toLowerCase())!== -1)
                            $scope.posts[posts[i].id] = posts[i];
                    }

                    console.info("Found "+Object.keys($scope.posts).length+" posts about "+$scope.selectedTopic+".");
                }
                //gets al comments from all the posts
                function getComments(post) {
                    console.info("Getting comments.");
                    $webServicesFactory.get("https://graph.facebook.com/"+post.id, {}, {
                        fields: "comments.limit("+$scope.commentsLimit+")"+commentsAfter
                    }).then(
                      function (response) {
                          response =  response.comments;
                          $scope.comments = $scope.comments.concat(response.data);

                          if (response.paging.next) {
                              commentsAfter = '.after('+response.paging.cursors.after+')';
                              getComments($scope.posts[$scope.selectedPage+"_"+response.data[0].id.split('_')[0]]);
                          }
                          else{
                              _postsCount += 1;
                              if(_postsCount == Object.keys($scope.posts).length){
                                  console.info("Got " + $scope.comments.length + " comments.");
                                    $scope.loading = false;
                              }

                          }
                      }  
                    );
                }
                
                
                getPosts().then(
                    function () {
                        filterPosts();
                        for(var post in $scope.posts)
                            getComments($scope.posts[post]);
                    }
                )

            };
            $scope.sendCommentsToDB = function(){
                $scope.loading = true;
                console.info("Selecting comments to send.");
                var selectedComments = {};
                var comment = {};
                
                while(Object.keys(selectedComments).length<1000){
                    comment = $scope.comments[getRandomNumber(0, $scope.comments.length-1)];
                    if(!selectedComments[comment.id]){
                        comment.id = $scope.selectedPage+"_"+comment.id+"_"+(Object.keys(selectedComments).length-1)

                        selectedComments[comment.id] = {
                            id: comment.id,
                            message: comment.message
                        }
                    }
                }
                
                console.log("Selected "+Object.keys(selectedComments).length+" comment.");
                console.log("Posting to DB.");
                //posting to DB
                $webServicesFactory.put(
                    $scope.categories[$scope.selectedCategory].commentsURL+".json",
                    {},
                    selectedComments
                ).then(
                    function (response) {
                        console.log("Cleanning...")
                        delete $scope.comments;
                        $scope.comments = [];
                        $scope.loading = false;
                    }
                );
                
            };
            ///
            //classing sample
            $scope.startClassing = function(){
                $scope.loading = true;
                $scope.comments = [];
                $scope.updatedComment = {};
                var comments={};
                var commentLimit = 10;
                function kMean(comments){
                    var This = this;
                    this.features = {};
                    var commentBOW = {};
                    var commentTxt = "";

                    //filling bow from comments
                    for(var c in comments){
                        tempOpinion = {};
                        commentTxt = $scope.cleanText(comments[c].message).split(' ');
                        for(var w=0; w<commentTxt.length; w+=1){

                            if(!$stopWordsProvider[commentTxt[w]]) {
                                if (!commentBOW[commentTxt[w]])
                                    commentBOW[commentTxt[w]] = 0;

                                commentBOW[commentTxt[w]] += 1;
                            }
                        }
                        delete commentBOW[""];
                    }
                    //
                    //selecting featuers
                    var features = [];
                    var freqAverage = 0;
                    var freqTotal = 0;
                    //obj to array & average
                    for(var word in commentBOW) {
                        features.push({word: word, freq: commentBOW[word]});
                        freqTotal += commentBOW[word];
                    }
                    freqAverage = freqTotal/features.length;

                    console.info("Found features freq average = "+freqAverage);
                    //
                    //order by freq
                    features.sort(
                        function(a,b) {
                            if (a.freq < b.freq)
                                return 1;
                            if (a.freq > b.freq)
                                return -1;
                            return 0;
                        }
                    );
                    //
                    //remove what is below average
                    for(var i =0; i<features.length; i+=1)
                        if(features[i].freq>freqAverage){
                            
                            This.features[features[i].word]=i;
                            This.fTotal+=features[i].freq;
                        }
                    console.info("Selected "+Object.keys(This.features).length+" feature.");
                    
                    
                    
                    //
                    //
                    //comments to objects
                    This.sample = [];
                    This.labels = [];
                    var tempOpinion, opinionWorth;
                    for(var c in comments){
                        opinionWorth = 0;
                        tempOpinion =  Array(Object.keys(This.features).length).fill(0);
                        commentTxt = $scope.cleanText(comments[c].message).split(' ');
                        for(var w=0; w<commentTxt.length; w+=1) {
                            if (!$stopWordsProvider[commentTxt[w]] && This.features[commentTxt[w]]) {
                                tempOpinion[This.features[commentTxt[w]]] +=1 ;
                                opinionWorth += 1;
                            }
                        }
                        
                        if(opinionWorth>0){
                            //normilze
                            for(var i=0; i<tempOpinion.length; i+=1){
                                tempOpinion[i] = tempOpinion[i]*100;
                            }
                            This.sample.push(tempOpinion);
                            This.labels.push((comments[c].sentiment == 1)? 1 :-1);
                        }
                    }
                    
                    console.info(This.sample);
                    
                    
                    //list all distances
                    function getDistance(A, B){
                        var c = 0;
                        for(var i=0; i<A.length; i+=1)
                            c+= Math.pow((A[i]-B[i]),2);
                        
                        return Math.sqrt(c);
                    }
                    This.distances = [];
                    This.distancesAvg = [];
                    var dTotal = 0;
                    var tempD = 0
                    
                    for(var i=0; i<This.sample.length; i+=1){
                        This.distances.push([]);
                        dTotal = 0;
                        for(var j=0; j<This.sample.length; j+=1){
                            tempD = getDistance(This.sample[i], This.sample[j]);
                            dTotal += tempD;
                            This.distances[i].push(tempD);
                        }
                        This.distancesAvg.push(dTotal/This.distances[i].length);
                    }
                    //get the nearst
                    var tCount = 0;
                    This.clusters = {};
                    for(var i=0; i<This.sample.length; i +=1 ){
                        This.clusters[i] = {};
                        for(var j=0; j<This.distances[i].length; j+=1){
                            if(This.distances[i][j]<this.distancesAvg[i]){
                                //if 2 is in the 1 clustr don't add 1 to the 2 clustr
                                if(!(This.clusters[j] && This.clusters[j][i]))
                                    This.clusters[i][j] = 1;
                            }
                        }
                        if(Object.keys(This.clusters[i]).length <= 1)
                            delete This.clusters[i];
                        
                    }
                    console.log(Object.keys(This.clusters).length);
                    console.log(This.clusters);
                    
                }
                //get top 10 form comments table
                
                $webServicesFactory.get(
                    $scope.categories[$scope.selectedCategory].commentsURL+".json",
                    {},
                    {orderBy: '"$key"', limitToFirst: commentLimit}
                ).then(
                    function(response) {
                        $scope.comments = response;
                        comments = response;
                        
                        //save to underreview
                        $webServicesFactory.patch(
                            $scope.categories[$scope.selectedCategory].underreviewURL+".json",
                            {},
                            comments
                        ).then(
                            function (response) {
                                var deletedCount = 0;
                                //removing from comments
                                for (var id in response) {
                                    $webServicesFactory.delete(
                                        $scope.categories[$scope.selectedCategory].commentsURL+"/"+ id +".json"
                                    ).then(
                                        function (response) {
                                            deletedCount += 1;
                                            if(deletedCount == commentLimit){
                                                console.info("Ready To Sample.");
                                                $scope.loading = false;
                                            }
                                        }
                                    );
                                }//end of removing from comments
                                
                            }
                        );//end of save to underreview
                        
                    }
                );//end of getting top 10
            };
            $scope.postOpinion = function (id) {
                $scope.loading = true;
                if(!$scope.comments[id].sentiment)
                    $scope.comments[id].sentiment = 6;
                
                $scope.comments[id].message = $scope.cleanText($scope.comments[id].message);
                
                var data = {};
                data[id] = $scope.comments[id];
                
                console.log(data);

                $webServicesFactory.patch(
                    $scope.categories[$scope.selectedCategory].opinionsURL+".json",
                    {},
                    data
                ).then(
                    function (response) {
                        console.info(response);
                        $webServicesFactory.delete(
                            $scope.categories[$scope.selectedCategory].underreviewURL+"/"+id+".json"
                        ).then(
                            function(response) {
                                delete $scope.comments[id];
                                $scope.loading = false;
                            }
                        );
                    }
                );
            };
            $scope.discardComment = function(id){
                $scope.loading = true;


                $webServicesFactory.delete(
                    $scope.categories[$scope.selectedCategory].underreviewURL+"/"+id+".json"
                ).then(
                    function(response) {
                        console.info(response);
                        delete $scope.comments[id];
                        $scope.loading = false;

                    }
                );

            };

            $scope.setCategory=function (value) {
                if(value == "product"){
                    $scope.categories[$scope.selectedCategory] = $scope.product;
                }
                else {
                    $scope.categories[$scope.selectedCategory] = $scope.people;
                }
            };

            $scope.setFeeling=function (value, id) {
                $scope.comments[id].sentiment = value;
            };
            $scope.printComment = function (index) {
                console.info('Comment : ' + $scope.comments[index].message + ' Class : ' + $scope.comments[index].sentiment);
            };
            /////////////////////////////////////////////////
            $scope.setQuery = function (query) {
                query = query.toLowerCase();

                var tempComments = [];
                var str = "";
                for(var i=0; i<$scope.comments.length; i+=1){

                    str = $scope.comments[i].message.toLowerCase().replace(/[^a-z ]/g, "");

                    if(str.split(' ').indexOf(query) != -1)
                        tempComments.push($scope.comments[i])
                }

                $scope.comments = tempComments;
                $scope.query = "";
                console.info('Filtered by "'+query+'", result: '+$scope.comments.length+' comment');
            };
            $scope.getSentiment = function () {
                $scope.overallSentiment = {
                    posCount:0,
                    negCount: 0,
                    total: $scope.commentsLimit
                };

                var words = [];
                for(var comment=0; comment<$scope.comments.length; comment+=1){
                    words = $scope.comments[comment].message.toLowerCase().replace(/[^a-z ]/g, "").split(' ');

                    $scope.comments[comment].pos = 0;
                    $scope.comments[comment].neg = 0;
                    for(var word=0; word<words.length; word+=1){
                        $scope.comments[comment].pos += ((compassticSentiWord[words[word]])? compassticSentiWord[words[word]].avgPos:0);
                        $scope.comments[comment].neg += ((compassticSentiWord[words[word]])? compassticSentiWord[words[word]].avgNeg:0);
                    }

                    $scope.comments[comment].pos = $scope.comments[comment].pos.toFixed(3);
                    $scope.comments[comment].neg = $scope.comments[comment].neg.toFixed(3);


                    if($scope.comments[comment].pos>$scope.comments[comment].neg){
                        $scope.comments[comment].sentiment = 'positive';
                        $scope.overallSentiment.posCount += 1;
                    }
                    else{
                        $scope.comments[comment].sentiment = 'negative';
                        $scope.overallSentiment.negCount += 1;
                    }


                }//end of for

                $scope.overallSentiment.positive = (($scope.overallSentiment.posCount/$scope.comments.length)*100).toFixed(2);
                $scope.overallSentiment.negative = (($scope.overallSentiment.negCount/$scope.comments.length)*100).toFixed(2);

                console.info("Got sentiment:");
                console.info($scope.overallSentiment);
            };
            ////////////////////////////////////////////////
            ////////////Classing////////////////////////////
            //builds Bag Of Words for this post
            $scope.buildPostBOW = function (comments) {
                console.info("Setting BOW.");
                var BOW = {};
                var commentTxt = "";
                for(var commentI=0; commentI<comments.length; commentI+=1){
                    commentTxt = comments[commentI].message.toLowerCase().replace(/[^\w]/gi, ' ').replace(/_/g, ' ').replace(/\r?\n|\r/g, ' ').replace(/ +(?= )/g,'').split(' ');
                    for(var wordI=0; wordI<commentTxt.length; wordI+=1){
                        if(!BOW[commentTxt[wordI]])
                            BOW[commentTxt[wordI]]=0;

                        BOW[commentTxt[wordI]] += 1;
                    }
                }
                console.info(BOW);

            };
            







        }
    ]
);
