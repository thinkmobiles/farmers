'use strict';

var request = require('supertest');
var expect = require('chai').expect;
var mongoose = require('mongoose');
var CONST = require('../../constants/constants.js');
var USERS = require('./../testHelpers/usersTemplates');
var async = require ('async');
var PreparingBd = require('./preparingDb');
var url = 'http://localhost:7792';

describe('FB User SignUp', function () {

    var agent = request.agent(url);
    var preparingDb = new PreparingBd();

    before(function (done) {

        console.log('>>> before');



        async.series([
            //preparingDb.dropCollection('Users')
            //preparingDb.toFillUsers(1)
        ], function (err, results) {
            if (err) {
                return done(err);
            }
            console.log('BD preparing completed');
            done();
        });
    });

    it('Delete user IF registered ', function (done) {
        var loginData = USERS.FB_USER_GOOD;

        agent
            .delete('/users/dellAccountByEmail/' + loginData.email)
            //.send(loginData)
            .expect(200)
            .end(function (err, res) {
                console.dir(res.body);
                if (err) {
                    return done(err);
                }
                done();
            });
    });

    it('New user Sign Up FB (All field)', function (done) {
        var loginData = USERS.FB_USER_GOOD;

        agent
            .post('/users/signUpFb')
            .send(loginData)
            .expect(200)
            .end(function (err, res) {
                console.dir(res.body);
                if (err) {
                    return done(err);
                }
                done();
            });
    });

    //it('User Sign Up FB with already USED EMAIL (Sync)', function (done) {
    //    var loginData = USERS.USER_GOOD_CREDENRIALS;
    //
    //    agent
    //        .post('/users/register')
    //        .send(loginData)
    //        .expect(400)
    //        .end(function (err, res) {
    //            console.dir(res.body);
    //            if (err) {
    //                return done(err);
    //            }
    //            done();
    //        });
    //});
    //
    //it('New user Sign Up FB (without email)', function (done) {
    //    var loginData = USERS.USER_GOOD_CREDENRIALS;
    //    var lastUser;
    //
    //    preparingDb.getCollectionsByModelNameAndQueryAndSort(CONST.MODELS.USER, {}, {}, function (err, models){
    //        if (err) {
    //            return done(err);
    //        }
    //        if (!models) {
    //            return done(CONST.MODELS.USER + ' is empty');
    //        }
    //
    //        lastUser = models[0];
    //
    //        console.log('lastUser :', lastUser);
    //        agent
    //            .get('/users/confirmEmail/' + lastUser.confirmToken)
    //            .expect(200)
    //            .end(function (err, res) {
    //                console.dir(res.body);
    //                if (err) {
    //                    return done(err);
    //                }
    //                done();
    //            });
    //    });
    //});
    //
    //it('User Sign Up FB with BAD TOKEN', function (done) {
    //    var loginData = USERS.USER_GOOD_CREDENRIALS;
    //
    //    agent
    //        .post('/users/signIn')
    //        .send(loginData)
    //        .expect(200)
    //        .end(function (err, res) {
    //            console.dir(res.body);
    //            if (err) {
    //                return done(err);
    //            }
    //            done();
    //        });
    //});
    //
    //it('User Sign Up FB with BAD FB.ID', function (done) {
    //    var loginData = USERS.USER_BAD_PASS;
    //
    //    agent
    //        .post('/users/signIn')
    //        .send(loginData)
    //        .expect(400)
    //        .end(function (err, res) {
    //            console.dir(res.body);
    //            if (err) {
    //                return done(err)
    //            }
    //            done();
    //        });
    //});

});