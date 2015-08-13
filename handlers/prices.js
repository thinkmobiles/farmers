/**
 * Created by kille on 12.08.2015.
 */
//var mongoose = require('mongoose');
var DataParser = require('../helpers/dataParser');
var moment = require("moment");

var Price = function (db) {
    var Price = db.model('Price');


    var dataParser = new DataParser(db);



    this.getPriceById = function (req, res, next) {

    };

    this.getPricesByDate = function (req, res, next) {
        var date;
        var dateString = req.query.date;

        //todo add regex for date
        if (dateString) {
            date = new Date(dateString.replace(/-/g,'/'));
        } else {
            date = new Date();
        }

        Price
            .find({
                year: moment(date).year(),
                dayOfYear: moment(date).dayOfYear()
            })
            //.find({})
            .populate('_vegetable')
            .exec(function (err, prices) {
                if (err) {
                    return next(err);
                } else {
                    res.status(200).send(prices);
                }
            });
    };

    this.syncVegetablePrices = function (req, res, next){
        var DATA_URL = "https://www.kimonolabs.com/api/4fv5re1i?apikey=bG2G9Y4cVggvVGxEV3gSVEyatTIjbHP4";
        dataParser.syncVegetablePrices(DATA_URL, function(err, result){
            if (err) {
                next(err);
            } else {
                res.status(200).send(result);
            }
        });
    };

};

module.exports = Price;