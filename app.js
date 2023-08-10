const express = require("express");
const app = require("path");
const app = express(); 
const sqlite3 = require("sqlite3");
app.use(express());
const {open} = require("sqlite");
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

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

const ConvertDbObjectToResponseObject = (dbObject)=>{
    return{ 
        stateName :dbObject.state_name,
        stateId:dbObject.state_id,
        districtName:dbObject.district_id,
        population:dbObject.population,
        districtId:dbObject.district_id,
        cases:dbObject.cases,
        cured:dbObject.cured,
        active:dbObject.active,
        deaths:dbObject.deaths,

    };
}; 

//Returns a list of all states in the state table
aap.get("/states/",async (request,response)=>{  
     const stateNames =`
     SELECT 
     * 
     FROM 
     state`; 
     const allStateArray = await db.all(stateNames);
     response.send(
         allStateArray.map((eachObject)=>
             ConvertDbObjectToResponseObject(eachObject)
         )
     );
}); 
//Returns a state based on the state ID 
app.get("/states/:stateId/",async (request,response)=>{   
     const{stateId} = request.params;
     const stateQuery = `
     SELECT 
     * 
     FROM 
     state 
     WHERE 
     state_id = ${stateId}`; 
     const stateDetails = await db.all(stateQuery);
     response.send(ConvertDbObjectToResponseObject(stateDetails));
}); 

//Create a district in the district table, `district_id` is auto-incremented
app.post("/districts/" ,async (request,response)=>{   
    const newDistrict = request.body;
    const{districtName,stateId,cases,cured,active,deaths} = newDistrict;
    const getNewDistrict = `
    INSERT INTO 
    district (district_name,
        state_id,
        cases,
        cured,
        active,
        deaths) 
        VALUES(
            '${districtName}',
            '${stateId}',
            '${cured}',
            '${cases}',
            '${active}',
            '${deaths}')`; 
             const dbResponse = await db.run(getNewDistrict); 
             const newDistrictDetails = dbResponse.lastID;
             response.send("District Successfully Added");

}); 
//Returns a district based on the district ID
app.get("/districts/:districtId/",async (request,response)=>{   
    const {districtId} = request.params;
    const districtDetails = `
    SELECT 
    * 
    FROM 
    district
    WHERE 
    district_id = ${districtId}`;

    const districtArray = await db.get(districtDetails);
    response.send(ConvertDbObjectToResponseObject(districtArray));

    //Deletes a district from the district table based on the district ID
    app.delete("/districts/:districtId/",async (request,response)=>{   
        const {districtId} = request.params;
        const removeDistrict = `
        DELETE FROM 
        district 
        WHERE 
        district_id = ${districtId}`; 
        await db.run(removeDistrict); 
        response.send("District Removed")
    });

//Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/",async (request,response)=>{   
    const {districtId} = request.params;
    const districtDetails = request.body;
    const {
        districtName,
        stateId,
        cases,
        cured,
        active,
        deaths,
    } = districtDetails;
  const UpdateDistrictDetails = `
  UPDATE district SET 
           district_name :'${districtName}',
           state_id :'${stateId}',
          cases:'${cases}',  
         cured:'${cured}' ,
         active:'${active}',
         deaths :'${deaths}', 
         WHERE district_id:${districtId}`; 
       await db.run(UpdateDistrictDetails);
        response.send("District Details Updated");
}); 
//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/",async (request,response)=>{  
    const {stateId} = request.params;
    const stateQuery = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM district 
    WHERE 
    state_id = ${stateId}`;

    const stateDetails = await db.get(stateQuery);
    response.send({
           totalCases:stateDetails["SUM(cases)"],
           totalCured:stateDetails["SUM(cured)"],
           totalActive :stateDetails["SUM(active)"],
           totalDeaths:stateDetails[" SUM(deaths)"],
    });
}); 
//Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/" ,async (request,response)=>{   
    const {districtId} = request.params;
    const stateQuery = `
    SELECT state_name
    FROM state 
      NATURAL JOIN district 
      WHERE 
      district_id =${districtId}`;
      const stateName = await db.get(stateQuery);
      response.send(ConvertDbObjectToResponseObject(stateName));

}); 

module.exports = app;




 