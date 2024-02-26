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
    Configuration des fichiers statiques
*/
app.use(express.static('static'));

/*
    Configuration de EJS
*/
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/*
    Importation de Bootstrap
*/
app.use("/js", express.static(__dirname + "/node_modules/bootstrap/dist/js"));
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));
app.use(express.static(__dirname + "/static/images"));

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

app.get('/connexion', (req, res) => {
    res.render('pages/connexion', {
        // variables
    });
});

app.get('/inscription', (req, res) => {
    res.render('pages/inscription', {
        // variables
    });
});


app.get('/reservation', (req, res) => {
    res.render('pages/reservation', {
        // variables
    });
});

app.get('/principal', (req, res) => {
    res.render('pages/principal', {
        // variables
    });
});

app.get('/recu-billet', (req, res) => {
    res.render('pages/recu-billet', {
        // variables
    });
});