/*
    Importation des modules requis
*/
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql";
import { body, validationResult } from "express-validator";
import dateFormat from "dateformat";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
    Connection au serveur
*/
const server = app.listen(4000, function () {
    console.log("serveur fonctionne sur 4000... ! ");
});

/*
    Configuration de EJS
*/
app.set("views", path.join(__dirname, "..", "views"));
app.set("view engine", "ejs");

/*
    Importation de Bootstrap
*/
app.use("/js", express.static(__dirname + "/node_modules/bootstrap/dist/js"));
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));

/*
    Permettre l'utilisation de body lors des POST request
*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('pages/index', {
        // variables
    });
});