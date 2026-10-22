// Servidor de Tarjetas ES: sirve la página y entrega el vocabulario.
const express = require("express");
const path = require("path");

const app = express();

// El hosting indica el puerto en process.env.PORT; en local usamos 3000.
const PORT = process.env.PORT || 3000;

// Cargamos el vocabulario una sola vez al arrancar.
const words = require("./words.json");

// Sirve los archivos de la carpeta public (HTML, CSS y JS).
app.use(express.static(path.join(__dirname, "public")));

// API: devuelve la lista completa de palabras en formato JSON.
app.get("/api/words", (req, res) => {
  res.json(words);
});

app.listen(PORT, () => {
  console.log(`Tarjetas ES funcionando en http://localhost:${PORT}`);
});
