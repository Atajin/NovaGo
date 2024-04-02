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
import Stripe from 'stripe';

const stripe = new Stripe('sk_test_51OyhQ9HnZinsmfjjIC2WMi0WX4MeknqPktZdbrEWHNhibQL4SOlHC8fvohjiMYeZqcJG1kzSF0KEaQFiCZjetdx9009ovLcic3');

const app = express();
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const saltRounds = 10

let pool;
let est_connecte;

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
        paramètres du render : planete_origine, planete_destination, planetes_bd, message_negatif, message_positif, est_connecte
    */
    .get(async (req, res) => {
        try {
            const connection = await getPool().getConnection();
            const result = await recupererPlanetes(connection);
            // Passer les données obtenues au moteur de rendu
            res.render('pages/', {
                planetes_bd: result.rows,
                est_connecte: req.session.email && req.session.mdp
            });
        } catch (err) {
            console.error(err);
            res.render('pages/', { message_negatif: 'Une erreur s\'est produite lors de la récupération des données de la base de données' });
        }
    });    

    /*
        Page de connexion au compte utilisateur,
        contient un formulaire pour soumettre un courriel et mot de passe utilisateur
    */
    app.route('/connexion')
    /*
        Affichage de la page de connexion
        paramètres du render : message_negatif, est_connecte
    */
    .get((req, res) => {
        res.render('pages/connexion', { 
            est_connecte: req.session.email && req.session.mdp
        });
    })
    /*
        POST du formulaire de la page de connexion
    */
    .post(async (req, res) => {
        try {
            est_connecte = req.session.email && req.session.mdp;
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
                        est_connecte = req.session.email && req.session.mdp;
                        planeteID = Number(planeteResult.rows[0]);
                        return res.render('pages/', { message_positif: 'Connexion au compte effectuée avec succès!', planete_origine: planeteID, planetes_bd: listePlanetes.rows, est_connecte: est_connecte });
                    }
                } else {
                    // Le mot de passe est incorrect
                    return res.render('pages/connexion', { message_negatif: 'Mot de passe incorrect', est_connecte: est_connecte });
                }
            } else {
                // L'utilisateur n'existe pas
                return res.render('pages/connexion', { message_negatif: "L'utilisateur n'existe pas", est_connecte: est_connecte });
            }
        } catch (err) {
            console.error(err);
            return res.render('pages/connexion', { message_negatif: 'Erreur lors de la connexion à la base de données', est_connecte: est_connecte });
        }
    });

    
    /*
        Affichage de la page de création de compte utilisateur,
        contient le formulaire de soumission de l'information du nouveau compte
    */
    app.route('/inscription')
    /*
        Affichage de la page d'inscription
        paramètres de render : planetes_bd, message_negatif, est_connecte
    */
    .get(async (req, res) => {
        let result = "";
        try {
            est_connecte = req.session.email && req.session.mdp;
            const connection = await getPool().getConnection();
            result = await recupererPlanetes(connection);

            res.render('pages/inscription', {
                planetes_bd: result.rows,
                est_connecte: est_connecte
            });
        } catch (err) {
            console.error(err);
            res.render('pages/inscription', {
                planetes_bd: result.rows,
                message_negatif: 'Une erreur s\'est produite lors de la récupération des données de la base de données',
                est_connecte: est_connecte
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
        let planetes_bd;
        est_connecte = req.session.email && req.session.mdp;
        try {
            const connection = await getPool().getConnection();
            planetes_bd = await recupererPlanetes(connection);
        } catch (err) {
            console.error(err);
            return res.render('pages/inscription', { planetes_bd: planetes.rows, message_negatif: 'Erreur lors de la connexion à la base de données', est_connecte: est_connecte });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('pages/inscription', { message_negatif: errors.array().map(error => error.msg).join(' '), planetes_bd: planetes_bd.rows, est_connecte: est_connecte });
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
                return res.render('pages/inscription', { message_negatif: 'Cette adresse courriel est déjà utilisée.', planetes_bd: planetes_bd.rows, est_connecte: est_connecte });
            } else {
                // L'utilisateur n'existe pas
                try {
                    // Obtention d'une connexion à partir du pool
                    const connection = await getPool().getConnection();
                    let hashedMdp = await hashMotDePasse(mdp, saltRounds);

                    //la BD n'accepte que les chiffres
                    const telephone_numerique = telephone.replace(/\D/g,"");

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
                            telephone: telephone_numerique,
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
                    est_connecte = req.session.email && req.session.mdp;
                    
                    return res.render('pages/', { message_positif : 'Compte créé avec succès!', planetes_bd: planetes_bd.rows, planete_origine: planete_id, est_connecte: est_connecte });

                } catch (err) {
                    console.error(err);
                    return res.render('pages/inscription', { message_negatif: 'Erreur lors de la connexion à la base de données', planetes_bd: planetes_bd.rows, est_connecte: est_connecte });
                }

            }
        } catch (err) {
            console.error(err);
            return res.render('pages/inscription', { message_negatif: 'Erreur lors de la connexion à la base de données', planetes_bd: planetes_bd.rows, est_connecte: est_connecte });
        }
    });

    /*
        Affichage de la page de réservation de voyages,
        contient le formulaire de soumission de l'information du voyage choisi
    */
    app.route('/reservation')
        /*
            Accès à la page de réservation
            paramètres : est_connecte
        */
        .get(async (req, res) => {
            try {
                est_connecte = req.session.email && req.session.mdp;
                const email = req.session.email;
                if (est_connecte) {
                    const connection = await getPool().getConnection();

                    // Exécution de la requête pour vérifier l'email
                    const result = await connection.execute(
                        `SELECT * FROM UTILISATEUR WHERE EMAIL = :email`,
                        { email: email },
                        { outFormat: oracledb.OUT_FORMAT_OBJECT }
                    );

                    if (result.rows.length > 0) {
                        res.render('pages/reservation', {
                            est_connecte: est_connecte
                        });
                    }
                } else res.render('pages/connexion', {
                    message_negatif: 'Connectez vous pour réserver un voyage',
                    est_connecte: est_connecte
                });
            } catch (err) {
                console.error(err);
                return res.render('pages/inscription', { message_negatif: 'Erreur lors de la connexion à la base de données', planetes_bd: planetes_bd, est_connecte: est_connecte });
            }
        });

    
    app.route('/exploration')
        /*
            Accès à la page d'exploration
            paramètres : message_negatif, planetes_bd, est_connecte
        */
        .get(async (req, res) => {
            try {
                est_connecte = req.session.email && req.session.mdp;
                const connection = await getPool().getConnection();
                const result = await connection.execute("SELECT * FROM PLANETE");
                await connection.close();

                res.render('pages/exploration', {
                    planetes_bd: result.rows,
                    est_connecte: est_connecte
                });
            } catch (err) {
                console.error(err);
                res.render('pages/exploration', { message_negatif: 'Une erreur s\'est produite lors de la récupération des données de la base de données', est_connecte: est_connecte });
            }
        })
        /*
            POST du formulaire de la page d'exploration
            paramètres : -
        */
        .post(async (req, res) => {
            const connection = await getPool().getConnection();
            const planetes_bd = await recupererPlanetes(connection);
            const id_planete_max = planetes_bd.rows.length;
            let planete_destination = 0;
            for (let i = 0; i < id_planete_max; i++){
                //if (id_planete_[i].value == checked){
                    planete_destination = i;
                /*}
                planete_destination = (id_planete_);*/
            }
            res.render('pages/', { planetes_bd: planetes_bd.rows, planete_destination: id_planete_max, est_connecte: est_connecte });
        });

    app.route('/recu-billet')
        /*
            Accès à la page de reçu
            paramètres : est_connecte
        */
        .get((req, res) => {
            est_connecte = req.session.email && req.session.mdp;
            res.render('pages/recu-billet', {
                est_connecte: est_connecte
            })
        });

    // Démarrage du serveur après la tentative de connexion à la base de données.
    const server = app.listen(4000, function () {
        console.log("serveur fonctionne sur 4000... !");
    });

    /*
        Accès à la page de déconnexion
        paramètres : message_positif, planetes_bd, est_connecte
    */
    app.get('/deconnexion', async (req, res) => {
        const connection = await getPool().getConnection();
        const planetes_bd = await recupererPlanetes(connection);
        if (req.session.email) {
            req.session.destroy();
            est_connecte = false;

            res.render('pages/', {
                message_positif: "Déconnexion réussie!",
                planetes_bd: planetes_bd.rows,
                est_connecte: est_connecte
            });
        } else {
            try {
                res.render('pages/', { planetes_bd: planetes_bd.rows });
            } catch (err) {
                console.error(err);
                res.render('pages/', { message_negatif: 'Une erreur s\'est produite lors de la récupération des données de la base de données' });
            }
        }
    });
}
demarrerServeur().catch(err => console.error("Erreur lors du démarrage du serveur:", err));