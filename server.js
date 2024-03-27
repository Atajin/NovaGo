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
import { connect } from "http2";

//const stripe = require('stripe')('sk_test_51OyhQ9HnZinsmfjjIC2WMi0WX4MeknqPktZdbrEWHNhibQL4SOlHC8fvohjiMYeZqcJG1kzSF0KEaQFiCZjetdx9009ovLcic3');

const app = express();
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const saltRounds = 10

let pool;
let estConnecte;

//Permet de comparer deux champs différents d'express-validator
const validationMdpEgal = (value, { req }) => {
    if (value !== req.body.confirmation) {
        throw new Error('Le mot de passe doit être recopié correctement.');
    }
    return true;
};

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
        return null;
    }
}

async function recupererPlanetes(connection){
    const result = await connection.execute("SELECT * FROM PLANETE");
    await connection.close();
    return result;
}

async function trouverPlaneteUtil(connection, id_util){
    // Exécution de la requête pour récupérer l'ID de la planète associée à l'utilisateur
    const planetUtil = await connection.execute(
        `SELECT planete_id_planete FROM utilisateur WHERE id_utilisateur = :utilID`,
        { utilID: id_util },
        { outFormat: oracledb.OUT_FORMAT_ARRAY }
    );
    return planetUtil;
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
    cookie: { maxAge: 300000 },
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
        Page d'accueil du site, contient un formulaire pour rechercher un voyage
    */
    app.route('/')
    /*
        Affichage de la page d'accueil
        paramètres du render : connexion, origine, destination
    */
    .get(async (req, res) => {
        let result = "";
        try {
            let estConnecte = req.session.email && req.session.mdp;
            
            const connection = await getPool().getConnection();
            result = await recupererPlanetes(connection);
            // Passer les données obtenues au moteur de rendu
            res.render('pages/', {
                connexion: "",
                origine: "",
                destination: "",
                planetes: result.rows,
                estConnecte: estConnecte
            });
        } catch (err) {
            console.error(err);
            res.render('pages/', { erreur: 'Une erreur s\'est produite lors de la récupération des données de la base de données' });
        }
    });    

    /*
        Page de connexion au compte utilisateur,
        contient un formulaire pour soumettre un courriel et mot de passe utilisateur
    */
    app.route('/connexion')
    /*
        Affichage de la page de connexion
        paramètres du render : erreur, estConnecte
    */
    .get((req, res) => {
        estConnecte = req.session.email && req.session.mdp;
        res.render('pages/connexion', { erreur: "", estConnecte: estConnecte });
    })
    /*
        POST du formulaire de la page de connexion
    */
    .post(async (req, res) => {
        try {
            estConnecte = req.session.email && req.session.mdp;
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
                    const planeteResult = await trouverPlaneteUtil(connection, result.rows[0].ID_UTILISATEUR);

                    const listePlanetes = await recupererPlanetes(connection);
                    let planeteID = 0;
                    if (planeteResult.rows.length > 0) {
                        //Ajout des informations nécessaires à la session
                        req.session.email = email;
                        req.session.mdp = result.rows[0].MOT_DE_PASSE;
                        estConnecte = req.session.email && req.session.mdp;
                        planeteID = Number(planeteResult.rows[0]);
                        return res.render('pages/', { connexion: 'Connexion au compte effectuée avec succès!', origine: planeteID, planetes: listePlanetes.rows, estConnecte: estConnecte });
                    }
                } else {
                    // Le mot de passe est incorrect
                    return res.render('pages/connexion', { erreur: 'Mot de passe incorrect', estConnecte: estConnecte });
                }
            } else {
                // L'utilisateur n'existe pas
                return res.render('pages/connexion', { erreur: "L'utilisateur n'existe pas", estConnecte: estConnecte });
            }
        } catch (err) {
            console.error(err);
            return res.render('pages/connexion', { erreur: 'Erreur lors de la connexion à la base de données', estConnecte: estConnecte });
        }
    });

    
    /*
        Affichage de la page de création de compte utilisateur,
        contient le formulaire de soumission de l'information du nouveau compte
    */
    app.route('/inscription')
    /*
        Affichage de la page d'inscription
        paramètres de render : planetes, erreur, estConnecte
    */
    .get(async (req, res) => {
        let result = "";
        try {
            estConnecte = req.session.email && req.session.mdp;
            const erreur = "";
            const connection = await getPool().getConnection();
            result = await recupererPlanetes(connection);

            res.render('pages/inscription', {
                planetes: result.rows,
                erreur: erreur,
                estConnecte: estConnecte
            });
        } catch (err) {
            console.error(err);
            res.render('pages/inscription', {
                planetes: result.rows,
                erreur: 'Une erreur s\'est produite lors de la récupération des données de la base de données',
                estConnecte: estConnecte
            });
        }
    })
    /*
        POST du formulaire de la page d'inscription
    */
    .post([
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
        estConnecte = req.session.email && req.session.mdp;
        try {
            const connection = await getPool().getConnection();
            planetes = await recupererPlanetes(connection);
        } catch (err) {
            console.error(err);
            return res.render('pages/inscription', { planetes: planetes.rows, erreur: 'Erreur lors de la connexion à la base de données', estConnecte: estConnecte });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('pages/inscription', { erreur: errors.array().map(error => error.msg).join(' '), planetes: planetes.rows, estConnecte: estConnecte });
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
                return res.render('pages/inscription', { erreur: 'Cette adresse courriel est déjà utilisée.', planetes: planetes.rows, estConnecte: estConnecte });
            } else {
                // L'utilisateur n'existe pas
                try {
                    // Obtention d'une connexion à partir du pool
                    const connection = await getPool().getConnection();
                    let hashedMdp = await hashMotDePasse(mdp, saltRounds);

                    // Exécution de l'insertion de données dans la BD
                    await connection.execute(
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

                    const nouvel_util = await connection.execute("SELECT MAX(ID_UTILISATEUR) FROM utilisateur");
                    const id_nouvel_util = Number(nouvel_util.rows);
                    const planete_util = await trouverPlaneteUtil(connection, id_nouvel_util);

                    const planete_id = Number(planete_util.rows[0]);

                    await connection.close();
                    
                    req.session.email = email;
                    req.session.mdp = hashedMdp;
                    estConnecte = req.session.email && req.session.mdp;
                    
                    return res.render('pages/', { connexion: 'Compte créé avec succès!', planetes: planetes.rows, origine: planete_id, destination: "", estConnecte: estConnecte });

                } catch (err) {
                    console.error(err);
                    return res.render('pages/inscription', { erreur: 'Erreur lors de la connexion à la base de données', planetes: planetes.rows, estConnecte: estConnecte });
                }

            }
        } catch (err) {
            console.error(err);
            return res.render('pages/inscription', { erreur: 'Erreur lors de la connexion à la base de données', planetes: planetes.rows, estConnecte: estConnecte });
        }
    });

    app.route('/reservation')
        .get(async (req, res) => {
            try {
                estConnecte = req.session.email && req.session.mdp;
                const email = req.session.email;
                if (estConnecte) {
                    const connection = await getPool().getConnection();

                    // Exécution de la requête pour vérifier l'email
                    const result = await connection.execute(
                        `SELECT * FROM UTILISATEUR WHERE EMAIL = :email`,
                        { email: email },
                        { outFormat: oracledb.OUT_FORMAT_OBJECT }
                    );

                    if (result.rows.length > 0) {
                        res.render('pages/reservation', { estConnecte: estConnecte });
                    }
                } else res.render('pages/connexion', { erreur: 'Connectez vous pour réserver un voyage', estConnecte: estConnecte });
            } catch (err) {
                console.error(err);
                return res.render('pages/inscription', { erreur: 'Erreur lors de la connexion à la base de données', planetes: planetes, estConnecte: estConnecte });
            }
        });

    app.route('/exploration')
        .get(async (req, res) => {
            let result = "";
            try {
                estConnecte = req.session.email && req.session.mdp;
                const connection = await getPool().getConnection();
                result = await connection.execute("SELECT * FROM PLANETE");
                await connection.close();

                res.render('pages/exploration', {
                    items: result.rows,
                    erreur: "",
                    estConnecte: estConnecte
                });
            } catch (err) {
                console.error(err);
                res.render('pages/exploration', { items: result.rows, erreur: 'Une erreur s\'est produite lors de la récupération des données de la base de données', estConnecte: estConnecte });
            }
        })
        .post((req, res) => {
            res.send();
        });

    app.route('/recu-billet')
        .get((req, res) => {
            estConnecte = req.session.email && req.session.mdp;
            res.render('pages/recu-billet', {
                estConnecte: estConnecte
            })
        });

    // Démarrage du serveur après la tentative de connexion à la base de données.
    const server = app.listen(4000, function () {
        console.log("serveur fonctionne sur 4000... !");
    });

    /*
        Accès à la page de déconnexion
        paramètres : -
    */
    app.get('/deconnexion', async (req, res) => {
        const connection = await getPool().getConnection();
        const planetes = await recupererPlanetes(connection);
        if (req.session.email) {
            req.session.destroy();
            estConnecte = false;
            

            res.render('pages/', {
                connexion: "Déconnexion réussie!",
                planetes: planetes.rows,
                origine: "", destination: "",
                estConnecte: estConnecte
            });
        } else {
            try {
                estConnecte = req.session.email && req.session.mdp;
                // Passer les données obtenues au moteur de rendu
                res.render('pages/', { connexion: "", origine: "", destination: "", planetes: planetes.rows, estConnecte: estConnecte });
            } catch (err) {
                console.error(err);
                res.render('pages/', { erreur: 'Une erreur s\'est produite lors de la récupération des données de la base de données', planetes: planetes.rows, estConnecte: estConnecte });
            }
        }
    });
}
demarrerServeur().catch(err => console.error("Erreur lors du démarrage du serveur:", err));