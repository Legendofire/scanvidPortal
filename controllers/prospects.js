var express = require('express');

var User = require('./../model/users');
var Prospect = require('./../model/prospect');
var Product = require('./../model/product');
var Action = require('./../model/action');


exports.getProspectsNumIn = function(start, end) {
  return Prospect.aggregate([{
      $match: {
        "date_created": {
          $gte: start,
          $lte: end
        }
      }
    },
    {
      $group: {
        _id: '$date_created',
        count: {
          $sum: 1
        }
      }
    },
    {
      $project: {
        _id: 0,
        date: {
          $dateToString: {
            format: "%d/%m/%Y",
            date: "$_id"
          }
        },
        count: "$count"
      }
    }
  ]).exec();
}

exports.getActionsIn = function(start, end) {
    return Prospect.aggregate([
      {
        "$match": {
          "actions": {
            "$elemMatch": {
              "date": {
                  "$gte":start,
                  "$lte":end
              }
            }
          }
        }
      },
      {
        "$lookup":
         {
           from: "users",
           localField: "sales",
           foreignField: "_id",
           as: "sales"
         }
       },
       {
         "$lookup":
          {
            from: "users",
            localField: "technical_sales",
            foreignField: "_id",
            as: "technical_sales"
          }
        },
        {
        "$project": {
          "_id": 0,
          "sales":"$sales.full_name",
          "technical_sales":"$technical_sales.full_name",
          "company_name": 1,
          "actions": {
            "$filter":{
              "input": "$actions",
              "as": "a",
              "cond": {
                "$and": [
                  { "$gte": [ "$$a.date", start ] },
                  { "$lte": [ "$$a.date", end ] }
                ]
              }
            }
          }
        }
      }
      ,{
        "$unwind":  "$actions"
      }
    ]).exec();
}
