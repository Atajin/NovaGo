/*
    Importation des modules requis
*/
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import oracledb from "oracledb";
import { body, check, validationResult } from "express-validator";
import dateFormat from "dateformat";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool;

async function initialiserBaseDeDonnees() {
    try {
        pool = await oracledb.createPool({
            user: "novago",
            password: "oracle",
            connectString: "localhost:1521/xe"
        });

        const connection = await pool.getConnection();
        console.log("Connexion à la base de données Oracle réussie !");

        await connection.close();
    } catch (err) {
        console.error("Impossible de se connecter à la base de données Oracle:", err);
    }
}

function getPool() {
    return pool;
}

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

async function demarrerServeur() {
    await initialiserBaseDeDonnees();

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

    app.post('/connexion', [
        check('mdp')
            .isLength({ min: 8 })
            .withMessage('Le mot de passe doit être au moins 8 charactères.'),
    ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors);
        }
        const { email, mdp } = req.body;
    });

    app.get('/inscription', (req, res) => {
        res.render('pages/inscription', {
            // variables
        });
    });
    app.post('/inscription', [
        check('prenom')
            .isLength({ min: 2 })
            .withMessage('Votre prénom doit être au moins 2 charactères.'),
        check('nom')
            .isLength({ min: 2 })
            .withMessage('Votre nom doit être au moins 2 charactères.'),
        check('email')
            .isLength({ min: 8 })
            .withMessage('Votre courriel doit être au moins 8 charactères.')
            .isEmail()
            .custom(async value => {
                const emailUtilise = await utilisateurs.findByEmail(value);
                if (emailUtilise) {
                  throw new Error('Cette adresse courrielle est déjà utilisée');
                }
              }),
        check('mdp')
            .isLength({ min: 8 })
            .withMessage('Votre mot de passe doit être au moins 8 charactères.'),
        check('confirmation')
            .equals('mdp')
            .withMessage('Le mot de passe doit être recopié correctement.'),
    ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors);
        }
        const { prenom, nom, email, mdp, planete } = req.body;
    });

    app.get('/reservation', (req, res) => {
        res.render('pages/reservation', {
            // variables
        });
    });

    app.get('/exploration', (req, res) => {
        res.render('pages/exploration', {
            // variables
        });
    });

    app.get('/recu-billet', (req, res) => {
        res.render('pages/recu-billet', {
            // variables
        });
    });

    // Démarrage du serveur après la tentative de connexion à la base de données.
    const server = app.listen(4000, function () {
        console.log("serveur fonctionne sur 4000... !");
    });
}

demarrerServeur().catch(err => console.error("Erreur lors du démarrage du serveur:", err));