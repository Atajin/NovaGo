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

    app.get('/', async (req, res) => {
        try {
            // Passer les données obtenues au moteur de rendu
            res.render('pages/index', { connexion: "", origine: "", destination: "" });
        } catch (err) {
            console.error(err);
            res.render('pages/index', { erreur: 'Une erreur s\'est produite lors de la récupération des données de la base de données' });
        }
    });

    app.get('/connexion', (req, res) => {
        res.render('pages/connexion', { erreur: "" });
    });

    app.post('/connexion', async (req, res) => {
        try {
            const { email, mdp } = req.body;

            // Obtention d'une connexion à partir du pool
            const connection = await getPool().getConnection();

            // Exécution de la requête pour vérifier l'email et le mot de passe
            const result = await connection.execute(
                `SELECT * FROM UTILISATEUR WHERE EMAIL = :email AND MOT_DE_PASSE = :mdp`,
                { email: email, mdp: mdp },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            if (result.rows.length > 0) {
                // Exécution de la requête pour récupérer l'ID de la planète associée à l'utilisateur
                const planetResult = await connection.execute(
                    `SELECT planete_id_planete FROM utilisateur WHERE id_utilisateur = :utilID`,
                    { utilID: result.rows[0].ID_UTILISATEUR },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );

                if (planetResult.rows.length > 0) {
                    // Exécution de la requête pour récupérer le nom de la planète
                    const nomPlaneteResult = await connection.execute(
                        `SELECT nom FROM planete WHERE id_planete = :planeteID`,
                        { planeteID: planetResult.rows[0].PLANETE_ID_PLANETE },
                        { outFormat: oracledb.OUT_FORMAT_OBJECT }
                    );
                    return res.render('pages/', { connexion: 'Connexion au compte effectuée avec succès!', origine: nomPlaneteResult.rows[0].NOM });
                }
            } else {
                // L'utilisateur n'existe pas ou le mot de passe est incorrect
                return res.render('pages/connexion', { erreur: 'Courriel ou mot de passe incorrect' });
            }
        } catch (err) {
            console.error(err);
            return res.render('pages/connexion', { erreur: 'Erreur lors de la connexion à la base de données' });
        }
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
        const data = matchedData(req);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send(`Errors: ${errors}!`);
        }
    });

    app.get('/reservation', (req, res) => {
        res.render('pages/reservation', {
            // variables
        });
    });

    app.get('/exploration', async (req, res) => {
        try {
            const connection = await getPool().getConnection();
            const result = await connection.execute("SELECT * FROM PLANETE");
            await connection.close();

            res.render('pages/exploration', {
                items: result.rows
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Erreur lors de la récupération des données');
        }
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