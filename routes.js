const express = require("express");
const router = express.Router();
const dbRtns = require("./dbroutines");
const jwt = require("jsonwebtoken");
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
        if(memberMatch)
        {
            //generate the member token, attatch to json obj, and return
            let token = jwt.sign(mem, process.env.ACCESS_TOKEN_SECRET)
            let resObj = {
                name: mem.name,
                email: mem.email,
                accessToken = token
            }
            res.status(200).send({ member: resObj });
        }
        else{
            res.status(500).send({message: "Invalid Credentials"});
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
        if(memExistsRes.rowCount != 0){
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



module.exports = router;
