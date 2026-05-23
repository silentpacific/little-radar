import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();

app.use(cors());
app.use(express.static("public"));

const creds =
JSON.parse(
fs.readFileSync(
"./credentials.json",
"utf8"
)
);

let token=null;

async function getToken(){

if(token)
return token;

const body=
new URLSearchParams({

grant_type:"client_credentials",

client_id:
creds.clientId,

client_secret:
creds.clientSecret

});

const r=

await fetch(

"https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token",

{

method:"POST",

headers:{
"Content-Type":
"application/x-www-form-urlencoded"
},

body

}

);

const data=
await r.json();

token=
data.access_token;

return token;

}

function km(
lat1,
lon1,
lat2,
lon2
){

const R=6371;

const dLat=
(lat2-lat1)
*
Math.PI
/
180;

const dLon=
(lon2-lon1)
*
Math.PI
/
180;

const a=

Math.sin(dLat/2)**2+

Math.cos(
lat1*Math.PI/180
)

*

Math.cos(
lat2*Math.PI/180
)

*

Math.sin(dLon/2)**2;

return R*2*Math.atan2(
Math.sqrt(a),
Math.sqrt(1-a)
);

}

app.get("/planes",

async(req,res)=>{

try{

const lat=
parseFloat(
req.query.lat
);

const lon=
parseFloat(
req.query.lon
);

const radius=
parseFloat(
req.query.radius
);

console.log(
{
lat,
lon,
radius
}
);

const access=
await getToken();

const response=
await fetch(

"https://opensky-network.org/api/states/all",

{

headers:{

Authorization:
`Bearer ${access}`

}

}

);

const data=
await response.json();

const nearby=[];

for(

const p

of

data.states||

[]

){

if(
!p[5]
||
!p[6]
)
continue;

const d=

km(

lat,

lon,

p[6],

p[5]

);

if(
d<=radius
){

nearby.push({

flight:
p[1],

distance:
d,

heading:
p[10]

});

}

}

console.log(
"Nearby:",
nearby.length
);

res.json(
nearby
);

}

catch(e){

console.log(
e
);

res.json([]);

}

});

app.listen(

3000,

()=>{

console.log(
"Little Radar running"
);

});