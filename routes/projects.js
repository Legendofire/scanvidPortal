var express = require('express');
var router = express.Router();
var ObjectId = require('mongoose').Types.ObjectId;
var faker = require('faker');
var crypto = require('crypto');
var moment = require('moment');
var Project = require('./../model/project.js');

const KPI_Names = {
  "EOBD": [
    "Starting a Business",
    "Dealing with Construction Permit",
    "Getting Electricity",
    "Registering a Property",
    "Getting Credit",
    "Protecting Minority Investors",
    "Paying Taxes",
    "Trading Across Borders",
    "Enforcing Contracts",
    "Resolving Insolvency"
  ],
  "GCI": [
    "Political Instability",
    "Inflation",
    "Corruption",
    "Inefficient Government bureaucracy",
    "Inadequately Educated workforce",
    "Access to financing",
    "Tax Rates",
    "Foreign currency regulations",
    "Poor work ethic",
    "Inadequate supply of infrastructure",
    "Government stability",
    "Restrictive labor regulations",
    "Tax regulations",
    "Insufficient capacity to innovate",
    "Poor public health",
    "Crime and theft"
  ],
  "WGI": [
    "Voice and Accountability",
    "Political Stability",
    "Government Effectiveness",
    "Regulatory Quality",
    "Rule of Law",
    "Control of Corruption"
  ],
  "CPI": [
    "World Economic Forum EOS",
    "Global Insight Country Risk Ratings",
    "Bertelsmann Foundation Transformation Index",
    "World Justice Project Rule of Law Index",
    "PRS International Country Risk Guide",
    "Economist Intelligence Unit Country Ratings",
  ]
}

router.get('/', function(req, res, next) {
  Project.find().exec().then(function(projects){
    // TODO: Fix the Divide by 0 Problem
    projects = projects.map(function(proj){
      var newObj = Object.assign({},proj._doc);
      var months = monthsFromStart(proj.startDate);
      newObj['plannedPerc'] = (months/proj.plannedDuration)*100>0?(months/proj.plannedDuration)*100:0;
      var status = (proj.actualPerc/(newObj.plannedPerc))*100;
      if(status >= 100){
        newObj['status'] = "Green";
      }else if(status >= 90){
        newObj['status'] = "#ffa500";
      }else{
        newObj['status'] = "Red";
      }

      newObj['plannedEndDate'] = moment(proj.startDate).add(months, 'months').format("MMM Y");
      newObj['actualEndDate'] = moment(proj.startDate).add(proj.actualDuration, 'months').format("MMM Y");
      return newObj;
    });

    var output = {
      child: 'partials/projects/table.ejs',
      projects: projects
    };
    res.render('layout', output);
  }).catch(function(err){
    console.log(err);
  });
});

router.get('/view/:pid', function(req, res, next) {
  Project.findOne({
    _id: req.params.pid
  }).exec().then(function(project) {
    var months = monthsFromStart(project.startDate);
    project.plannedPerc = (months/project.plannedDuration)*100>0?(months/project.plannedDuration)*100:0;
    project.status = (project.actualPerc/(project.plannedPerc))*100;

    project.startDateM = moment(project.startDate).format("MMM Y");
    project.endDate = moment(project.startDate).add(months, 'months').format("MMM Y");
    if(months>0){
      project.actualEndDate = moment(project.startDate).format("MMM Y");
    }
    var output = {
      child: 'partials/projects/view.ejs',
      project: project
    };
    res.render('layout', output);
  });
});

router.post('/add', function(req, res, next) {
  var data = JSON.parse(req.body.data);
  for(var i=0; i<data.indecies.length; i++){
    for(var j=0; j<data.indecies[i].KPIs.length; j++){
      var indexName = data.indecies[i].name;
      //console.log("index Name: ", indexName);
      var kpiNum = data.indecies[i].KPIs[j].name;
      //console.log("kpi num: ", kpiNum);
      var kpiName = KPI_Names[indexName][kpiNum];
      //console.log("kpi name: ", kpiName);
      data.indecies[i].KPIs[j].name = kpiName;
      if(indexName === "WGI" && kpiNum === "6"){
        data.indecies[i].KPIs[j].name = "Control of Corruption";
      }
      //console.log("var value: ",data.indecies[i].KPIs[j].name);
    }
  }
  Project.create(data, function(err,value){
    if(err){
      console.log(err);
      res.json(err);
    }else{
      res.json('Success');
    }
  });
});

router.get('/add', function(req, res, next) {
  res.redirect('/');
});

router.get('/edit/:pid', function(req, res, next) {
  Project.findOne({
    _id: req.params.pid
  }).exec().then(function(project) {
    var months = monthsFromStart(project.startDate);
    project.plannedPerc = (months/project.plannedDuration)*100>0?(months/project.plannedDuration)*100:0;
    project.endDate = moment(project.startDate).add(months, 'months').format("MMM Y");
    if(months>0){
      project.actualEndDate = moment(project.startDate).format("MMM Y");
    }

    var output = {
      child: 'partials/projects/edit.ejs',
      project: project
    };
    res.render('layout', output);
  });
});

router.post('/edit/:pid', function(req, res, next) {
  Project.findOne({
    _id: req.params.pid
  }).exec().then(function(project) {
    if (req.body.actualPerc) project.actualPerc = req.body.actualPerc;
    if (req.body.consumedBudget) project.consumedBudget = req.body.consumedBudget;
    if (req.body.execEntity) project.execEntity = req.body.execEntity;
    if (req.body.actualDuration) project.actualDuration = req.body.actualDuration;
    if (req.body.justification) project.justification = req.body.justification;

    var indexUsed = [];
    var kpiIndexUsed = [];
    project.indecies.forEach(function(val, index){
      //console.log(1,val);
      indexUsed[val.name] = index;
      val.KPIs.forEach(function(val2, index2){
        //console.log(2,val2);
        kpiIndexUsed[val2._id] = index2;
      });
    });
    //console.log(kpiIndexUsed);
    if (req.body.kpi_json){
      var parsedKpi = JSON.parse(req.body.kpi_json);
      //console.log(parsedKpi);
      var set = {$set:{}};
      parsedKpi.forEach(function(Index){
        //{name:"EOBD",kpis:[{id:6232786...,value:"123"}]}
        //console.log(Index);
        Index.kpis.forEach(function(kpi, index){
          //console.log(kpi);
          set.$set["indecies."+indexUsed[Index.name]+".KPIs."+kpiIndexUsed[kpi.id]+".actual"] = kpi.value;
        });
      //console.log(set);
      });
      Project.findOneAndUpdate(
        {"_id": project._id},
        set
      ).exec().then(function(){
        project.save(function(value, err) {
            if (err) console.error(err);
            //res.redirect('/view/' + req.params.pid);
            res.redirect('/');
        }).catch(function(err){
          console.log(err);
        })
      })
    }else{
      project.save(function(value, err) {
          if (err) console.error(err);
          //res.redirect('/view/' + req.params.pid);
          res.redirect('/');
      }).catch(function(err){
        console.log(err);
      })
    }
  });
});

router.get('/obc', function(req, res, next){
  Project.find().exec().then(
    function(doc){
      var budget = [0, 0];
      doc.forEach(function(item){
        budget[1] += item.plannedBudget||0;
        budget[0] += item.consumedBudget||0;
      })
      res.json(budget);
    },
    function(err){
      res.json(err);
    }
  );
});

router.get('/op', function(req, res, next){
  Project.count().exec().then(
    function(res1){
      Project.count({"actualPerc":100}).exec().then(
        function(res2){
          res.json([res2,res1-res2])
        }
      )
      res.json(doc);
    },
    function(err){
      res.json(err);
    }
  );
});

router.get('/oui', function(req, res, next){
  Project.aggregate(
    [
      {
        $unwind: "$indecies"
      },
      {
        $group: {
          "_id":"$indecies.name",
          result: {"$sum":1}
        }
      }
    ]
  ).exec().then(
    function(doc){
      var newDoc = new Array(4+1).join('0').split('').map(parseFloat);
      doc.forEach(function(element){
        switch(element._id){
          case "EOBD":
            newDoc[0] = element.result
            break;
          case "GCI":
            newDoc[1] = element.result
            break;
          case "CPI":
            newDoc[2] = element.result
            break;
          case "WGI":
            newDoc[3] = element.result
            break;
        }
      })
      res.json(newDoc);
    },
    function(err){
      res.json(err);
    }
  );
});

function monthsFromStart( start ) {
  var date1 = moment(start);
  var date2 = moment();

  return date2.diff(date1, 'months');
}

router.post('/getSerial', function(req, res, next){
  res.json(crypto.randomBytes(8).toString("hex"));
});

router.get('/seed/:num', function(req, res, next) {
  addRandproject(req.params.num);
});

function addRandProject(num){
  if(num>0){
    var project = {
      contact_name: faker.name.findName(),
      company_name: faker.company.companyName(),
      contact_info: [faker.internet.email()],
      description: faker.company.catchPhrase(),
      progression: faker.random.number(90),
      creator: faker.random.arrayElement(['Admin','Sales','Tech']),
      product: '59b445e8c27c2437d197cdff',
      sales: faker.random.arrayElement(['59bdc631022a9a5e61f4a5d8','59bdc78f022a9a5e61f4a5d9','59bdcf25824522688845a0a5']),
      technical_sales: faker.random.arrayElement(['59bdc7e4022a9a5e61f4a5da','59bdc838022a9a5e61f4a5db','59bdc887022a9a5e61f4a5dc','59bdc8f0022a9a5e61f4a5dd','59bdc940022a9a5e61f4a5de']),
      date_created: faker.date.between('2017-01-01', '2018-01-01')
    }
    var project_id = '';

    project.create(project, function(err, value) {
      project_id = value._id;
      //if (err) console.error(err);
      User.findByIdAndUpdate(
        project.sales, {
          $push: {
            "projects": project_id
          }
        }, {
          safe: true,
          upsert: true,
          new: true
        }
      ).then(function(err, value) {
        //if (err) console.error(err);
        User.findByIdAndUpdate(
          project.technical_sales, {
            $push: {
              "projects": project_id
            }
          }, {
            safe: true,
            upsert: true,
            new: true
          }
        ).then(function(value, err) {
          //if (err) console.error(err);
          console.log(num);
          addRandproject(num-1);
        });
      });
    });
  }else{
    return;
  }
}

module.exports = router;
