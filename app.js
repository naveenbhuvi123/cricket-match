const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//LIST OF ALL PLAYERS API 1
app.get("/players/", async (request, response) => {
  const getPlayersDetails = `
    SELECT 
      *
    FROM 
      player_details;`;
  const playersArray = await db.all(getPlayersDetails);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//GET PLAYERS WITH PLAYER_ID API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `
    SELECT 
      * 
    FROM 
      player_details
    WHERE 
      player_id = ${playerId};`;
  const players = await db.get(getPlayerDetails);
  response.send(convertDbObjectToResponseObject(players));
});

//UPDATE DETAIL OF PLAYER API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerDetails = `
    UPDATE 
      player_details
    SET 
      player_name ='${playerName}'
    WHERE
      player_id = ${playerId};`;
  await db.run(updatePlayerDetails);
  response.send("Player Details Updated");
});

const convertData = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//GET MATCH DETAILS API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    SELECT 
      *
    FROM 
      match_details
    WHERE 
      match_id =${matchId};`;
  const getMatch = await db.get(getMatchDetails);
  response.send(convertData(getMatch));
});

const convertPlayerMatchData = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};
//GET PLAYER MATCH DETAILS API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayer = ` 
        SELECT
           *
        FROM 
           player_match_score 
           NATURAL JOIN match_details
          
        WHERE 
           player_id = ${playerId};`;
  const matches = await db.all(getMatchPlayer);
  response.send(matches.map((eachMatch) => convertData(eachMatch)));
  console.log(matches);
});

//GET LIST OF PLAYERS API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getListOfPlayers = `
    SELECT *
    FROM player_match_score NATURAL JOIN  player_details 
    WHERE 
       match_id = ${matchId};`;
  const players = await db.all(getListOfPlayers);
  response.send(
    players.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
  console.log(players);
});

const convertPlayerObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    totalScore: dbObject.score,
    totalFours: dbObject.fours,
    totalSixes: dbObject.sixes,
  };
};
//RETURN STATISTICS OF PLAYER API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsOfPlayer = `
     SELECT 
       player_details.player_id as playerId,
       player_details.player_name as playerName,
       SUM(player_match_score.score) as totalScore,
       SUM(player_match_score.fours) as totalFours,
       SUM(player_match_score.sixes) as totalSixes
     FROM 
       player_details INNER JOIN player_match_score ON
       player_details.player_id = player_match_score.player_id
     WHERE 
       player_details.player_id = ${playerId};;`;
  const dbResponse = await db.get(getStatsOfPlayer);
  response.send(convertPlayerObject(dbResponse));
});
module.exports = app;
