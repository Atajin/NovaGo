/*
    Importation des modules requis
*/
import express from "express";
import session from "express-session";
const store = new session.MemoryStore();
import path from "path";
import { fileURLToPath } from "url";
import oracledb from "oracledb";
import { body, check, validationResult } from "express-validator";
import dateFormat from "dateformat";
import bcrypt from "bcrypt";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const saltRounds = 10

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

async function hashMotDePasse(mdp, saltRounds) {
    try {
        const hash = await bcrypt.hash(mdp, saltRounds);
        return hash;
    } catch (err) {
        console.error(err);
        return null; // Or handle error as you prefer
    }
}

/*
    Configuration des fichiers statiques
*/
app.use(express.static('static'));

/*
    Configuration des sessions utilisateur
*/
app.use(session({
    secret: 'wuy*&3u1hiur&wj/?8o71jhiohj5)iu',
    cookie: {maxAge: 300000},
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store
}));

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

/*
    Démarrage du serveur et du routage
*/
async function demarrerServeur() {
    await initialiserBaseDeDonnees();

    /*
        Affichage de la page d'accueil
        paramètres : connexion, origine, destination
    */
    app.get('/', async (req, res) => {
        try {
            // Passer les données obtenues au moteur de rendu
            res.render('pages/', { connexion: "", origine: "", destination: "" });
        } catch (err) {
            console.error(err);
            res.render('pages/', { erreur: 'Une erreur s\'est produite lors de la récupération des données de la base de données' });
        }
    });

    /*
        Accès à la page de déconnexion
        paramètres : -
    */
    app.get('/deconnexion', (req, res) => {
        if (req.session.email) {
            req.session.destroy();

            //Affichage à l'utilisateur de
            res.render('pages/', {
                connexion: "Déconnexion réussie!",
                origine: "", destination: ""
            });
        } else {
            try {
                // Passer les données obtenues au moteur de rendu
                res.render('pages/', { connexion: "", origine: "", destination: "" });
            } catch (err) {
                console.error(err);
                res.render('pages/', { erreur: 'Une erreur s\'est produite lors de la récupération des données de la base de données' });
            }
        }
    });

    /*
        Affichage de la page de connexion
        paramètres : -
    */
    app.get('/connexion', (req, res) => {
        res.render('pages/connexion', { erreur: "" });
    });

    /*
        POST du formulaire de la page de connexion
        paramètres : -
    */
    app.post('/connexion', async (req, res) => {
        try {
            const { email, mdp } = req.body;

            // Obtention d'une connexion à partir du pool
            const connection = await getPool().getConnection();

            // Exécution de la requête pour vérifier l'email
            const result = await connection.execute(
                `SELECT * FROM UTILISATEUR WHERE EMAIL = :email`,
                { email: email },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            if (result.rows.length > 0) {
                const mdp_valide = await bcrypt.compare(mdp, result.rows[0].MOT_DE_PASSE);
                if (mdp_valide) {
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
                        
                        //Ajout des informations nécessaires à la session
                        req.session.email = email;
                        req.session.mdp = result.rows[0].MOT_DE_PASSE;

                        return res.render('pages/', { connexion: 'Connexion au compte effectuée avec succès!', origine: nomPlaneteResult.rows[0].NOM });
                    }
                } else {
                    // Le mot de passe est incorrect
                    return res.render('pages/connexion', { erreur: 'Mot de passe incorrect' });
                }
            } else {
                // L'utilisateur n'existe pas
                return res.render('pages/connexion', { erreur: "L'utilisateur n'existe pas" });
            }
        } catch (err) {
            console.error(err);
            return res.render('pages/connexion', { erreur: 'Erreur lors de la connexion à la base de données' });
        }
    });

    /*
        Affichage de la page d'inscription
        paramètres : planetes, erreur
    */
    app.get('/inscription', async (req, res) => {
        let result = "";
        try {
            const erreur = "";
            const connection = await getPool().getConnection();
            result = await connection.execute("SELECT * FROM PLANETE");
            await connection.close();

            res.render('pages/inscription', {
                planetes: result.rows,
                erreur: erreur
            });
        } catch (err) {
            console.error(err);
            res.render('pages/inscription', {
                planetes: result.rows,
                erreur: 'Une erreur s\'est produite lors de la récupération des données de la base de données'
            });
        }
    });

    const validationMdpEgal = (value, { req }) => {
        if (value !== req.body.confirmation) {
            throw new Error('Le mot de passe doit être recopié correctement.');
        }
        return true;
    };

    app.post('/inscription', [
        check('prenom')
            .isLength({ min: 2 })
            .withMessage('Votre prénom doit être au moins 2 charactères.'),
        check('prenom')
            .isLength({ max: 50 })
            .withMessage('Votre prénom doit être au plus 50 charactères.'),
        check('nom')
            .isLength({ min: 2 })
            .withMessage('Votre nom doit être au moins 2 charactères.'),
        check('nom')
            .isLength({ max: 50 })
            .withMessage('Votre nom doit être au plus 50 charactères.'),
        check('email')
            .isEmail()
            .withMessage("L'adresse courriel saisie est invalide."),
        check('mdp')
            .isLength({ min: 8 })
            .withMessage('Votre mot de passe doit être au moins 8 charactères.'),
        check('mdp')
            .isLength({ max: 30 })
            .withMessage('Votre mot de passe doit être au plus 30 charactères.'),
        check('mdp')
            .custom(validationMdpEgal),
    ], async (req, res) => {
        let planetes;
        try {
            const connection = await getPool().getConnection();
            const result = await connection.execute("SELECT * FROM PLANETE");
            await connection.close();
            planetes = result.rows;
        } catch (err) {
            console.error(err);
            return res.render('pages/inscription', { planetes: result.rows, erreur: 'Erreur lors de la connexion à la base de données' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('pages/inscription', { erreur: errors.array().map(error => error.msg).join(' '), planetes: planetes });
        }
        const { prenom, nom, email, mdp, adresse, telephone, planete } = req.body;
        try {
            // Obtention d'une connexion à partir du pool
            const connection = await getPool().getConnection();

            // Exécution de la requête pour vérifier si l'email est utilisé
            const result = await connection.execute(
                `SELECT * FROM utilisateur WHERE email = :email`,
                { email: email },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            await connection.close();

            if (result.rows.length > 0) {
                // L'utilisateur existe
                return res.render('pages/inscription', { erreur: 'Cette adresse courriel est déjà utilisée.', planetes: planetes });
            } else {
                // L'utilisateur n'existe pas
                try {
                    // Obtention d'une connexion à partir du pool
                    const connection = await getPool().getConnection();

                    let hashedMdp = await hashMotDePasse(mdp, saltRounds);

                    // Exécution de l'insertion de données dans la BD
                    const result = await connection.execute(
                        `INSERT INTO utilisateur (email, mot_de_passe, nom, prenom, adresse, telephone, planete_id_planete)
                        VALUES ( :email, :mot_de_passe, :nom, :prenom, :adresse, :telephone, :planete_id_planete)`,
                        {
                            email: email,
                            mot_de_passe: hashedMdp,
                            nom: nom,
                            prenom: prenom,
                            adresse: adresse,
                            telephone: telephone,
                            planete_id_planete: planete
                        }
                    );
                    await connection.commit();
                    await connection.close();

                    return res.render('pages/', { connexion: 'Compte créé avec succès!', origine: "", destination: "" });

                } catch (err) {
                    console.error(err);
                    return res.render('pages/inscription', { erreur: 'Erreur lors de la connexion à la base de données', planetes: planetes });
                }

            }
        } catch (err) {
            console.error(err);
            return res.render('pages/inscription', { erreur: 'Erreur lors de la connexion à la base de données', planetes: planetes });
        }
    });

    app.get('/reservation', async (req, res) => {
        try{
            if (req.session.email && req.session.mdp){
                const connection = await getPool().getConnection();

                // Exécution de la requête pour vérifier l'email et le mot de passe
                const result = await connection.execute(
                    `SELECT * FROM UTILISATEUR WHERE EMAIL = :email AND MOT_DE_PASSE = :mdp`,
                    { email: req.session.email, mdp: req.session.mdp },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );

            if (result.rows.length > 0) {
                    res.render('pages/reservation', {});
                }
            } else res.render('pages/connexion', { erreur: 'Connectez vous pour réserver un voyage' });
        } catch (err) {
            console.error(err);
            return res.render('pages/inscription', { erreur: 'Erreur lors de la connexion à la base de données', planetes: planetes });
        }
    });

    app.get('/exploration', async (req, res) => {
        let result = "";
        try {
            const connection = await getPool().getConnection();
            result = await connection.execute("SELECT * FROM PLANETE");
            await connection.close();

            res.render('pages/exploration', {
                items: result.rows,
                erreur: ""
            });
        } catch (err) {
            console.error(err);
            res.render('pages/exploration', { items: result.rows, erreur: 'Une erreur s\'est produite lors de la récupération des données de la base de données' });
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