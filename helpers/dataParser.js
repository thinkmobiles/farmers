var request = require("request");
var moment = require("moment");
var async = require('async');
var PlantsHelper = require('../helpers/plants');
var CONST = require('../constants/constants');
var mailer = require('../helpers/mailer');
var $ = require('../public/js/libs/jquery/dist/jquery.js');
var Iconv = require('iconv-lite');
var http = require('http');
var fs = require('fs');
var csv = require('csv');

module.exports = function (db) {
    var Plant = db.model('Plant');
    var Crop = db.model(CONST.MODELS.CROP);
    var Price = db.model(CONST.MODELS.PRICE);
    var MonthAveragePrice = db.model(CONST.MODELS.MONTH_AVERAGE_PRICE);
    var Notification = db.model(CONST.MODELS.NOTIFICATION);

    var ParsedBody = db.model(CONST.MODELS.PARSED_BODY);

    var plantsHelper = new PlantsHelper(db);

    function getDateByUrl(url, cb) {
        request(url, function (err, response, body) {
            var parsedBody = new ParsedBody({body: body});

            parsedBody.save();

            if (!body) {
                return cb(new Error('body is empty (check your connection to internet)'));
            }
            if ((/</.test(body))) {
                console.log('!!!! recieved Body has <DOCTYPE>   !!!!');
                console.log(body);

            } else {
                cb(err, JSON.parse(body));
            }
        });
    }

    function getPlants(cb) {
        Plant.find({}).exec(cb);
    }

    function getTransformedDateObject(date) {
        date = date.split('/');

        if (date[2].length === 2) {
            date[2] = 20 + date[2];
        }
        if (date[1].length === 1) {
            date[1] = 0 + date[1];
        }
        if (date[0].length === 1) {
            date[0] = 0 + date[0];
        }
        //console.log(date[2] + '-' + date[1] + '-' + date[0] + 'T12:00:00.000Z');

        return new Date(date[2] + '-' + date[1] + '-' + date[0] + 'T12:00:00.000Z');
    }

    function getTransformedDateObjectForWsDayli(date) {
        date = date.split('/');

        if (date[2].length === 2) {
            date[2] = 20 + date[2];
        }
        if (date[1].length === 1) {
            date[1] = 0 + date[1];
        }
        if (date[0].length === 1) {
            date[0] = 0 + date[0];
        }
        //console.log(date[2] + '-' + date[0] + '-' + date[1] + 'T12:00:00.000Z');

        return new Date(date[2] + '-' + date[0] + '-' + date[1] + 'T12:00:00.000Z');
    }

    function getTransformedDateObjectForMonthWs(date) {
        date = date.split('/');

        if (!date[2]) {
            date[2] = '01';
        }
        if (date[1].length === 1) {
            date[1] = 0 + date[1];
        }
        if (date[0].length === 1) {
            date[0] = 0 + date[0];
        }
        //console.log(date[2] + '-' + date[1] + '-' + date[0] + 'T12:00:00.000Z');

        return new Date(date[0] + '-' + date[1] + '-' + date[2] + 'T12:00:00.000Z');
    }

    //function savePlantPrice(plant, newPlantPriceObj, cb) {
    //    var maxPrice = parseFloat(newPlantPriceObj.maxPrice) || 0;
    //    var minPrice = parseFloat(newPlantPriceObj.minPrice) || 0;
    //    var date = getTransformedDateObject(newPlantPriceObj.date);
    //    var avgPrice = plantsHelper.getAvgPrice(minPrice, maxPrice);
    //    var saveOptions;
    //
    //    saveOptions = {
    //        _plant: plant._id,
    //        source: newPlantPriceObj.url,
    //        minPrice: minPrice,
    //        maxPrice: maxPrice,
    //        avgPrice: avgPrice,
    //
    //        date: date,
    //        year: moment(date).year(),
    //        dayOfYear: moment(date).dayOfYear()
    //    };
    //
    //    Price.create(saveOptions, function (err, res) {
    //        cb(err)
    //    });
    //}

    //function createNewPlant(newPlantPriceObj, cb) {
    //    var saveOptions;
    //
    //    saveOptions = {
    //        englishName: "No Name",
    //        jewishNames: [newPlantPriceObj.jewishName]
    //    };
    //
    //    if (newPlantPriceObj.isNewPlant) {
    //        saveOptions.isNewPlant = true;
    //    }
    //
    //    Plant.create(saveOptions, function (err, plant) {
    //        if (err) {
    //            cb(err);
    //        } else {
    //            savePlantPrice(plant, newPlantPriceObj, cb)
    //        }
    //    });
    //}

    function prepareData(apiUrl, cb) {
        async.parallel([
            function (cb) {
                getDateByUrl(apiUrl, cb);
            },
            function (cb) {
                getPlants(cb)
            }
        ], function (err, results) {
            if (err) {
                cb(err);
            } else {
                cb(null, {
                    newPlantsPrice: results[0],
                    plants: results[1]
                });
            }
        });
    }

    //function findPlantAndSavePrice(plants, newPlantPrice, cb) {
    //    var plantFound = false;
    //    async.each(plants, function (plant, cb) {
    //        if (plant.jewishNames.indexOf(newPlantPrice.jewishName) !== -1) {
    //            savePlantPrice(plant, newPlantPrice, cb);
    //            plantFound = true;
    //        } else {
    //            cb();
    //        }
    //    }, function (err, res) {
    //        if (err) {
    //            cb(err);
    //        } else {
    //            if (!plantFound) {
    //                newPlantPrice.isNewPlant = true;
    //                createNewPlant(newPlantPrice, cb);
    //            } else {
    //                cb();
    //            }
    //        }
    //    });
    //}

    //function checkIfPricesSynced(source, cb) {
    //    var date = new Date();
    //
    //    Price
    //        .findOne({
    //            year: moment(date).year(),
    //            dayOfYear: moment(date).dayOfYear(),
    //            source: source
    //        })
    //        .exec(function (err, price) {
    //            if (err) {
    //                cb(err);
    //            } else {
    //                if (price) {
    //                    cb(null, true);
    //                } else {
    //                    cb(null, false);
    //                }
    //            }
    //        });
    //}

    //function isTodayDate(dateString) {
    //
    //    var date = getTransformedDateObject(dateString);
    //    var todayDate = new Date();
    //
    //    return (moment(date).format('YYYY/MM/DD') === moment(todayDate).format('YYYY/MM/DD'));
    //}

    //this.syncPlantPrices = function (apiUrl, source, cb) {
    //    checkIfPricesSynced(source, function (err, isSynced) {
    //        if (err) {
    //            cb(err);
    //        } else {
    //            if (isSynced) {
    //                cb();
    //            } else {
    //                prepareData(apiUrl, function (err, resultObj) {
    //                    if (err) {
    //                        cb(err);
    //                    } else {
    //                        if (isTodayDate(resultObj.newPlantsPrice.results.priceDate[0].date)) {
    //                            async.each(resultObj.newPlantsPrice.results.prices, function (newPlantPrice, cb) {
    //                                newPlantPrice.date = resultObj.newPlantsPrice.results.priceDate[0].date;
    //                                findPlantAndSavePrice(resultObj.plants, newPlantPrice, cb);
    //                            }, cb);
    //                        } else {
    //                            cb();
    //                        }
    //                    }
    //                });
    //            }
    //        }
    //    });
    //};


    // process getting date is different for sites that is why need different function

    this.syncPlantCouncilCropPrices = function (cropList, cb) {
        var priceDate;
        var source;
        var tempArray = [];
        var resultPricesArray = [];
        var apiUrl = CONST.URL_APIS.PLANTS_URL.API_URL;
        var results;

        request(apiUrl, function (err, response, body) {
            var parsedBody = new ParsedBody({body: body});

            parsedBody.save();

            if (!body || response.statusCode === '404') {
                return cb('body is empty (check your connection to internet)');
            }

            if ((/</.test(body))) {
                console.log('!!!! recieved Body has <DOCTYPE>   !!!!');
                return cb('recieved Body has <DOCTYPE>');

            }
            results = JSON.parse(body);

            if (err || !results || !results.results.priceDate) {
                //console.log('error : ', err + ' ' +  !results + ' ' +  !results.results.priceDate);
                return cb(err + ' or now results');
            }

            priceDate =  getTransformedDateObject(results.results.priceDate[0].date);
            source =  results.results.priceDate[0].url;
            tempArray = results.results.prices;

            console.log('received price date: ', results.results.priceDate[0].date);
            console.log('received price transformed date: ', priceDate);
            console.log('received price url: ', source);


            // prepare received array, separate on excellent quality and class A quality
            for (var i = 0, len = tempArray.length - 1; i <= len; i++){
                if (tempArray[i].maxPrice) {
                    resultPricesArray.push(
                        {
                            price: tempArray[i].maxPrice,
                            name: tempArray[i].name,
                            url: source,
                            excellent: true
                        }
                    )
                }
                resultPricesArray.push(
                    {
                        price: tempArray[i].minPrice,
                        name: tempArray[i].name,
                        url: source
                    }
                )
            }
            checkPlantCouncilDataInDbAndWrite(priceDate, source, cropList, resultPricesArray, cb);

        });
    };

    this.syncWholeSaleCropPrices = function (cropList, cb) {
        var priceDate;
        var source;
        var tempArray = [];
        var resultPricesArray = [];
        var parallelTasks = [];
        var startTime = new Date();

        parallelTasks.push({
            url: CONST.URL_APIS.MOAG_URL.SOURCE_1,
            results: []
        });

        parallelTasks.push({
            url: CONST.URL_APIS.MOAG_URL.SOURCE_2,
            results: []
        });

        parallelTasks.push({
            url: CONST.URL_APIS.MOAG_URL.SOURCE_3,
            //url: 'http://www.prices.moag.gov.il/prices/citrrr_1.htm', // test bad link
            results: []
        });
        console.log('start time: ', startTime);

        //async.mapSeries(tasks, dataParser.parseWholesalesByUrl, function (err, result) { // spend time: 10498
        async.map(parallelTasks, parseWholesalesByUrl, function (err, result) { // spend time: 4558
            if (err) {
                return cb(err);
            }
            console.log('Spend time: ', new Date() - startTime);
            // prepare received array, separate on excellent quality and class A quality
            // resalt is array of results from 3 sites we need concat it

            resultPricesArray = [].concat(result[0] ? result[0] : [], result[1] ? result[1] : [], result[2] ? result[2] : [] );

            priceDate = getTransformedDateObject(resultPricesArray[0].date);
            source = resultPricesArray[0].url;

            console.log('received price date: ', resultPricesArray[0].date);
            console.log('received price transformed date: ', priceDate);
            console.log('Parsed items count: ', resultPricesArray.length);

            checkWholeSaleDataInDbAndWrite(priceDate, source, cropList, resultPricesArray, cb);

        });
    };

    this.getCropList = function (cb) {
        Crop
            .find({})
            .lean()
            .exec(cb);
    };

    getCropList = function (cb) {
        Crop
            .find({})
            .lean()
            .exec(cb);
    };

    function getAvgPrice (minPrice, maxPrice) {

        if ((minPrice === 0) || (maxPrice === 0)) {
            return ((minPrice === 0) ? maxPrice : minPrice);
        }
        return ((minPrice * 100 + maxPrice * 100) / 200);
    }


    function createNewCropNotification(model, callback) {
        var notification;
        var saveOptions = {
            newCropPriceId: model._id,
            type: 'newCrop',
            source: model.source,
            site: model.site,
            cropName: model.name
        };

        //TODO switch ON
        //mailer.sendEmailNotificationToAdmin('4Farmers. New crop detected ', 'Hello.<br>New crop was detected. Name:  ' + model.name + '<br>Source:  ' +   model.source + ' <br>Excelent class for Plant Council: ' + model.excellent);

        notification = new Notification(saveOptions);
        notification
            .save(function (err, model) {
                if (err) {
                    console.log('DB Notification err:' + err);

                    return callback('DB Notification err:' + err);
                }

                console.log('DB Create Notification, return CallBACK');
                callback();

            });
    }

    function checkPlantCouncilDataInDbAndWrite(priceDate, source, cropList, parsedData, cb) {
        var searchQuery = {
            date: priceDate,
            source: source
        };

        var cropLen = cropList.length - 1;

        Price
            .findOne(searchQuery)
            .lean()
            .exec(function (err, price) {
                if (err) {
                    return cb(err);
                }
                if (price) {
                    console.log('not need update');
                    return cb(null, true);
                }

                // eachSeries need only in check purpose
                async.eachSeries(parsedData, function (item, callback) {
                    var foundPosition = -1;
                    var price = parseFloat(item.price) || 0;
                    var saveOptions;
                    var nameOptimize = item.name.replace (/ /g,'');
                    var searchQualityFlag =  item.excellent ? 'מובחר' : 'סוג א';

                    for (var i = cropLen; i >= 0; i--) {
                        if ( cropList[i].pcNameOptimize.indexOf(nameOptimize) >= 0 && cropList[i].pcQuality.indexOf(searchQualityFlag) >= 0 && cropList[i].pcNameOptimize === nameOptimize) {
                            foundPosition = i;
                            i = -1;
                        }
                    }

                    saveOptions = {
                        source: item.url,
                        price: price,
                        date: priceDate,
                        name: item.name,
                        site: /moag/.test(item.url) ? CONST.WHOLE_SALE_MARKET : CONST.PLANT_COUNCIL,
                        year: moment(priceDate).year(),
                        month: moment(priceDate).month(),
                        dayOfYear: moment(priceDate).dayOfYear(),
                        excellent: !!item.excellent
                    };

                    if (foundPosition >= 0) {
                        saveOptions._crop = cropList[foundPosition]._id;
                        saveOptions.cropListName = cropList[foundPosition].displayName;
                        saveOptions.pcQuality = cropList[foundPosition].pcQuality;
                        saveOptions.wsQuality = cropList[foundPosition].wsQuality;
                        saveOptions.imported = cropList[foundPosition].imported;

                    } else {
                        console. log ('New crop detecdet: ', item.name);
                    }

                    price = new Price(saveOptions);
                    price
                        .save(function (err, model) {
                            if (err) {
                                return  callback('DB err:' + err);
                            }

                            if (foundPosition < 0) {
                                return createNewCropNotification (model.toJSON(), callback );
                            }

                            callback();
                        });
                }, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, false);
                });
            });
    };

    function checkWholeSaleDataInDbAndWrite(priceDate, source, cropList, parsedData, cb) {
        var searchQuery = {
            date: priceDate,
            source: source
        };

        var cropLen = cropList.length - 1;

        Price
            .findOne(searchQuery)
            .lean()
            .exec(function (err, price) {
                if (err) {
                    return cb(err);
                }

                if (price) {
                    console.log('not need update');
                    return cb(null, true);
                }

                // eachSeries need only in check purpose
                async.eachSeries(parsedData, function (item, callback) {
                    var foundPosition = -1;
                    var price = parseFloat(item.price) || 0;
                    var saveOptions;
                    var nameOptimize = item.name.replace (/ /g,'');

                    for (var i = cropLen; i >= 0; i--) {
                        if ( cropList[i].wsNameOptimize.indexOf(nameOptimize) >= 0 && cropList[i].wsNameOptimize === nameOptimize ) {
                            foundPosition = i;
                            i = -1;
                        }
                    }

                    saveOptions = {
                        source: item.url,
                        price: price,
                        date: priceDate,
                        name: item.name,
                        site: /moag/.test(item.url) ? CONST.WHOLE_SALE_MARKET : CONST.PLANT_COUNCIL,
                        year: moment(priceDate).year(),
                        month: moment(priceDate).month(),
                        dayOfYear: moment(priceDate).dayOfYear(),
                        excellent: !!item.excellent
                    };

                    if (foundPosition >= 0) {
                        saveOptions._crop = cropList[foundPosition]._id;
                        saveOptions.cropListName = cropList[foundPosition].displayName;
                        saveOptions.pcQuality = cropList[foundPosition].pcQuality;
                        saveOptions.wsQuality = cropList[foundPosition].wsQuality;
                        saveOptions.imported = cropList[foundPosition].imported;

                        // TODO delete this when it will be not need
                    } else {
                        console. log ('New crop detected: ', item.name);
                    }

                    price = new Price(saveOptions);
                    price
                        .save(function (err, model) {
                            if (err) {
                                return  callback('DB err:' + err);
                            }

                            if (foundPosition < 0) {
                                return createNewCropNotification (model.toJSON(), callback );
                            }

                            callback();
                        });
                }, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    //console.log('CALLBACK _________________checkWholeSaleDataInDbAndWrite');
                    cb(null, false);
                });
            });
    }

    this.parseWholesalesByUrl = function (item, cb) {

        return parseWholesalesByUrl(item, cb);
    };

    function  parseWholesalesByUrl(item, cb) {
        var self = this;
        var url = item.url;
        var results = item.results;

        request({url : url, encoding: null, headers: {
            'User-Agent': 'request'
        }}, function (err, response, body) {
            var date;
            var nextPage;
            var dateRegExp = /(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.](19|20)\d\d/g;
            var trTagsArray;
            var nameRegExp = /(?:<FONT face='Arial' size=\d color='BLUE'>)([.\S\s]*?)(?:<)/m;
            var priceRegExp = /(?:<FONT face='Arial' size=1 color='DARKBLUE'>)([.\S\s]*?)(?:<)/m;
            var nextPageRegExp = /(?:<a href=)(.*)(?:>לדף הבא _<\/a>)/m;
            var name;
            var price;
            var translator;

            //console.log(translator);

            if (!body || response.statusCode == '404') {
                return cb('body is empty (check your connection to internet)');
            }

            translator = Iconv.decode(body, 'win1255');
            body = translator;

            date = body.match(dateRegExp)[0];
            nextPage = body.match(nextPageRegExp) ? (body.match(nextPageRegExp)[1]).replace(/\\/g,"/") : '';

            console.log('data: ', date);
            console.log('current URL: ', url);
            console.log('next page: ', nextPage);

            trTagsArray = body.match(/<TR>([.\S\s]*?)<\/TR>/gm);

            for (var i = 0, j = trTagsArray.length - 1; j >= 0; j--) {
                name = trTagsArray[i].match(nameRegExp)[1];
                price = trTagsArray[i].match(priceRegExp)[1];

                results.push({
                    price: price,
                    name: name,
                    url: url,
                    date: date
                });

                console.log('price: ', price, ' name: ', name);
                i++;
            }

            if (!nextPage) {
                console.log('parsing ', results.length ,' crops');
                return cb(err, results);
            }
            return parseWholesalesByUrl ({url: nextPage, results: results}, cb);
        });
    }

    this.getPlantCouncilPrice = function (item, cb) {
        var url = item.url;
        var results = item.results;

        request({url : url,  headers: {
            'User-Agent': 'request'
        }}, function (err, response, body) {
            var data;
            var dateRegExp = /(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.](19|20)\d\d/g;
            var trTagsArray;
            var nameRegExp = /(?:<FONT face='Arial' size=\d color='BLUE'>)([.\S\s]*?)(?:<)/m;
            var p1P2NameRegExp = /(?:<td class="productName" style="width:249px;">)([.\S\s]*?)(?:<\/td><td style="width:115px;">)([.\S\s]*?)(?:<\/td><td style="width:115px;">)([.\S\s]*?)(?:<)/m;
            var match;
            var price;

            trTagsArray = body.match(/<tr class="(rgAltRow tblPricesAltCells|rgRow tblPricesCells)[.\S\s]*?<\/tr>/gm);

            //console.log(trTagsArray.length);

            if (!body || response.statusCode == '404') {
                return cb('body is empty (check your connection to internet)');
            }
            //body = encoding.convert(body, "UTF-8", "Windows1255");

            data = body.match(dateRegExp)[0];
            match =  body.match(p1P2NameRegExp);

            console.log('data: ', data);
            console.log('current URL: ', url);
            console.log('match: ', match);
            console.log('match1: ', match[1].trim());
            console.log('match1: ', match[2].trim());
            console.log('match1: ', match[3].trim());

            for (var i = 0, j = trTagsArray.length - 1; j >= 0; j--) {
                name = trTagsArray[i].match(nameRegExp)[1];
                price = trTagsArray[i].match(priceRegExp)[1];

                results.push({
                    minPrice: price,
                    name: name,
                    url: url
                });

                console.log('price: ', price, ' name: ', name);
                i++;
            }

            //console.log('CALLBACK _________________PlanCouncil');
            cb(err, results);
        });
    };

    this.importPcHistoryFromCsv = function (req, res, next) {
        var tasks = [];
        var self = this;
        var csvFileName = req.params.filename;
        var startTime = new Date();

        if (!csvFileName) {
            return res.status(400).send({error: RESPONSE.NOT_ENOUGH_PARAMS});
        }
        csvFileName = 'csv/' + csvFileName;

        tasks.push(getCropList);
        tasks.push(createFnReadPcHistoryFromCsv(csvFileName));
        tasks.push(filterByCropListAndSaveImportedPCData);

        async.waterfall(tasks, function (err, result) {
            if(err) {
                console.log('ERROR:  Import PcHistory Error: ', err);
                return res.status(500).send('ERROR:  Import PcHistory Error: ', err);
            } else {
                console.log('Import PcHistory ended with: ', result ,' spend time (sec): ', (new Date() - startTime)/1000);
                return res.status(200).send('Import PcHistory ended with: ' + result + ' spend time (sec): ' + (new Date() - startTime)/1000);
            }
        });

    };

    //function getCropList (cb){
    //    this.getCropList(function (err, result) {
    //        if (err) {
    //            logWriter.log('scheduleJob -> getMergedCropList-> ' + err);
    //        }
    //        //cropList = result;
    //        console.log('CropList loaded');
    //        //console.dir(cropList);
    //        cb(null, result);
    //    });
    //}
    function createFnReadPcHistoryFromCsv(csvFileName){
        return function readPcHistoryFromCsv(cropList, cb) {

            var source = CONST.URL_APIS.PLANTS_URL.SOURCE;
            var importedData = [];

            fs.readFile(csvFileName, 'utf8', function (err, stringFileData) {
                if (err) {
                    return res.status(500).send({error: err});
                }

                csv.parse(stringFileData, {delimiter: ',', relax: true}, function (err, parsedData) {
                    if (err) {
                        return res.status(500).send({error: err});
                    }
                    //parsedData[0] - table heads

                    for (var i = parsedData.length - 1; i >= 1; i--) {

                        if (parsedData[i][3].trim()) {
                            importedData.push(
                                {
                                    price: parsedData[i][3].trim(),
                                    name: parsedData[i][1].trim(),
                                    url: source,
                                    date: parsedData[i][0].trim(),
                                    excellent: true
                                }
                            )
                        }

                        importedData.push(
                            {
                                price: parsedData[i][2].trim(),
                                name: parsedData[i][1].trim(),
                                date: parsedData[i][0].trim(),
                                url: source
                            }
                        );
                    }

                    console.log('parsedData.length ', parsedData.length);
                    console.log('importedData.length ', importedData.length);

                    cb(null, cropList, importedData);
                });
            });
        }
    };

    function createFnReadWsHistoryFromCsv(csvFileName){
        return function readWsHistoryFromCsv(cropList, cb) {

            var source = CONST.URL_APIS.MOAG_URL.SOURCE_1;
            var importedData = [];
            var name;

            fs.readFile(csvFileName, 'utf8', function (err, stringFileData) {
                if (err) {
                    return cb(err);
                }

                csv.parse(stringFileData, {delimiter: ',', relax: true}, function (err, parsedData) {
                    if (err) {
                        return cb(err);
                    }
                    //parsedData[0] - table heads

                    for (var i = parsedData.length - 1; i >= 1; i--) {
                        name = (parsedData[i][1] ? parsedData[i][1] : '') + (parsedData[i][2] ? ' ' + parsedData[i][2] : '') + (parsedData[i][3] ? ' ' + parsedData[i][3] : '');
                        name = name.replace(/\.$/g,'');

                        importedData.push(
                            {
                                price: parsedData[i][4].trim(),
                                name: name.trim(),
                                url: source,
                                date: parsedData[i][0].trim()
                            }
                        )
                    }
                    console.log('parsedData.length ', parsedData.length);
                    console.log('importedData.length ', importedData.length);
                    console.log(importedData[0]);

                    cb(null, cropList, importedData);

                });
            });
        }
    };

    function filterByCropListAndSaveImportedPCData(cropList, parsedData, cb) {
        var cropLen = cropList.length - 1;

        // eachSeries need only in check purpose
        async.each(parsedData, function (item, callback) {

            var foundPosition = -1;
            var price = parseFloat(item.price) || 0;
            var saveOptions;
            var date = getTransformedDateObject(item.date);
            //console.log(date);
            var nameOptimize = item.name.replace (/ /g,'');
            var searchQualityFlag =  item.excellent ? 'מובחר' : 'סוג א';

            for (var i = cropLen; i >= 0; i--) {
                if (cropList[i].pcNameOptimize === nameOptimize && cropList[i].pcQuality.indexOf(searchQualityFlag) >= 0) {
                    foundPosition = i;
                    i = -1;
                }
            }

            saveOptions = {
                source: item.url,
                price: price,
                date: date,
                name: item.name,
                site: /moag/.test(item.url) ? CONST.WHOLE_SALE_MARKET : CONST.PLANT_COUNCIL,
                year: moment(date).year(),
                month: moment(date).month(),
                dayOfYear: moment(date).dayOfYear(),
                excellent: !!item.excellent
            };

            if (foundPosition >= 0) {
                saveOptions._crop = cropList[foundPosition]._id;
                saveOptions.cropListName = cropList[foundPosition].displayName;
                saveOptions.pcQuality = cropList[foundPosition].pcQuality;
                saveOptions.wsQuality = cropList[foundPosition].wsQuality;
                saveOptions.imported = cropList[foundPosition].imported;

            } else {
                console. log ('New crop detecdet: ', item.name);
            }

            price = new Price(saveOptions);
            price
                .save(function (err, model) {
                    if (err) {
                        return  callback('DB err:' + err);
                    }

                    if (foundPosition < 0) {
                        return createNewCropNotification (model.toJSON(), callback );
                    }

                    callback();
                });
        }, function (err) {
            if (err) {
                return cb(err);
            }
            //console.log('CALLBACK _________________checkWholeSaleDataInDbAndWrite');
            cb(null, 'Success' );
        });
    }

    function filterByCropListAndSaveImportedWsData(cropList, parsedData, cb) {
        var cropLen = cropList.length - 1;

        // eachSeries need only in check purpose
        async.eachSeries(parsedData, function (item, callback) {

            var foundPosition = -1;
            var price = parseFloat(item.price) || 0;
            var saveOptions;
            var date = getTransformedDateObjectForWsDayli(item.date);
            //console.log(date);
            var nameOptimize = item.name.replace (/ /g,'');

            for (var i = cropLen; i >= 0; i--) {
                if ( cropList[i].wsNameOptimize === nameOptimize) {
                    foundPosition = i;
                    i = -1;
                }
            }

            saveOptions = {
                source: item.url,
                price: price,
                date: date,
                name: item.name,
                site: /moag/.test(item.url) ? CONST.WHOLE_SALE_MARKET : CONST.PLANT_COUNCIL,
                year: moment(date).year(),
                month: moment(date).month(),
                dayOfYear: moment(date).dayOfYear()
            };

            if (foundPosition >= 0) {
                saveOptions._crop = cropList[foundPosition]._id;
                saveOptions.cropListName = cropList[foundPosition].displayName;
                saveOptions.pcQuality = cropList[foundPosition].pcQuality;
                saveOptions.wsQuality = cropList[foundPosition].wsQuality;
                saveOptions.imported = cropList[foundPosition].imported;

            } else {
                console. log ('New crop detecdet: ', item.name);
            }

            // for Month Average prices
            price = new Price (saveOptions);
            price
                .save(function (err, model) {
                    if (err) {
                        return  callback('DB err:' + err);
                    }

                    if (foundPosition < 0) {
                        return createNewCropNotification (model.toJSON(), callback );
                    }

                    callback();
                });
        }, function (err) {
            if (err) {
                return cb(err);
            }
            //console.log('CALLBACK _________________checkWholeSaleDataInDbAndWrite');
            cb(null, 'Success');
        });
    }

    function filterByCropListAndSaveMonthImportedWsData(cropList, parsedData, cb) {
        var cropLen = cropList.length - 1;

        // eachSeries need only in check purpose
        async.eachSeries(parsedData, function (item, callback) {

            var foundPosition = -1;
            var price = parseFloat(item.price) || 0;
            var saveOptions;
            var date = getTransformedDateObjectForMonthWs(item.date);
            //console.log(date);
            var nameOptimize = item.name.replace (/ /g,'');

            for (var i = cropLen; i >= 0; i--) {
                if ( cropList[i].wsNameOptimize === nameOptimize) {
                    foundPosition = i;
                    i = -1;
                }
            }

            saveOptions = {
                source: item.url,
                price: price,
                date: date,
                name: item.name,
                site: /moag/.test(item.url) ? CONST.WHOLE_SALE_MARKET : CONST.PLANT_COUNCIL,
                year: moment(date).year(),
                month: moment(date).month(),
                dayOfYear: moment(date).dayOfYear()
            };

            if (foundPosition >= 0) {
                saveOptions._crop = cropList[foundPosition]._id;
                saveOptions.cropListName = cropList[foundPosition].displayName;
                saveOptions.pcQuality = cropList[foundPosition].pcQuality;
                saveOptions.wsQuality = cropList[foundPosition].wsQuality;
                saveOptions.imported = cropList[foundPosition].imported;

            } else {
                console. log ('New crop detecdet: ', item.name);
            }


            // for Month Average prices
            price = new MonthAveragePrice (saveOptions);
            price
                .save(function (err, model) {
                    if (err) {
                        return  callback('DB err:' + err);
                    }

                    if (foundPosition < 0) {
                        return createNewCropNotification (model.toJSON(), callback );
                    }

                    callback();
                });
        }, function (err) {
            if (err) {
                return cb(err);
            }
            //console.log('CALLBACK _________________checkWholeSaleDataInDbAndWrite');
            cb(null, 'Success');
        });
    }

    this.importWsMonthHistoryFromCsv = function (req, res, next) {
        var tasks = [];
        var self = this;
        var csvFileName = req.params.filename;
        var startTime = new Date();

        if (!csvFileName) {
            return res.status(400).send({error: RESPONSE.NOT_ENOUGH_PARAMS});
        }
        csvFileName = 'csv/' + csvFileName;

        tasks.push(getCropList);
        tasks.push(createFnReadWsHistoryFromCsv(csvFileName));
        tasks.push(filterByCropListAndSaveMonthImportedWsData);

        async.waterfall(tasks, function (err, cropList, result) {
            if(err) {
                console.log('ERROR:  Import PcHistory Error: ', err);
                return res.status(500).send('ERROR:  Import PcHistory Error: ', err);
            } else {
                console.log('Import PcHistory ended with: ', result ,' spend time (sec): ', (new Date() - startTime)/1000);
                return res.status(200).send('Import PcHistory ended with: ' + result + ' spend time (sec): ' + (new Date() - startTime)/1000);
            }
        });

    };

    this.importWsHistoryFromCsv = function (req, res, next) {
        var tasks = [];
        var self = this;
        var csvFileName = req.params.filename;
        var startTime = new Date();

        if (!csvFileName) {
            return res.status(400).send({error: RESPONSE.NOT_ENOUGH_PARAMS});
        }
        csvFileName = 'csv/' + csvFileName;

        tasks.push(getCropList);
        tasks.push(createFnReadWsHistoryFromCsv(csvFileName));
        tasks.push(filterByCropListAndSaveImportedWsData);

        async.waterfall(tasks, function (err, cropList, result) {
            if(err) {
                console.log('ERROR:  Import PcHistory Error: ', err);
                return res.status(500).send('ERROR:  Import PcHistory Error: ', err);
            } else {
                console.log('Import PcHistory ended with: ', result ,' spend time (sec): ', (new Date() - startTime)/1000);
                return res.status(200).send('Import PcHistory ended with: ' + result + ' spend time (sec): ' + (new Date() - startTime)/1000);
            }
        });

    };





    this.getAveragePriceMonthly = function (req, res, next) {
        var yearUrlParam = req.params.year;
        var avaragePriceList = [];
        Price.aggregate(
            [ {
                $match : {year : parseInt(yearUrlParam),site:"PlantCouncil"}
            },
                {
                    $group: {
                        _id: {
                            month: {$month: "$date"},
                            year: {$year: "$date"},
                            source:"$source",
                            crop:"$_crop",
                            pcQuality:"$pcQuality",
                            name: "$name",
                            site:"$site",
                            imported:"$imported",
                            cropListName:"$cropListName",
                            wsQuality:"$wsQuality",
                            excellent: "$excellent"},
                        averagePrice: {$avg: "$price"},
                    },
                },
                {$sort: {"_id.year": 1, "_id.month": 1}}

            ]
        ). exec(function (err, list) {
            if (err) {
              return  res.status(500).send({error:err });
            }
            var arrLen = list.length;
            for(var i=0; i < arrLen; i++) {
                var date = moment.utc([list[i]._id.year, list[i]._id.month - 1, 1]).hour(12);


                var saveOptions = {
                    source: list[i]._id.source,
                    price: list[i].averagePrice,
                    date: date.toDate(),
                    cropListName:list[i]._id.cropListName,
                    name: list[i]._id.name,
                    site: list[i]._id.site,
                    year: date.year(),
                    month: date.month(),
                    dayOfYear: date.dayOfYear(),
                    pcQuality: list[i]._id.pcQuality,
                    wsQuality: list[i]._id.wsQuality,
                    imported: list[i]._id.imported,
                    excellent:list[i]._id.excellent,
                    _crop:  list[i]._id.crop
                };
                avaragePriceList.push(saveOptions);
            }

            MonthAveragePrice.collection.insert(avaragePriceList,{}, onInsert);
            function onInsert(err, docs) {
                if (err) {
                    res.status(500).send({error:err });

                } else {
                    console.info('%d objects successfully stored.', docs.length);
                    res.status(200).send(
                        {
                             avaregePriceList:avaragePriceList ,
                            avaregePriceListTotal:avaragePriceList.length});

                }
            }
        });
    };

};