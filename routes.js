const express = require("express");
const router = express.Router();
const dbRtns = require("./dbroutines");
const jwt = require("jsonwebtoken");
var axios = require("axios").default;
const fs = require('fs');
const { pubkey } = require("./config");
const bcrypt = require('bcrypt');
//for the bcrypt hash
const saltRounds = 10;


//create login token
router.post("/login", async (req, res) => {
    try {
        //load the login member data so we can check if the password is correct
        let memRes = await dbRtns.getMember(req.body.name);
        console.log(memRes.rows[0])
        console.log(memRes.rows[0].member_id);
        let mem = memRes.rows[0];
        let memberMatch = await bcrypt.compare(req.body.pass, mem.password);
        if (memberMatch) {
            //generate the member token, attatch to json obj, and return
            let token = jwt.sign(mem, process.env.ACCESS_TOKEN_SECRET)
            let resObj = {
                name: mem.name,
                email: mem.email,
                accessToken: token
            }
            res.status(200).send({ member: resObj });
        }
        else {
            res.status(500).send({ message: "Invalid Credentials" });
        }

    } catch (err) {
        console.log(err.stack);
        res.status(500).send("member login failed - internal server error");
    }
});

/*in postman - application-type application/json, and accept application/json are required */

//register member
router.post("/register", async (req, res) => {
    try {
        console.log(req.body);
        //check if that member name already exists
        let memExistsRes = await dbRtns.getMember(req.body.name);
        console.log(memExistsRes);
        console.log(memExistsRes.rowCount);
        if (memExistsRes.rowCount != 0) {
            console.log("A member with that name already exists");
            res.status(500).send("A member with that name already exists");
            return;
        }

        let passwordHash = await bcrypt.hash(req.body.pass, saltRounds);

        let membername = req.body.name;
        let email = req.body.email;
        let results = await dbRtns.addMember(membername, passwordHash, email);
        res.status(200).send({ results: results });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("register member failed - internal server error");
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

//update email
router.get("/updatepw", async(req,res) =>{
    try{
        let passwordHash = await bcrypt.hash(req.body.password, saltRounds);
        let membername = req.body.membername;
        let results = await dbRtns.updatePassword(membername, passwordHash);
        let rows = results.rows;
        res.status(200).send({ rows : rows });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("search failed - internal server error");
    }
});

//search by text
router.get("/sbt/:songname", async (req, res) => {
    try {
        let songtofind = req.params.songname;
        let results = await dbRtns.searchSongByText(songtofind);
        let rows = results.rows;

        res.status(200).send({ rows: rows });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("search failed - internal server error");
    }
});

//search by audio
router.get("/sba", async (req, res) => {
    try {
        //const fileContents = fs.readFileSync(inputRawFile);
        const filename = "C:/Users/rmcna/Downloads/testify.raw"
        let fileContents = fs.readFileSync(filename).toString('base64');
        //console.log(fileData);
        var options = {
            method: 'POST',
            url: 'https://shazam.p.rapidapi.com/songs/detect',
            params: { timezone: 'America/Chicago', locale: 'en-US' },
            headers: {
                'content-type': 'text/plain',
                'x-rapidapi-host': 'shazam.p.rapidapi.com',
                'x-rapidapi-key': `${pubkey}`
            },
            data: fileContents
        };
        let results;
        axios.request(options).then(function (response) {
            console.log(response.data);
            results = response.data;
            res.status(200).send({ results: results })
        }).catch(function (error) {
            console.error(error);
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("search failed - internal server error");
    }
});

//search by lyrics
router.get("/lyrics", async (req, res) => {
    try {
        let song = req.body.song;
        var options = {
            method: 'GET',
            url: 'https://genius.p.rapidapi.com/search',
            params: {q: song},
            headers: {
                'x-rapidapi-host': 'genius.p.rapidapi.com',
                'x-rapidapi-key': `${pubkey}`
            }
          };
          
          let results;
          axios.request(options).then(function (response) {
              results = (response.data.response.hits[0].result.url);
              res.status(200).send({results:results})
          }).catch(function (error) {
              console.error(error);
          });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("search failed - internal server error");
    }
});

//returns a random song (not specific to user taste)
router.get("/randomsong", async(req,res) =>{
    try{
        let results = await dbRtns.getRandomSong();
        let rows = results.rows;
        res.status(200).send({ rows : rows });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("song retrieval failed - internal server error");
    }
});

//returns json info for graph visualization
router.get("/graph", async(req, res) =>{
    try{
        let artist = 'Rage Against the Machine'; //req.artist
        //db query results
        let results = [];
        results = await dbRtns.getArtistAlbumsAndSongs(artist);
        results = results.rows; //parse info
        let songs = [];
        let albums = [];
        let artist_name = results[0].artist;    //top node
        //parse returned json into song and album for graph json
        results.forEach(element => {
            songs.push({song:element.song_name, album:element.album});
            albums.push(element.album);
        });
        let unique_albums = Array.from(new Set(albums));//remove duplicate albums

        //graph array for json data
        let elements = {nodes:[], edges:[]};
        
        //add artist as root
        elements.nodes.push({id: artist_name, root: true});

        //add albums nodes and create artist-album edge
        unique_albums.forEach(element =>{
            elements.nodes.push({id: `${element}.`, type: "Album"})
            elements.edges.push({source: artist_name, target:`${element}.`, caption: "WROTE"})
        });

        //add song nodes and create song-album edge
        songs.forEach(element =>{
            elements.nodes.push({id: element.song, type: "Song"});
            elements.edges.push({ source: `${element.song}`, target: `${element.album}.`, caption: "APPEARS_ON"})
        });

        let json = JSON.stringify(elements);

        res.status(200).send(json);    
    }catch (err) {
        console.log(err.stack);
        res.status(500).send("Graph creation failed - internal server error");
    }
});

//get user generated song meaning


module.exports = router;
