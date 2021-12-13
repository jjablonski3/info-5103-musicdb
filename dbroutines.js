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

//get member information
const getMemberInfo = async (membername) => {
    const query = {
        text: `SELECT member_id, membername, email
                FROM member
                WHERE member_id = ${membername}`
    }
    try{
        let results = await pool.query(query);
        return results;
    }catch (err) {
        return(err);
    }
};

//update member email
const updateMemberEmail = async(membername, email) =>{
    const query = {
        text: `UPDATE member
            SET email = ${email}
            WHERE membername = ${membername} `
    }
    try{
        let results = await pool.query(query);
        return results;
    }catch (err) {
        return(err);
    }
}

//update member password
const updatePassword = async(membername, password) =>{
    const query = {
        text: `UPDATE member
            SET password = ${password}
            WHERE membername = ${membername} `
    }
    try{
        let results = await pool.query(query);
        return results;
    }catch (err) {
        return(err);
    }
}

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


//search for songs by text
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

//get a random song from database
const getRandomSong = async() => {
    const query = {
        text: `SELECT id, song_name, al.album, ar.artist
                FROM TRACK t
                INNER JOIN ALBUM al
                ON t.album_id = al.album_id
                INNER JOIN ARTISTS ar
                on t.artist_id = ar.artist_ids
                ORDER BY random()
                LIMIT 1`
    };
    try{
        let results = await pool.query(query);
        return results;
    } catch (err) {
        console.log(err);
    }
};

//returns artist, albums and songs for graphic
const getArtistAlbumsAndSongs = async(artist) => {
    const query = {
        text: `SELECT song_name, al.album, ar.artist
                FROM TRACK t
                INNER JOIN ALBUM al
                ON t.album_id = al.album_id
                INNER JOIN ARTISTS ar
                on t.artist_id = ar.artist_ids
                WHERE LOWER(ar.artist) = LOWER('${artist}');
                `
    };
    try{
        let results = await pool.query(query);
        return results;
    } catch (err) {
        console.log(err);
    }
};

module.exports = {
    addMember,
    getMember,
    searchSongByText,
    getRandomSong,
    getMemberInfo,
    updateMemberEmail,
    updatePassword,
    getArtistAlbumsAndSongs
};


