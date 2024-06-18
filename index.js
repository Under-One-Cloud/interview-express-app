const express = require("express");
const fs = require("node:fs/promises");
const app = express();
const router = express.Router();

const port = 8080;

router.use((req, res, next) => {
  console.log("/" + req.method);
  next();
});

router.get("/:num", async (req, res) => {
  // Get route parameter
  const id = parseInt(req.params.num);

  // Verify and Validate
  if (id < 1 || id > 151) {
    res.send(`Only Red/Blue/Green/Yellow Are Real Pokémon To Me`);
    return;
  }

  // Load cache
  const cacheFile = await fs.open("cache.json", "r");
  const cacheBuffer = await cacheFile.readFile();
  const cacheData = JSON.parse(cacheBuffer.toString());
  await cacheFile.close();

  // Check cache
  const pokeCache = cacheData.filter((p) => {
    return p.id === id;
  });
  let json;
  if (pokeCache.length >= 1) {
    console.log("CACHE HIT");
    json = pokeCache[0];
  } else {
    console.log("CACHE MISS");
    const pokeData = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!pokeData.ok) {
      res.send("Invalid Response From PokeAPI");
      return;
    }
    json = await pokeData.json();
    cacheData.push(json);
    const cacheFile = await fs.open("cache.json", "w");
    await cacheFile.writeFile(JSON.stringify(cacheData));
    await cacheFile.close();
  }

  // Send response
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>${json.name}</title>
  </head>
  <body>
    <div id="root">
      <h1>${json.name} (#${id})</h1>
      <img src="${json.sprites.front_default}"></img>
      <audio controls src="${json.cries.latest}"></audio>
    </div>
  </body>
  </html>
  `);
});

app.use("/", router);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
