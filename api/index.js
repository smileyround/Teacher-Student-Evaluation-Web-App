import * as dotenv from 'dotenv'
dotenv.config()
import express from "express";
import pkg from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import { auth } from  'express-oauth2-jwt-bearer'
import https from 'https';
import bodyParser from 'body-parser';
import requestIp from 'request-ip';
// this is a middleware that will validate the access token sent by the client

const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: 'RS256'
});

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// this is a public endpoint because it doesn't have the requireAuth middleware
app.get("/ping", (req, res) => {
  res.send("pong");
});

app.post("/tutor/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { content } = req.body;

  if (!content) {
    res.status(400).send("content is required");
  } else {
    const newReview = await prisma.review.create({
      data: {
        content,
        
        user: {

          connect: {
            id: id, 
          },
        },
      },
    });

    res.status(201).json(newReview);
  }
});


app.get("/guest", async (req, res) => {
  
  const usersWithSubjects = await prisma.user.findMany({ 
    include: {
      subjects: true, // Include the subjects relation for each user
      reviews:true,
    },
  });
  res.json(usersWithSubjects);
});

// requireAuth middleware will validate the access token sent by the client and will return the user information within req.auth
app.get("/subjects", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  // console.log(req.auth)

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  const subjects = await prisma.subject.findMany({
    where: {
      userId: user.id,
    },
  });

  res.json(subjects);
});

// creates a todo item
app.post("/subjects", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const { title, description } = req.body;

  if (!title) {
    res.status(400).send("title is required");
  } else {
    const newSubject = await prisma.subject.create({
      data: {
        title,
        description,
        user: { connect: { auth0Id } },
      },
    });

    res.status(201).json(newSubject);
  }
});

// deletes a todo item by id
app.delete("/subjects/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const deletedItem = await prisma.subject.delete({
    where: {
      id,
    },
  });
  res.json(deletedItem);
});

// get a todo item by id
app.get("/subjects/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const subject = await prisma.subject.findUnique({
    where: {
      id,
    },
  });
  res.json(subject);
});

// updates a todo item by id
app.put("/subjects/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, description } = req.body;
  const updatedItem = await prisma.subject.update({
    where: {
      id,
    },
    data: {
      title,
      description,
    },
  });
  res.json(updatedItem);
});

// get Profile information of authenticated user
app.get("/me", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  res.json(user);
});

// this endpoint is used by the client to verify the user status and to make sure the user is registered in our database once they signup with Auth0
// if not registered in our database we will create it.
// if the user is already registered we will return the user information
app.post("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const email = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`];
  const name = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/name`];

  console.log("Token Payload:", req.auth.payload);

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (user) {
    res.json(user);
  } else {
    const newUser = await prisma.user.create({
      data: {
        email,
        auth0Id,
        name,
      },
    });

    res.json(newUser);
  }
});

//get weather api
app.get("/weather", function(req, res) {
  const query = "Vancouver";
  const apiKey = "7eff2845829801d6f867558523b1dac0";
  const unit = "metric";
  const url = "https://api.openweathermap.org/data/2.5/weather?q=" + query + "&appid=" + apiKey +"&units=" + unit;
  https.get(url, function(response){
    console.log(response.statusCode);

    response.on("data", function(data){
      const weatherData = JSON.parse(data)
      const temp = weatherData.main.temp
      const weatherDescription = weatherData.weather[0].description
      //const icon = weatherData.weather[0].icon
      // const imageURL = "http://openweathermap.org/img/wn/" + icon + "@2x.png"
      // res.write("<img src = " + imageURL + ">");
      res.write("The weather in Vancouver is " + weatherDescription);
      res.send()
      console.log(weatherData);
    })
  })
});

// Server-side route for weather data
app.post("/weather", function(req, res) {
  const cityName = req.body.cityName;
  const apiKey = "7eff2845829801d6f867558523b1dac0";
  const unit = "metric";
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=${unit}`;

  https.get(url, function(response){
    let weatherData = '';

    response.on("data", function(data){
      weatherData += data;
    });

    response.on("end", function(){
      const parsedWeatherData = JSON.parse(weatherData);
      res.json(parsedWeatherData);
    });
  });
});

const PORT = parseInt(process.env.PORT) || 8000;
app.listen(PORT, () => {
  console.log("Server running on http://localhost:${PORT} 🎉 🚀");
});