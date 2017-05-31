angular.module('Compasstic.factories').factory('$webServicesFactory',
    ['$q', '$http',
        function ($q, $http) {
            return{
                get: function (url, headers, params) {
                    var deferred = $q.defer();
                    if(typeof params === 'undefined')
                        params = {};
                    if(typeof headers === 'undefined')
                        headers = {};


                    $http(
                        {
                            url: url,
                            method: 'get',
                            headers: headers,
                            params: params
                        }
                    ).then(
                        function success(response) {

                            deferred.resolve(response.data);
                        },
                        function error(error) {
                            alert("Please check your internet connection");
                            console.error(error.data);
                            deferred.reject(error);
                        }
                    );


                    return deferred.promise;
                },//end of get
                post: function (url, headers, data) {
                    var deferred = $q.defer();
                    if(typeof params === 'undefined')
                        params = {};
                    if(typeof headers === 'undefined')
                        headers = {};


                    $http(
                        {
                            url: url,
                            method: 'post',
                            headers: headers,
                            data: data
                        }
                    ).then(
                        function success(response) {

                            deferred.resolve(response.data);
                        },
                        function error(error) {
                            alert("Please check your internet connection!")
                            console.error(error.data);
                            deferred.reject(error);
                        }
                    );


                    return deferred.promise;
                },
                put: function (url, headers, data) {
                    var deferred = $q.defer();
                    if(typeof params === 'undefined')
                        params = {};
                    if(typeof headers === 'undefined')
                        headers = {};


                    $http(
                        {
                            url: url,
                            method: 'put',
                            headers: headers,
                            data: data
                        }
                    ).then(
                        function success(response) {

                            deferred.resolve(response.data);
                        },
                        function error(error) {
                            alert("Please check your internet connection!")
                            console.error(error.data);
                            deferred.reject(error);
                        }
                    );


                    return deferred.promise;
                },
                patch: function (url, headers, data) {
                    var deferred = $q.defer();
                    if(typeof params === 'undefined')
                        params = {};
                    if(typeof headers === 'undefined')
                        headers = {};

                    $http(
                        {
                            url: url,
                            method: 'patch',
                            headers: headers,
                            data: data
                        }
                    ).then(
                        function success(response) {

                            deferred.resolve(response.data);
                        },
                        function error(error) {
                            alert("Please check your internet connection!")
                            console.error(error.data);
                            deferred.reject(error);
                        }
                    );


                    return deferred.promise;
                },
                delete: function (url, headers, data) {
                    var deferred = $q.defer();
                    if(typeof params === 'undefined')
                        params = {};
                    if(typeof headers === 'undefined')
                        headers = {};


                    $http(
                        {
                            url: url,
                            method: 'delete',
                            headers: headers,
                            data: data
                        }
                    ).then(
                        function success(response) {

                            deferred.resolve(response.data);
                        },
                        function error(error) {
                            alert("Please check your internet connection!")
                            console.error(error.data);
                            deferred.reject(error);
                        }
                    );


                    return deferred.promise;
                }
            };
        }
    ]
);

angular.module('Compasstic.factories').factory('$globalFactory',
  [
    function () {
      return {

      };
    }
  ]
);