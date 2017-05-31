angular.module('Compasstic.controllers').controller('landingCtrl', 
            ['$scope', '$ionicSlideBoxDelegate', '$pagesProvider', '$appDataProvider', '$catogriesProvider', '$stopWordsProvider', '$webServicesFactory', '$ionicLoading', '$globalFactory', '$state',
             function($scope, $ionicSlideBoxDelegate, $pagesProvider, $appDataProvider, $catogriesProvider, $stopWordsProvider, $webServicesFactory, $ionicLoading, $globalFactory, $state) {
                 $scope.isToAnimate = true;
                 $scope.comments = [];
                 $scope.commentsLimit = 400;
                 
                 $scope.queryWezardSlider = {
                    activeInputSlide: 0,
                    querySlideCount: 3,
                    lastSlideSubmit: false,
                    lockSlide: function () {
                        $ionicSlideBoxDelegate.enableSlide( false );
                    },
                    inputSlideChanged: function (index) {
                        $scope.activeInputSlide = index;
                    },
                    setInputSlide: function (state) {
                        if(state == 'next' && this.activeInputSlide < this.querySlideCount-1)
                            this.activeInputSlide += 1;
                        else if(state == 'previous' && this.activeInputSlide>0)
                            this.activeInputSlide -= 1;

                        if(this.activeInputSlide == this.querySlideCount-1){
                            if(this.lastSlideSubmit){
                                $scope.getSentiment.init();
                            }
                            this.lastSlideSubmit = true;
                        }
                        else
                            this.lastSlideSubmit = false;
                    }
                };
                 
                 $scope.pages = $pagesProvider;
                
                 $scope.queryData = {
                    topic: "",
                    category: "_",
                    source: "_"
                };
                 
                 $scope.getSentiment = {
                     commentsAfter: "",
                     _postsCount: 0,
                     isLoadingData: false,
                     features: {},
                     fTotal: 0,
                     SVMModel: {},
                     classesLabel: [
                         "Sadness",
                         "Anger",
                         "Disgust",
                         "Fear",
                         "Surprise",
                         "Happiness",
                         "Neutral"
                     ],
                     results: {
                         Sadness: 0,
                         Anger: 0,
                         Disgust: 0,
                         Fear: 0,
                         Surprise: 0,
                         Happiness: 0,
                         Neutral: 0,
                         Other: 0
                     },
                     init: function(){
                         var This = this;
                         This.commentsAfter = "";
                         This._postsCount = 0;
                         This.isLoadingData = false;
                         This.features = {};
                         This.fTotal = 0;
                         This.SVMModel = {};
                         
                         
                         if($scope.queryData.topic == "")
                             alert("Error: Please enter a topic to get its sentiment!");
                         else if($scope.queryData.category == "_")
                             alert("Error: Please select a category!");
                         else if($scope.queryData.source == "_")
                             alert("Error: Please select a source!");
                         else{
                             $ionicLoading.show();
                             
                             $webServicesFactory.get(
                                 $catogriesProvider[$scope.queryData.category].SVMModelURL+".json"
                             ).then(
                                 function (response){
                                     if(response){
                                         This.features = response.features;
                                         This.lastAccuracyRate = response.lastAccuracyRate;

                                         This.SVMModel.Sadness = new svmjs.SVM();
                                         This.SVMModel.Sadness.fromJSON(response.Sadness);

                                         This.SVMModel.Anger = new svmjs.SVM();
                                         This.SVMModel.Anger.fromJSON(response.Anger);

                                         This.SVMModel.Disgust = new svmjs.SVM();
                                         This.SVMModel.Disgust.fromJSON(response.Disgust);

                                         This.SVMModel.Fear = new svmjs.SVM();
                                         This.SVMModel.Fear.fromJSON(response.Fear);

                                         This.SVMModel.Surprise = new svmjs.SVM();
                                         This.SVMModel.Surprise.fromJSON(response.Surprise);

                                         This.SVMModel.Happiness = new svmjs.SVM();
                                         This.SVMModel.Happiness.fromJSON(response.Happiness);

                                         This.SVMModel.Neutral = new svmjs.SVM();
                                         This.SVMModel.Neutral.fromJSON(response.Neutral);
                                         
                                         console.info("Got SVM model data, & "+ Object.keys(This.features).length+" feature.");
                                         $scope.getSentiment.getFBToken();
                                     }
                                     else{
                                         alert("No available "+ $scope.queryData.category+ "model, try another category.");
                                         $ionicLoading.hide();
                                     }
                                 }
                             );
                         }
                     },
                     getFBToken: function(){
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
                                 $scope.getSentiment.getPosts();
                             }
                         );
                     },
                     getPosts: function(){
                         
                         $webServicesFactory.get("https://graph.facebook.com/"+$scope.queryData.source+"/posts", {}, {
                             access_token: $scope.accessToken,
                             limit: 100
                         }).then(
                             function (response) {
                                 console.info("Got "+response.data.length+" post.");
                                 $scope.posts = response.data;
                                 $scope.getSentiment.filterPosts();
                             }
                         );
                     },
                     filterPosts: function(){
                         var posts = $scope.posts;
                         $scope.posts = {};
                         
                         for(var i=0; i<posts.length; i+=1){
                             if(posts[i].message && posts[i].message.toLowerCase().indexOf($scope.queryData.topic.toLowerCase())!== -1)
                                 $scope.posts[posts[i].id] = posts[i];
                         }
                         console.info("Found "+Object.keys($scope.posts).length+" posts about "+$scope.queryData.topic+".");
                         if(Object.keys($scope.posts).length == 0){
                             alert("Found no posts about "+$scope.queryData.topic+".");
                             $ionicLoading.hide();
                         }
                         
                         for(var post in $scope.posts)
                            $scope.getSentiment.getComments($scope.posts[post]);
                     },
                     getComments: function(post){
                         var This = this;
                         $webServicesFactory.get("https://graph.facebook.com/"+post.id, {}, {
                             fields: "comments.limit("+$scope.commentsLimit+")"+this.commentsAfter,
                             access_token: $scope.accessToken
                         }).then(
                             function (response) {
                                 if($scope.comments.length<1000){
                                     response =  response.comments;
                                     $scope.comments = $scope.comments.concat(response.data);

                                     if (response.paging.next) {
                                         This.commentsAfter = '.after('+response.paging.cursors.after+')';
                                         This.getComments($scope.posts[$scope.queryData.source+"_"+response.data[0].id.split('_')[0]]);
                                     }
                                     else{
                                         This._postsCount += 1;
                                         if(This._postsCount == Object.keys($scope.posts).length){
                                             console.info("Got " + $scope.comments.length + " comments.");
                                             //This.loadData();
                                         }
                                     }
                                 }else{
                                     if(!This.isLoadingData){
                                         console.info("Got " + $scope.comments.length + " comments.");
                                         This.isLoadingData = true;
                                         This.loadData();
                                     }
                                 }
                             }
                         );
                     },
                     loadData: function(){
                         var This = this;
                         This.commentBOW = {};
                         var commentTxt = "";
                         
                         /*//filling bow from comments
                         for(var c in $scope.comments){
                             tempOpinion = {};
                             commentTxt = cleanText($scope.comments[c].message).split(' ');
                             for(var w=0; w<commentTxt.length; w+=1){
                                 if(!$stopWordsProvider[commentTxt[w]]) {
                                     if (!This.commentBOW[commentTxt[w]])
                                         This.commentBOW[commentTxt[w]] = 0;
                                     
                                     This.commentBOW[commentTxt[w]] += 1;
                                 }
                             }
                             delete This.commentBOW[""];
                         }
                         console.info("Bag Of Words has "+Object.keys(This.commentBOW).length+" word.");
                         
                         //
                         //selecting featuers
                         var features = [];
                         var freqAverage = 0;
                         var freqTotal = 0;
                         //bow obj to features array & average
                         for(var word in This.commentBOW) {
                             features.push({word: word, freq: This.commentBOW[word]});
                             freqTotal += This.commentBOW[word];
                         }
                         freqAverage = freqTotal/features.length;
                         
                         console.info("Found features average freq = "+freqAverage);
                         
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
                         console.info("Got "+features.length+" feature in total.");
                         //remove what is below average
                         for(var i =0; i<features.length; i+=1)
                             if(features[i].freq>freqAverage){
                                 This.features[features[i].word]=i;
                                 This.fTotal+=features[i].freq;
                             }
                         
                         console.info("Selected "+Object.keys(This.features).length+" feature.");*/
                         
                         
                         //
                         //
                         //comments to objects
                         This.data = [];
                         This.labels = [];
                         var tempOpinion, opinionWorth;
                         for(var c in $scope.comments){
                             opinionWorth = 0;
                             tempOpinion = [];
                             for(var i=0; i< Object.keys(This.features).length; i++)
                                 tempOpinion.push(0);
                             commentTxt = cleanText($scope.comments[c].message).split(' ');
                             for(var w=0; w<commentTxt.length; w+=1) {
                                 if (!$stopWordsProvider[commentTxt[w]] && This.features[commentTxt[w]]) {
                                     tempOpinion[This.features[commentTxt[w]]] +=1 ;
                                     opinionWorth += 1;
                                 }
                             }
                             
                             if(opinionWorth>0){
                                 This.data.push(tempOpinion);
                                 This.labels.push([]);
                             }
                         }
                         
                         console.info("Ended up with "+This.data.length+ " comment.");
                         $scope.getSentiment.classData();
                     },
                     classData: function(){
                         var This = this;
                         var trueOtherChecker = 0;
                         
                         for(var dataI = 0; dataI<This.data.length; dataI++){
                             trueOtherChecker = 0;
                             for(var labelI=0; labelI<This.classesLabel.length; labelI++){
                                if(This.SVMModel[This.classesLabel[labelI]].predict([This.data[dataI]])[0] == 1){
                                    This.labels[dataI].push(labelI);
                                    This.results[This.classesLabel[labelI]] +=1;
                                    trueOtherChecker += 1;
                                }
                             }
                             if(trueOtherChecker == 0){
                                 This.labels[dataI].push(-1);
                                 This.results["Other"] +=1;
                             }
                         }
                         
                         
                         
                         if(JSON.parse(window.localStorage.getItem("queryLog"))){
                            var tempLog = (JSON.parse(window.localStorage.getItem("queryLog")))? JSON.parse(window.localStorage.getItem("queryLog")): [];
                             
                             tempLog.push(
                                {
                                    queryData: $scope.queryData,
                                    queryReuslt: This.results,
                                    queryDate: new Date(),
                                    accuracyRate: This.lastAccuracyRate
                                }
                            );
                            
                        }else{
                            var tempLog = [];
                            tempLog.push(
                                {
                                    queryData: $scope.queryData,
                                    queryReuslt: This.results,
                                    queryDate: new Date(),
                                    accuracyRate: This.lastAccuracyRate
                                }
                            );
                        }
                         
                         window.localStorage.setItem("queryLog", JSON.stringify(tempLog));

                         
                         
                         $globalFactory.queryReuslt = This.results;
                         $globalFactory.queryData = $scope.queryData;
                         $globalFactory.accuracyRate = This.lastAccuracyRate;
                         $ionicLoading.hide();
                         $state.go("app.queryReuslt");
                     }
                 };
                 
             
                 
                 
                 
                 function getRandomNumber(min, max) {
                     return Math.floor(Math.random() * (max - min)) + min;
                 }
                 function cleanText(str) {
                     return str.toLowerCase().replace(/[^a-zA-Z0-9']/gi, ' ').replace(/_/g, ' ').replace(/\r?\n|\r/g, ' ').replace(/ +(?= )/g,'');
                 }
                 function isNumber(n) {
                     return !isNaN(parseFloat(n)) && isFinite(n);
                 }
                 
                 
             }
            ]
);
angular.module('Compasstic.controllers').controller('AppCtrl', 
                                                    ['$scope', '$ionicLoading', '$window', '$location',
    function($scope, $ionicLoading, $window, $location) {
        $scope.clearHistory = function(){
            $ionicLoading.show();
            window.localStorage.removeItem("queryLog");
            $ionicLoading.hide();
            
            $window.location.reload().then(
                function success(){
                    $location.path('/landing');
                },
                function error(error) {}
            );
        }
}
]);
angular.module('Compasstic.controllers').controller('queryReusltCtrl',
    ['$scope', '$globalFactory', '$pagesProvider',
    function($scope, $globalFactory, $pagesProvider) {
        $scope.pages = $pagesProvider;
        $scope.queryData = $globalFactory.queryData;
        $scope.queryData.topic = $scope.queryData.topic.toUpperCase();
        $scope.trust = $globalFactory.accuracyRate;
        
        var chart;
        var legend
        var chartData = [];
        for(var feeling in $globalFactory.queryReuslt){
            chartData.push(
                {
                    feeling: feeling,
                    comments: $globalFactory.queryReuslt[feeling]
                }
            );
        }
        
        
        // PIE CHART
        chart = new AmCharts.AmPieChart();
        chart.dataProvider = chartData;
        chart.titleField = "feeling";
        chart.valueField = "comments";
        chart.outlineColor = "#FFFFFF";
        chart.outlineAlpha = 0.8;
        chart.outlineThickness = 2;
        chart.labelRadius = -30;
        chart.labelText = "[[percents]]%";
        
        legend = new AmCharts.AmLegend();
        legend.align = "center";
        legend.markerType = "circle";
        chart.balloonText = "[[title]]<br><span style='font-size:14px'><b>[[value]]</b> ([[percents]]%)</span>";
        chart.addLegend(legend);
        
        // WRITE
        chart.write("chartdiv");
        
    }
]);

angular.module('Compasstic.controllers').controller('historyCtrl',
    ['$scope', '$globalFactory', '$pagesProvider', '$state',
    function($scope, $globalFactory, $pagesProvider, $state) {
        $scope.pages = $pagesProvider;
        $scope.logs = JSON.parse(window.localStorage.getItem("queryLog"));
        
        $scope.openInReuslt = function(log){
            $globalFactory.queryReuslt = log.queryReuslt;
            $globalFactory.queryData = log.queryData;
            $state.go("app.queryReuslt");
        }
    }
]);
angular.module('Compasstic.controllers').controller('PlaylistsCtrl', ['$scope',
    function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
}
]);