const express = require("express");
const router = express.Router();
const dbRtns = require("./dbroutines");
const jwt = require("jsonwebtoken");
var axios = require("axios").default;
const fs = require('fs');
const { pubkey } = require("./config");
const bcrypt = require('bcrypt');
const multer = require('multer');
const { processAudioToRaw } = require("./utils/ffmpeg-utils");

//for the bcrypt hash
const saltRounds = 10;

//Cytoscape Visualization Imports.
let cytoscape = require('cytoscape');
let klay = require('cytoscape-klay');
cytoscape.use(klay);

// Set Storage for Multer (Saving Recordings)
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
var upload = multer({ storage: storage });

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
                name: mem.membername,
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
router.get("/updatepw", async (req, res) => {
    try {
        let passwordHash = await bcrypt.hash(req.body.password, saltRounds);
        let membername = req.body.membername;
        let results = await dbRtns.updatePassword(membername, passwordHash);
        let rows = results.rows;
        res.status(200).send({ rows: rows });
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
router.post("/sba", upload.single('myFile'), async (req, res) => {
    try {
        const origFile = req.file?.path;
        const procFile = "uploads/processed/" + req.file?.filename + ".raw";

        const audioFile = await processAudioToRaw(origFile, procFile);
        let fileContents = fs.readFileSync(audioFile).toString('base64');

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

            if (fs.existsSync(origFile)) {
                fs.unlinkSync(origFile);
            }

            if (fs.existsSync(procFile)) {
                fs.unlinkSync(procFile);
            }

            res.status(200).send({ results: results });
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
            params: { q: song },
            headers: {
                'x-rapidapi-host': 'genius.p.rapidapi.com',
                'x-rapidapi-key': `${pubkey}`
            }
        };

        let results;
        axios.request(options).then(function (response) {
            results = (response.data.response.hits[0].result.url);
            res.status(200).send({ results: results })
        }).catch(function (error) {
            console.error(error);
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("search failed - internal server error");
    }
});

//returns a random song (not specific to user taste)
router.get("/randomsong", async (req, res) => {
    try {
        let results = await dbRtns.getRandomSong();
        let rows = results.rows;
        res.status(200).send({ rows: rows });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("song retrieval failed - internal server error");
    }
});

//returns json info for graph visualization
router.get("/graph", async (req, res) => {
    try {
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
            songs.push({ song: element.song_name, album: element.album });
            albums.push(element.album);
        });
        let unique_albums = Array.from(new Set(albums));//remove duplicate albums

        //graph array for json data
        let elements = [];

        //add artist as root
        elements.push({
            data: { id: `${artist_name}` }
        })

        //add albums nodes and create artist-album edge
        unique_albums.forEach(element => {
            elements.push({ data: { id: `${element}.` } });
            elements.push({
                data: {
                    id: `${element}, ${artist_name}`,
                    source: `${element}.`,
                    target: `${artist_name}`
                }
            })
        })

        //add song nodes and create song-album edge
        songs.forEach(element => {
            elements.push({ data: { id: element.song } });
            elements.push({
                data: {
                    id: `${element.song}, ${element.album}`,
                    source: `${element.song}`,
                    target: `${element.album}.`
                }
            })
        });

        //intitalize cytoscape canvas
        var cy = cytoscape({
            elements,
            layout: { name: 'klay' }
        });

        //set options and apply
        var options = {
            name: 'klay',
            nodeDimensionsIncludeLabels: false, // Boolean which changes whether label dimensions are included when calculating node dimensions
            fit: true, // Whether to fit
            padding: 20, // Padding on fit
            animate: false, // Whether to transition the node positions
            animateFilter: function (node, i) { return true; }, // Whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
            animationDuration: 500, // Duration of animation in ms if enabled
            animationEasing: undefined, // Easing of animation if enabled
            transform: function (node, pos) { return pos; }, // A function that applies a transform to the final node position
            ready: undefined, // Callback on layoutready
            stop: undefined, // Callback on layoutstop
            klay: {
                // Following descriptions taken from http://layout.rtsys.informatik.uni-kiel.de:9444/Providedlayout.html?algorithm=de.cau.cs.kieler.klay.layered
                addUnnecessaryBendpoints: false, // Adds bend points even if an edge does not change direction.
                aspectRatio: 1.6, // The aimed aspect ratio of the drawing, that is the quotient of width by height
                borderSpacing: 20, // Minimal amount of space to be left to the border
                compactComponents: false, // Tries to further compact components (disconnected sub-graphs).
                crossingMinimization: 'LAYER_SWEEP', // Strategy for crossing minimization.
                /* LAYER_SWEEP The layer sweep algorithm iterates multiple times over the layers, trying to find node orderings that minimize the number of crossings. The algorithm uses randomization to increase the odds of finding a good result. To improve its results, consider increasing the Thoroughness option, which influences the number of iterations done. The Randomization seed also influences results.
                INTERACTIVE Orders the nodes of each layer by comparing their positions before the layout algorithm was started. The idea is that the relative order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive layer sweep algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
                cycleBreaking: 'GREEDY', // Strategy for cycle breaking. Cycle breaking looks for cycles in the graph and determines which edges to reverse to break the cycles. Reversed edges will end up pointing to the opposite direction of regular edges (that is, reversed edges will point left if edges usually point right).
                /* GREEDY This algorithm reverses edges greedily. The algorithm tries to avoid edges that have the Priority property set.
                INTERACTIVE The interactive algorithm tries to reverse edges that already pointed leftwards in the input graph. This requires node and port coordinates to have been set to sensible values.*/
                direction: 'UNDEFINED', // Overall direction of edges: horizontal (right / left) or vertical (down / up)
                /* UNDEFINED, RIGHT, LEFT, DOWN, UP */
                edgeRouting: 'ORTHOGONAL', // Defines how edges are routed (POLYLINE, ORTHOGONAL, SPLINES)
                edgeSpacingFactor: 0.5, // Factor by which the object spacing is multiplied to arrive at the minimal spacing between edges.
                feedbackEdges: false, // Whether feedback edges should be highlighted by routing around the nodes.
                fixedAlignment: 'NONE', // Tells the BK node placer to use a certain alignment instead of taking the optimal result.  This option should usually be left alone.
                /* NONE Chooses the smallest layout from the four possible candidates.
                LEFTUP Chooses the left-up candidate from the four possible candidates.
                RIGHTUP Chooses the right-up candidate from the four possible candidates.
                LEFTDOWN Chooses the left-down candidate from the four possible candidates.
                RIGHTDOWN Chooses the right-down candidate from the four possible candidates.
                BALANCED Creates a balanced layout from the four possible candidates. */
                inLayerSpacingFactor: 1.0, // Factor by which the usual spacing is multiplied to determine the in-layer spacing between objects.
                layoutHierarchy: false, // Whether the selected layouter should consider the full hierarchy
                linearSegmentsDeflectionDampening: 0.3, // Dampens the movement of nodes to keep the diagram from getting too large.
                mergeEdges: false, // Edges that have no ports are merged so they touch the connected nodes at the same points.
                mergeHierarchyCrossingEdges: true, // If hierarchical layout is active, hierarchy-crossing edges use as few hierarchical ports as possible.
                nodeLayering: 'NETWORK_SIMPLEX', // Strategy for node layering.
                /* NETWORK_SIMPLEX This algorithm tries to minimize the length of edges. This is the most computationally intensive algorithm. The number of iterations after which it aborts if it hasn't found a result yet can be set with the Maximal Iterations option.
                LONGEST_PATH A very simple algorithm that distributes nodes along their longest path to a sink node.
                INTERACTIVE Distributes the nodes into layers by comparing their positions before the layout algorithm was started. The idea is that the relative horizontal order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive node layering algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
                nodePlacement: 'BRANDES_KOEPF', // Strategy for Node Placement
                /* BRANDES_KOEPF Minimizes the number of edge bends at the expense of diagram size: diagrams drawn with this algorithm are usually higher than diagrams drawn with other algorithms.
                LINEAR_SEGMENTS Computes a balanced placement.
                INTERACTIVE Tries to keep the preset y coordinates of nodes from the original layout. For dummy nodes, a guess is made to infer their coordinates. Requires the other interactive phase implementations to have run as well.
                SIMPLE Minimizes the area at the expense of... well, pretty much everything else. */
                randomizationSeed: 1, // Seed used for pseudo-random number generators to control the layout algorithm; 0 means a new seed is generated
                routeSelfLoopInside: false, // Whether a self-loop is routed around or inside its node.
                separateConnectedComponents: true, // Whether each connected component should be processed separately
                spacing: 20, // Overall setting for the minimal amount of space to be left between objects
                thoroughness: 7 // How much effort should be spent to produce a nice layout..
            },
            priority: function (edge) { return null; }, // Edges with a non-nil value are skipped when greedy edge cycle breaking is enabled
        };
        cy.layout(options).run();

        cy.nodes().map((node, id) => {
            console.log(id);
            console.log(node._private.data);
        });


        res.status(200).send(cy.png());
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("Graph creation failed - internal server error");
    }
});

//get user generated song meaning


module.exports = router;
