const express = require("express");
const router = express.Router();
const dbRtns = require("./dbroutines");
const jwt = require("jsonwebtoken");
var axios = require("axios").default;
const fs = require('fs');

//create login token
router.post("/login", async (req, res) => {
    try {
        let membername = req.body.membername;
        const member = { memname: membername}

        const memberAccessToken = jwt.sign(member, process.env.ACCESS_TOKEN_SECRET)

        let passwordHash = req.body.passwordHash;
        let email = req.body.email;
        let results = await dbRtns.addMember(membername, passwordHash, email);
        res.status(200).send({ results: results });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("add member failed - internal server error");
    }
});


router.post("/member", async (req, res) => {
    try {
        let membername = req.body.membername;
        let passwordHash = req.body.passwordHash;
        let email = req.body.email;
        let results = await dbRtns.addMember(membername, passwordHash, email);
        res.status(200).send({ results: results });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("add member failed - internal server error");
    }
});

router.get("/member", async (req, res) => {
    try {
        let membername = req.body.membername;
        let passwordHash = req.body.passwordHash;
        let email = req.body.email;
        let results = await dbRtns.addMember(membername, passwordHash, email);
        res.status(200).send({ results: results });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("add member failed - internal server error");
    }
});

//search by text
router.get("/sbt/:songname", async (req, res) => {
    try {
        let songtofind = req.params.songname;
        let results = await dbRtns.searchSongByText(songtofind);
        let rows = results.rows;
        
        res.status(200).send({ rows : rows });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("search failed - internal server error");
    }
});

//search by audio
router.get("/sba", async (req, res) => {
    try {
        //const fileContents = fs.readFileSync(inputRawFile);
        const filename =  "C:/Users/rmcna/Downloads/testify.raw"
        let fileContents = fs.readFileSync(filename).toString('base64');
        //console.log(fileData);
        var options = {
            method: 'POST',
            url: 'https://shazam.p.rapidapi.com/songs/detect',
            params: {timezone: 'America/Chicago', locale: 'en-US'},
            headers: {
              'content-type': 'text/plain',
              'x-rapidapi-host': 'shazam.p.rapidapi.com',
              'x-rapidapi-key': 'a1986d37f8msha94f40e5c9486b9p11983cjsn9270b926a083'
            },
            data: fileContents
          };
          let results;
          axios.request(options).then(function (response) {
              console.log(response.data);
              results = response.data;
              res.status(200).send({results:results})
            }).catch(function (error) {
              console.error(error);
          });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("search failed - internal server error");
    }
});


//search by lyrics
router.get("/id", async (req, res) => {
    try {
        var options = {
            method: 'GET',
            url: 'https://genius.p.rapidapi.com/search',
            params: {q: 'Kendrick Lamar'},
            headers: {
              'x-rapidapi-host': 'genius.p.rapidapi.com',
              'x-rapidapi-key': 'a1986d37f8msha94f40e5c9486b9p11983cjsn9270b926a083'
            }
          };
          
          let results;
          axios.request(options).then(function (response) {
              console.log(response.data.response.hits[0].result.api_path);//.response.hits.result.api_path);
              results = response.data.response.hits[0].result.api_path;//.response.hits.result.api_path);
              res.status(200).send({results:results})
          }).catch(function (error) {
              console.error(error);
          });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("search failed - internal server error");
    }
});

router.get("/lyrics", async (req, res) => {
    try {
        let artistid = req.params.id;

        var options = {
            method: 'GET',
            url: 'https://genius.p.rapidapi.com/songs/378195',
            //url: `https://genius.p.rapidapi.com/songs/${artistid}`,
            headers: {
              'x-rapidapi-host': 'genius.p.rapidapi.com',
              'x-rapidapi-key': 'a1986d37f8msha94f40e5c9486b9p11983cjsn9270b926a083'
            }
          };
          
          axios.request(options).then(function (response) {
              console.log(response.data);
          }).catch(function (error) {
              console.error(error);
          });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("search failed - internal server error");
    }
});


module.exports = router;
