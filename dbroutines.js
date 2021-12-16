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
        text: `SELECT * FROM track where LOWER(name) like LOWER('%${songname}%')`
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
        text: `SELECT id, name, al.album, ar.artist
                FROM TRACK t
                INNER JOIN ALBUM al
                ON t.album_id = al.album_id
                INNER JOIN ARTISTS ar
                on t.artist_ids = ar.artist_ids
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
        text: `SELECT name, al.album, ar.artist
                FROM TRACK t
                INNER JOIN ALBUM al
                ON t.album_id = al.album_id
                INNER JOIN ARTISTS ar
                on t.artist_ids = ar.artist_ids
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

//get song id for favourite song list
const getSongID = async(song, artist) =>{
    const query = {
        text: `SELECT id FROM track where LOWER(name) LIKE LOWER ('%${song}%')
                AND LOWER(artists) LIKE LOWER('%${artist}%')`
    }
    try{
        let results = await pool.query(query);
        console.log(results);
        console.log(results.rows[0].id);
        return results.rows[0].id;
    } catch (err) {
        console.log(err);
    }
};

//add favourite song to list
const addFavouriteSong = async(song_id, member_id)=>{
    const query = {
        text: `INSERT INTO favourite_songs
                VALUES ('${song_id}', '${member_id}');
                `
    };
    try{
        let results = await pool.query(query);
        return 1;
    } catch (err) {
        console.log(err);
    }
};

const getFavSongList = async(member_id)=>{
    const query = {
        text: `SELECT name, artists, album FROM favourite_songs fs
                INNER JOIN track t on t.id = fs.song_id
                WHERE member_id = ${member_id}`
    }
    try{
        let results = await pool.query(query);
        return results;
    }catch(err){
        console.log(err);
    }
};

//get album id
const getAlbumId = async(album)=>{
    const query = {
        text: `SELECT album_id FROM album where LOWER(album) LIKE LOWER ('%${album}%')`
    }
    try{
        let results = await pool.query(query);
        console.log(results);
        console.log(results.rows[0].album_id);
        return results.rows[0].album_id;
    } catch (err) {
        console.log(err);
    }
};


//add favourite album artowrk
const addFavouriteArtwork = async(album_id, album, member_id)=>{
    const query = {
        text: `INSERT INTO album_artwork (album_id, album, member_id)
                VALUES ('${album_id}', '${album}', '${member_id}');
                `
    };
    try{
        let results = await pool.query(query);
        return 1;
    } catch (err) {
        console.log(err);
    }
};

const getFavArtwork = async(member_id)=>{
    const query = {
        text: `SELECT album FROM album_artwork 
                WHERE member_id = ${member_id}`
    }
    try{
        let results = await pool.query(query);
        return results;
    }catch(err){
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
    getArtistAlbumsAndSongs,
    getSongID,
    addFavouriteSong,
    getFavSongList,
    addFavouriteArtwork,
    getFavArtwork,
    getAlbumId
};


