angular.module('compasstic.controllers').controller('prototype1Ctrl',
    ['$scope', '$pagesProvider', '$appDataProvider', '$stopWordsProvider', '$q', '$window', '$webServicesFactory',
        function ($scope, $pagesProvider, $appDataProvider, $stopWordsProvider, $q, $window, $webServicesFactory) {
            $scope.loading = false;
            $scope.pages = $pagesProvider;
            $scope.selectedCategory = "_";
            $scope.selectedPage = "_";
            $scope.selectedTopic = "";
            $scope.statue = "ready";
            $scope.preSample = {};
            $scope.sample = {};
            $scope.BOWReady = false;
            $scope.readyToClass = false;
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
            $scope.commentsLimit = 400;

            function isNumber(n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            }
            function CompassticVector() {
                var This = this;
                this.multiply = function (A, B) {
                    if(Object.keys(A).length != Object.keys(A).length)
                        throw "Can't multiply vectors of different sizes!";
                    var C = {};
                    for(var key in A)
                        C[key] = A[key] * B[key];
                    
                    return C;
                };
                this.dotProduct = function(A, B){
                    //A should be the obj
                    var C = 0;
                    for(var key in A){
                        if(B[key]){
                            C += A[key]*B[key];
                        }
                    }
                    return C;
                };
                this.magnitude = function(A){
                    var C = 0;
                    for(var a in A)
                        C += Math.pow(A[a],2);
                                        
                    return(Math.sqrt(C));
                };
                this.subtract = function(A, n){
                    for(var key in A)
                        A[key] = A[key] - n;
                    return A;
                };
                this.subtractV = function(A, B){
                    var C = {};
                    for(var key in A){
                        if(B[key])
                            C[key]= A[key]-B[key];
                        else
                            C[key]= A[key];
                    }
                    for(var key in B){
                        if(!A[key])
                            C[key]= 0-B[key];
                    }
                    return C;
                };
            }
            var vector = new CompassticVector();
            $scope.cleanText = function (str) {
                return str.toLowerCase().replace(/[^a-zA-Z0-9']/gi, ' ').replace(/_/g, ' ').replace(/\r?\n|\r/g, ' ').replace(/ +(?= )/g,'');
            }
            $scope.getDistance = function (A, B) {
                var result = 0;
                for(var a in A){
                    if(B[a])
                        result+= Math.pow((A[a]-B[a]), 2);
                    else
                        result+= Math.pow((A[a]-0), 2);
                }
                for(var b in B){
                    if(!A[b] && b!="senti")
                        result+= Math.pow((0-B[b]), 2);
                }

                return Math.sqrt(result);
            };

            
            function getFBToken() {
                $scope.loading = true;
                $webServicesFactory.get("https://graph.facebook.com/oauth/access_token", {},
                    {
                        client_id: $appDataProvider.FB.ID,
                        client_secret: $appDataProvider.FB.secret,
                        grant_type: $appDataProvider.FB.grantTypes
                    }
                ).then(
                    function success (response) {
                        $scope.loading = false;
                        $scope.accessToken = response.access_token;
                        console.info("Got access token.");
                    },
                    function error(error){
                        $scope.loading = false;
                        console.error("Failed to get Facebook access token, refresh page to try again.");
                    }
                );
            }
            getFBToken();
            $scope.categoryChanged = function(){
                $scope.setPreSample();
            };
            $scope.setPreSample = function () {
                $scope.loading = true;
                $webServicesFactory.get($scope.categories[$scope.selectedCategory].opinionsURL+".json", {}, {}).then(
                    function success(response) {
                        $scope.loading = false;
                        console.info("Got: "+Object.keys(response).length+" comment.");
                        $scope.preSample = response;
                        $scope.comments = [];
                    },
                    function error(error){
                        $scope.loading = false;
                    }
                );
            };


            function SVM() {
                var This = this;
                this.sample = {};
                this.features = {};
                this.fTotal = 0;
                this.maxFeatureValue = 0;
                this.minFeatureValue = 0;
                this.optDict = {};
                this.optChoice = "_";
                this.w = {};
                this.b = 0;
                this.classesLabel = [
                    "Sadness",
                    "Anger",
                    "Disgust",
                    "Fear",
                    "Surprise",
                    "Happiness",
                    "Neutral"
                ];
                this.currentPredict = 1;

                this.loadSample = function(preSample){
                    This.commentBOW = {};
                    var commentTxt = "";

                    //filling bow from comments
                    for(var c in preSample){
                        tempOpinion = {};
                        commentTxt = $scope.cleanText(preSample[c].message).split(' ');
                        for(var w=0; w<commentTxt.length; w+=1){

                            if(!$stopWordsProvider[commentTxt[w]]) {
                                if (!This.commentBOW[commentTxt[w]])
                                    This.commentBOW[commentTxt[w]] = 0;

                                This.commentBOW[commentTxt[w]] += 1;
                            }
                        }
                        delete This.commentBOW[""];
                    }
                    //
                    //selecting featuers
                    var features = [];
                    var freqAverage = 0;
                    var freqTotal = 0;
                    //obj to array & average
                    for(var word in This.commentBOW) {
                        features.push({word: word, freq: This.commentBOW[word]});
                        freqTotal += This.commentBOW[word];
                    }
                    freqAverage = freqTotal/features.length;
                    //set minFeatureValue
                    This.minFeatureValue = 0;

                    console.info("Found SVM features freq average = "+freqAverage);
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
                    console.info("Selected "+Object.keys(This.features).length+" feature.");
                    
                    
                    
                    //
                    //
                    //comments to objects
                    This.sample = [];
                    This.testSample = [];
                    This.data = [];
                    This.labels = [];
                    This.testLabels = [];
                    This.dataLabels = [];
                    var tempOpinion, opinionWorth;
                    for(var c in preSample){
                        opinionWorth = 0;
                        tempOpinion =  Array(Object.keys(This.features).length).fill(0);
                        commentTxt = $scope.cleanText(preSample[c].message).split(' ');
                        for(var w=0; w<commentTxt.length; w+=1) {
                            if (!$stopWordsProvider[commentTxt[w]] && This.features[commentTxt[w]]) {
                                tempOpinion[This.features[commentTxt[w]]] +=1 ;
                                opinionWorth += 1;
                            }
                        }
                        
                        if(opinionWorth>0){
                            This.data.push(tempOpinion);
                            This.dataLabels.push(preSample[c].sentiment);
                        }
                    }
                    
                    
                    This.sample = This.data.slice(0, (This.data.length/100*70))//70%
                    This.testSample = This.data.slice(This.data.length/100*70, This.data.length)//30%
                    This.labels = This.dataLabels.slice(0, (This.dataLabels.length/100*70))//70%
                    This.testLabels = This.dataLabels.slice(This.dataLabels.length/100*70, This.dataLabels.length)//30%
                };
                this.fit = function(){
                    $scope.loading = true;
                    This.libSVM = {};
                    var totalCorrect = 0;
                    for(var s =0;s<This.classesLabel.length;s++){
                        //creating new object for each feeling
                        This.libSVM[This.classesLabel[s]] = new svmjs.SVM();
                        This.libSVM[This.classesLabel[s]].labels = This.labels.slice();
                        This.libSVM[This.classesLabel[s]].count = 0;
                        // labeling each record to relative feeling
                        for(var l=0; l<This.labels.length; l+=1)
                        {
                            This.libSVM[This.classesLabel[s]].labels[l] = (This.labels[l]==s)? 1:-1;
                            This.libSVM[This.classesLabel[s]].count += (This.labels[l]==s)? 1 : 0;
                        }
                        console.info("Have "+This.libSVM[This.classesLabel[s]].count+ " "+This.classesLabel[s]);
                        // training each feeling
                        This.libSVM[This.classesLabel[s]].train(
                            This.sample,
                            This.libSVM[This.classesLabel[s]].labels, 
                            {
                                C: 50,
                                kernel: 'linear'
                            }
                        );


                        This.predictOutput = This.libSVM[This.classesLabel[s]].predict(This.sample);
                        var totalClassCorrect = 0;
                        for(var i =0; i<This.labels.length; i++){
                            if(This.libSVM[This.classesLabel[s]].labels[i]==This.predictOutput[i])
                                totalClassCorrect += 1;
                            if(This.predictOutput[i] != -1 && This.libSVM[This.classesLabel[s]].labels[i]==This.predictOutput[i])
                                totalCorrect += 1;
                                
                        }
                        console.info(This.classesLabel[s]+": "+"Traind with: "+totalClassCorrect/This.libSVM[This.classesLabel[s]].labels.length *100+"% accuracy.");
                    }
                        console.info("Overall: Traind with: "+totalCorrect/This.labels.length *100+"% accuracy.");

                    // console.info(This.labels);
                    //console.info(This.libSVM);


                    $scope.loading = false;
                };
                this.predict = function(comment){
                    //var formattedComment = [];
                    var tempOpinion = Array(Object.keys(This.features).length).fill(0), opinionWorth = 0;
                    
                    commentTxt = $scope.cleanText(comment.message).split(' ');
                    for(var w=0; w<commentTxt.length; w+=1) {
                        if (!$stopWordsProvider[commentTxt[w]] && This.features[commentTxt[w]]) {
                            tempOpinion[This.features[commentTxt[w]]] +=1 ;
                            opinionWorth += 1;
                        }
                    }


                    if(opinionWorth>0){
                        comment.class="";
                        for(var i = 0; i<This.classesLabel.length;i++){
                            if(This.libSVM[This.classesLabel[i]].predict([comment])[0] == 1)
                                comment.class += This.classesLabel[i] +" ";
                        }
                        if(comment.class == ""){
                            comment.class = "Other";
                        }
                    }

                    else{
                        console.warn("Comment worth: 0 !");
                        comment.class = "Indeterminable";
                    }
                    return comment.class;
                };
                this.predict = function(comment, obj){
 
                    var commentClass="";
                    for(var i = 0; i<This.classesLabel.length;i++){
                        if(This.libSVM[This.classesLabel[i]].predict([comment])[0] == 1)
                            commentClass += i+" ";
                    }
                    if(commentClass == ""){
                        commentClass = "999";
                    }

                    return commentClass;
                };
                this.start = function () {
                    This.loadSample($scope.preSample);
                    This.fit();
                    //$scope.comments = $scope.preSample;
                };
                this.test = function(){
                    var totalCorrect = 0;
                    var tempPredict = [];
                    for(var i=0; i<This.testSample.length; i++){
                        tempPredict = This.predict(This.testSample[i], true).split(' ');
                        for(var j=0; j<tempPredict.length; j++){
                            if(Math.abs(tempPredict[j] - This.testLabels[i]) == 0)
                                totalCorrect += 1;
                        }
                    }
                    
                    console.log("Test set accuracy: "+totalCorrect/This.testSample.length*100+"%");

                    
                    
                    
                    
                    /*if($scope.categories[$scope.selectedCategory]){
                        $scope.loading = true;
                        $webServicesFactory.get($scope.categories[$scope.selectedCategory].commentsURL+".json",
                            {},
                            {orderBy: '"$key"', limitToFirst: 100}
                        ).then(
                            function success(response){
                                $scope.loading = false;
                                for(var c in response){
                                    This.predict(response[c]);
                                }
                                
                                
                            }, function error(error){
                                $scope.loading = false;
                                alert("Please make sure you selected a category and have stable internet connection.");
                            }
                        );
                    }
                    else
                        alert("Please make sure you selected a category and have stable internet connection.");*/
                };


            }
            $scope.svm = new SVM();
        }
    ]
);