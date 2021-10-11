const express = require("express");
const router = express.Router();
const dbRtns = require("./dbroutines");
const jwt = require("jsonwebtoken");


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



module.exports = router;
