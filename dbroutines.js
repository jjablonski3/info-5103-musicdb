const e = require("express");
const { Pool } = require("pg");
const { username, dburl, database, authorization } = require("./config");
const port = 5432;

const pool = new Pool({
    user: username,
    host: dburl,
    database: database,
    password: authorization,
    port: port,
    ssl: { rejectUnauthorized: false },
    max: 25,
    connectionTimeoutMillis: 0, //won't timeout
    idleTimeoutMillis: 0 //won't timeout
});


//adds a new member login to the member table. Name and email must be unique
const addMember = async ( membername, passwordHash, email  ) => {
    const query = {
        text: `INSERT INTO member ( membername, password, email)
                VALUES ( '${membername}', '${passwordHash}', '${email}' )`
    };
    try {
        let results = await pool.query(query);
        return results;
    } catch (err) {
        console.log(err);
    }
};

const searchSongByText = async(songname) => {
    const query = {
        text: `SELECT * FROM track where LOWER(song_name) like LOWER('%${songname}%')`
    };
    try{
        let results = await pool.query(query);
        return results;
    } catch (err) {
        console.log(err);
    }
};

const getMember = async (membername) => {
    const query = {
        text: `SELECT * 
               FROM member
               WHERE membername = '${membername}'`
    };
    try {
        let results = await pool.query(query);
        return results;
    } catch (err) {
        console.log(err);
    }
};

module.exports = {
    addMember,
    getMember,
    searchSongByText

};


