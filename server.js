/*
    Importation des modules requis
*/
import express from "express";
import session from "express-session";
const store = new session.MemoryStore();
import path from "path";
import { fileURLToPath } from "url";
import oracledb from "oracledb";
import { MongoClient } from "mongodb";
import { body, check, validationResult } from "express-validator";
import dateFormat from "dateformat";
import bcrypt from "bcrypt";
import { connect } from "http2";
import Stripe from 'stripe';
import { error } from "console";
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const MONGO_DB_URI = process.env.MONGO_DB_URI;
const app = express();
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const saltRounds = 10;

let pool;
let oracleConnexion;
let mongoConnexion;
let dbMongo;
let deconnecte = false;

// Permet de comparer deux champs différents d'express-validator
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

        oracleConnexion = await pool.getConnection();
        console.log("Connexion à la base de données Oracle réussie !");


        mongoConnexion = await connectToMongo(MONGO_DB_URI);
        dbMongo = mongoConnexion.db("test");
        console.log("Connexion à la base de données MongoDB réussie !");

    } catch (err) {
        console.error("Impossible de se connecter à la base de données Oracle ou MongoDB:", err);
    }
}

async function creer_session(token, date_creation, date_expiration, id_util) {
    await oracleConnexion.execute(
        `INSERT INTO session_util (token, date_creation, date_expiration, utilisateur_id_utilisateur)
    VALUES ( :token, :date_creation, :date_expiration, :utilisateur_id_utilisateur)`,
        {
            token: token,
            date_creation: date_creation,
            date_expiration: date_expiration,
            utilisateur_id_utilisateur: id_util
        }
    );
    console.log("Session créée !");
}

async function fermer_session(token) {
    await oracleConnexion.execute(
        `UPDATE session_util SET date_expiration = :date_SQL WHERE token = :token`,
        {
            token: token,
            date_SQL: new Date()
        }
    );
    console.log("Session fermée !");
}

function getPool() {
    return pool;
}

async function connectToMongo(uri) {
    let mongoClient;

    try {
        mongoClient = new MongoClient(uri)

        //await mongoClient.connect();

        return mongoClient;
    } catch (err) {
        console.error("Impossible de se connecter à la base de données MongoDB:", err);
    }
}

async function hashMotDePasse(mdp, saltRounds) {
    try {
        const hash = await bcrypt.hash(mdp, saltRounds);
        return hash;
    } catch (err) {
        console.error("Erreur lors du hashage du mot de passe:", err);
        return null;
    }
}

async function recupererPlanetes() {
    try {
        const result = await oracleConnexion.execute("SELECT * FROM PLANETE");
        return result;
    } catch (err) {
        console.error("Impossible de se connecter à la base de données Oracle:", err);
        return null;
    }
}

async function recupererVoyages(planeteAller, planeteRetour, voyageAllerRetour) {
    let voyageResult;
    if (voyageAllerRetour) {
        voyageResult = await oracleConnexion.execute(
            `SELECT * FROM voyage WHERE (planete_id_planete = :planeteAller AND PLANETE_ID_PLANETE2 = :planeteRetour OR planete_id_planete2 = :planeteAller AND PLANETE_ID_PLANETE = :planeteRetour) AND DATE_DEPART > SYSDATE`,
            {
                planeteAller: planeteAller,
                planeteRetour: planeteRetour
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (voyageResult.rows.length == 0) {
            voyageResult = await oracleConnexion.execute(
                `SELECT * FROM voyage WHERE (planete_id_planete = :planeteAller OR planete_id_planete = :planeteRetour) AND DATE_DEPART > SYSDATE`,
                {
                    planeteAller: planeteAller,
                    planeteRetour: planeteRetour
                },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
        }
    } else {
        voyageResult = await oracleConnexion.execute(
            `SELECT * FROM voyage WHERE (planete_id_planete = :planeteAller AND PLANETE_ID_PLANETE2 = :planeteRetour) AND DATE_DEPART > SYSDATE`,
            {
                planeteAller: planeteAller,
                planeteRetour: planeteRetour
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (voyageResult.rows.length == 0) {
            voyageResult = await oracleConnexion.execute(
                `SELECT * FROM voyage WHERE (planete_id_planete = :planeteAller) AND DATE_DEPART > SYSDATE`,
                { planeteAller: planeteAller },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
        }
    }
    return voyageResult;
}

async function chercherNomPlaneteParId(planeteID) {
    const result = await oracleConnexion.execute(
        `SELECT NOM FROM PLANETE WHERE id_planete = :planeteID`,
        { planeteID: planeteID },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const planeteNom = result.rows[0];
    return planeteNom.NOM;
}

async function chercherNomVaisseauParId(vaisseauID) {
    const result = await oracleConnexion.execute(
        `SELECT NOM FROM VAISSEAU WHERE id_vaisseau = :vaisseauID`,
        { vaisseauID: vaisseauID },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const vaisseauNom = result.rows[0];
    return vaisseauNom;
}

async function obtenirDonneesPlaneteParId(planeteID) {
    const planeteResult = await oracleConnexion.execute(
        `SELECT * FROM PLANETE WHERE id_planete = :planeteID`,
        { planeteID: planeteID },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return planeteResult;
}

async function obtenirDonneesVaisseauParId(vaisseauID) {
    const vaisseauResult = await oracleConnexion.execute(
        `SELECT * FROM vaisseau WHERE id_vaisseau = :vaisseauID`,
        { vaisseauID: vaisseauID },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return vaisseauResult;
}

async function trouverPlaneteUtil(id_util) {
    try {
        // Exécution de la requête pour récupérer l'ID de la planète associée à l'utilisateur
        const planeteUtil = await oracleConnexion.execute(
            `SELECT planete_id_planete FROM utilisateur WHERE id_utilisateur = :utilID`,
            { utilID: id_util },
            { outFormat: oracledb.OUT_FORMAT_ARRAY }
        );
        return planeteUtil;
    } catch (err) {
        console.error("Impossible de se connecter à la base de données Oracle:", err);
        return null;
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
    cookie: { maxAge: 300000 },
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store
}));

app.use((req, res, next) => {
    res.locals.est_connecte = req.session.courriel && req.session.mdp;
    res.locals.est_admin = req.session.est_admin;
    res.locals.planete_origine = req.session.planete_util;
    res.locals.planete_destination = req.session.planete_destination;
    res.locals.message_positif = req.session.message_positif;
    res.locals.message_negatif = req.session.message_negatif;

    res.locals.date_aller = req.session.date_aller;
    res.locals.date_retour = req.session.date_retour;
    res.locals.personnes = req.session.personnes;
    next();
});

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
            paramètres du render : planete_origine, planete_destination, planetes_bd, message_negatif, message_positif, est_connecte, est_admin
        */
        .get(async (req, res) => {
            try {
                const planetes_bd = await recupererPlanetes();

                let message_positif = req.session.message_positif;
                req.session.message_positif = "";
                if (deconnecte) {
                    message_positif = "Déconnexion réussie!";
                    deconnecte = false;
                }
                // Passer les données obtenues au moteur de rendu
                res.render('pages/', {
                    planetes_bd: planetes_bd.rows,
                    message_positif: message_positif
                });
            } catch (err) {
                console.error(err);
                res.render('pages/', { message_negatif: 'Une erreur s\'est produite lors de la récupération des données de la base de données' });
            }
        })

        .post(async (req, res) => {
            req.session.planete_util = req.body.planete_origine;
            req.session.planete_destination = req.body.planete_destination;
            req.session.personnes = req.body.personnes;
            req.session.date_aller = req.body.date_aller;
            req.session.date_retour = req.body.date_retour;

            res.status(201).send({});
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
            try {
                const message_negatif = req.session.message_negatif;
                req.session.message_negatif = "";
                res.render('pages/connexion', { message_negatif: message_negatif });
            } catch (err) {
                res.render('pages/connexion', {
                    message_negatif: "Une erreur s'est produite lors de la récupération des données de la base de données."
                });
            }
        })
        /*
            POST du formulaire de la page de connexion
        */
        .post(async (req, res) => {
            try {
                req.session.est_connecte = req.session.courriel && req.session.mdp;
                const { courriel, mdp } = req.body;

                // Exécution de la requête pour vérifier le courriel
                const resultUser = await oracleConnexion.execute(
                    `SELECT * FROM UTILISATEUR WHERE EMAIL = :courriel`,
                    { courriel: courriel },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );

                const resultAdmin = await oracleConnexion.execute(
                    `SELECT * FROM ADMINISTRATEUR WHERE EMAIL = :courriel`,
                    { courriel: courriel },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );

                if (resultUser.rows.length > 0) {
                    req.session.id_connecte = resultUser.rows[0].ID_UTILISATEUR;
                }
                else if (resultAdmin.rows.length > 0) {
                    req.session.id_connecte = resultAdmin.rows[0].ID_ADMINISTRATEUR;
                }

                if (resultUser.rows.length > 0) {
                    const mdp_valide = await bcrypt.compare(mdp, resultUser.rows[0].MOT_DE_PASSE);
                    if (mdp_valide) {
                        if (req.session.courriel != courriel) {
                            const planeteResult = await trouverPlaneteUtil(resultUser.rows[0].ID_UTILISATEUR);

                            if (planeteResult.rows.length > 0) {
                                //Ajout des informations nécessaires à la session
                                req.session.courriel = courriel;
                                req.session.mdp = resultUser.rows[0].MOT_DE_PASSE;
                                req.session.est_connecte = true;
                                req.session.est_admin = false;
                                const planeteID = Number(planeteResult.rows[0]);
                                req.session.planete_util = planeteID;
                                req.session.message_positif = "Connexion au compte effectuée avec succès!";

                                creer_session(req.session.id, new Date(), req.session.cookie.expires, resultUser.rows[0].ID_UTILISATEUR);
                                await oracleConnexion.commit();

                                return res.status(201).send({ message_positif: "Connexion au compte effectuée avec succès!" });
                            } else {
                                res.status(404).send({ message_negatif: "Aucune planète liée à l'utilisateur." });
                            }

                        } else {
                            // Le compte est déjà connecté
                            return res.status(401).send({ message_negatif: "Vous êtes déjà connecté à ce compte." });
                        }
                    } else {
                        // Le mot de passe est incorrect
                        return res.status(401).send({ message_negatif: "L'utilisateur n'existe pas ou le mot de passe est incorrect." });
                    }

                } else if (resultAdmin.rows.length > 0) {
                    if (req.session.courriel != courriel) {
                        const mdp_valide = await bcrypt.compare(mdp, resultAdmin.rows[0].MOT_DE_PASSE);
                        if (mdp_valide) {
                            //Ajout des informations nécessaires à la session
                            req.session.courriel = courriel;
                            req.session.mdp = resultAdmin.rows[0].MOT_DE_PASSE;
                            req.session.est_connecte = req.session.courriel && req.session.mdp;
                            req.session.est_admin = true;
                            req.session.est_connecte = true;
                            req.session.planete_util = null;
                            req.session.message_positif = "Connexion au compte admin effectuée avec succès!";

                            console.log("Session créée !");
                            return res.status(201).send({ message_positif: "Connexion au compte admin effectuée avec succès!" });
                        } else {
                            // Le mot de passe est incorrect
                            return res.status(401).send({ message_negatif: "L'utilisateur n'existe pas ou le mot de passe est incorrect." });
                        }
                    } else {
                        // Le compte est déjà connecté
                        return res.status(401).send({ message_negatif: "Vous êtes déjà connecté à ce compte." });
                    }
                } else {
                    // L'utilisateur n'existe pas
                    return res.status(401).send({ message_negatif: "L'utilisateur n'existe pas ou le mot de passe est incorrect." });
                }
            } catch (err) {
                console.error(err);
                return res.status(404).send({ message_negatif: "Erreur lors de la connexion à la base de données." });
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
            try {
                req.session.est_connecte = req.session.courriel && req.session.mdp;
                const planetes_bd = await recupererPlanetes();
                res.render('pages/inscription', {
                    planetes_bd: planetes_bd.rows,
                });
            } catch (err) {
                console.error(err);
                res.render('pages/inscription', {
                    message_negatif: "Une erreur s'est produite lors de la récupération des données de la base de données."
                });
            }
        })
        /*
            POST du formulaire de la page d'inscription
        */
        .post([
            check('courriel')
                .isEmail()
                .withMessage("L'adresse courriel saisie est invalide."),
            check('mdp')
                .custom(validationMdpEgal),
        ], async (req, res) => {
            req.session.est_connecte = req.session.courriel && req.session.mdp;
            const { prenom, nom, courriel, mdp, adresse, telephone, planete } = req.body;
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(401).send({ message_negatif: errors.array().map(error => error.msg).join(' ') });
                }
            } catch (err) {
                console.error(err);
                return res.status(404).send({ message_negatif: "Erreur lors de la connexion à la base de données." });
            }


            try {
                // Exécution de la requête pour vérifier si le courriel est utilisé
                const result = await oracleConnexion.execute(
                    `SELECT * FROM utilisateur WHERE email = :courriel`,
                    { courriel: courriel },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );



                if (result.rows.length > 0) {
                    const planetes_bd = await recupererPlanetes();
                    // L'utilisateur existe
                    return res.status(401).send({ message_negatif: "Cette adresse courriel est déjà utilisée." });
                } else {
                    // L'utilisateur n'existe pas
                    try {
                        // Obtention d'une connexion à partir du pool
                        const hashedMdp = await hashMotDePasse(mdp, saltRounds);

                        //la BD n'accepte que les chiffres
                        const telephone_numerique = telephone.replace(/\D/g, "");

                        // Exécution de l'insertion de données dans la BD
                        await oracleConnexion.execute(
                            `INSERT INTO utilisateur (email, mot_de_passe, nom, prenom, adresse, telephone, planete_id_planete)
                        VALUES ( :courriel, :mot_de_passe, :nom, :prenom, :adresse, :telephone, :planete_id_planete)`,
                            {
                                courriel: courriel,
                                mot_de_passe: hashedMdp,
                                nom: nom,
                                prenom: prenom,
                                adresse: adresse,
                                telephone: telephone_numerique,
                                planete_id_planete: planete
                            }
                        );
                        await oracleConnexion.commit();

                        const nouvel_util = await oracleConnexion.execute("SELECT MAX(ID_UTILISATEUR) FROM utilisateur");
                        const id_nouvel_util = Number(nouvel_util.rows);
                        const planete_util = await trouverPlaneteUtil(id_nouvel_util);

                        const resultUser = await oracleConnexion.execute(
                            `SELECT * FROM UTILISATEUR WHERE EMAIL = :courriel`,
                            { courriel: courriel },
                            { outFormat: oracledb.OUT_FORMAT_OBJECT }
                        );
                        req.session.id_connecte = resultUser.rows[0].ID_UTILISATEUR;

                        req.session.courriel = courriel;
                        req.session.mdp = hashedMdp;
                        req.session.est_connecte = req.session.courriel && req.session.mdp;
                        req.session.planete_util = planete;
                        req.session.message_positif = "Compte créé avec succès!";

                        return res.status(201).send({ message_positif: "Compte créé avec succès!" });

                    } catch (err) {
                        console.error(err);
                        return res.status(404).send({ message_negatif: "Erreur lors de la connexion à la base de données." });
                    }

                }
            } catch (err) {
                console.error(err);
                return res.status(404).send({ message_negatif: "Erreur lors de la connexion à la base de données." });
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
                const courriel = req.session.courriel;
                req.session.est_connecte = req.session.courriel && req.session.mdp;
                if (req.session.est_connecte && !req.session.est_admin) {
                    // Exécution de la requête pour vérifier le courriel
                    const result = await oracleConnexion.execute(
                        `SELECT * FROM UTILISATEUR WHERE EMAIL = :courriel`,
                        { courriel: courriel },
                        { outFormat: oracledb.OUT_FORMAT_OBJECT }
                    );

                    const rechercheData = {
                        planeteOrigine: await chercherNomPlaneteParId(req.session.planete_util, req.session.planete_destination),
                        planeteDestination: await chercherNomPlaneteParId(req.session.planete_destination),
                        dateDepart: req.session.date_aller,
                        dateRetour: req.session.date_retour,
                        nombrePersonnes: req.session.personnes
                    };

                    // Exécution de la requête SQL pour rechercher les voyages correspondants
                    let voyageResult;
                    if (req.session.date_retour) {
                        voyageResult = await recupererVoyages(req.session.planete_util, req.session.planete_destination, true);
                    } else voyageResult = await recupererVoyages(req.session.planete_util, req.session.planete_destination, false);

                    // Récupérer les informations de la planète et du vaisseau pour chaque voyage
                    if (voyageResult.rows.length > 0) {
                        for (const voyage of voyageResult.rows) {
                            const planeteId = voyage.PLANETE_ID_PLANETE2;
                            const vaisseauId = voyage.VAISSEAU_ID_VAISSEAU;

                            try {
                                const planeteResult = await obtenirDonneesPlaneteParId(planeteId);
                                const vaisseauResult = await obtenirDonneesVaisseauParId(vaisseauId);

                                // Stocker les données de la planète et du vaisseau dans l'objet de voyage actuel
                                voyage.planeteData = planeteResult.rows[0];
                                voyage.vaisseauData = vaisseauResult.rows[0];

                            } catch (error) {
                                console.error("Une erreur s'est produite lors de la récupération des données :", error);
                            }
                        }

                        if (result.rows.length > 0) {
                            res.render('pages/reservation', {
                                est_connecte: req.session.est_connecte,
                                rechercheData: rechercheData,
                                voyages_bd: voyageResult.rows,
                                message_negatif:
                                    "Attention! Dû au nombre limité de voyages offerts, il est possible qu'aucun voyage présenté sur cette page concorde à la recherche effecutée. Vérifiez toujours la destination et les dates avant de réserver un voyage."
                            });
                        }
                    } else {
                        res.render('pages/reservation', {
                            est_connecte: req.session.est_connecte,
                            rechercheData: rechercheData,
                            voyages_bd: voyageResult.rows,
                            message_negatif:
                                "Aucun voyage n'a été trouvé qui répond aux paramètres de votre recherche."
                        });
                    }
                } else {
                    req.session.message_negatif = "Connectez vous à un compte utilisateur pour réserver un voyage.";
                    res.redirect('/connexion');
                }
            } catch (err) {
                console.error(err);
                return res.render('pages/inscription', { message_negatif: 'Erreur lors de la connexion à la base de données' });
            }
        });

    app.post('/reservation/ajoutWishlist', async (req, res) => {
        const { id_voyage, nom_voyage, date_depart } = req.body;

        try {
            const wishlistCollection = dbMongo.collection('wishlist');
            wishlistCollection.insertOne({ id_utilisateur: req.session.id_connecte, id_voyage: id_voyage, nom_voyage: nom_voyage, date_depart: new Date(date_depart), date_ajout: new Date() });

        } catch (err) {
            console.error("Erreur lors de l'ajout à la liste de souhaits.", err);
            res.status(500).json({ success: false, message: "Erreur lors de l'ajout à la liste de souhaits." });
        }
    });

    app.route('/exploration')
        /*
            Accès à la page d'exploration
            paramètres : message_negatif, planetes_bd, est_connecte
        */
        .get(async (req, res) => {
            try {
                req.session.est_connecte = req.session.courriel && req.session.mdp;
                const result = await oracleConnexion.execute("SELECT * FROM PLANETE");

                const commentaires = dbMongo.collection("commentaires");
                const listeCommentaires = await commentaires.find().toArray();

                res.render('pages/exploration', {
                    planetes_bd: result.rows,
                    commentaires_bd: listeCommentaires
                });
            } catch (err) {
                console.error(err);
                res.render('pages/exploration', { message_negatif: 'Une erreur s\'est produite lors de la récupération des données de la base de données' });
            }
        })
        /*
            POST du formulaire de la page d'exploration
        */
        .post(async (req, res) => {
            req.session.planete_destination = req.body.selection_planete;
            req.session.message_positif = "Planète de destination sélectionnée!";
            res.redirect('/');
        });

    app.post('/recu', async (req, res) => {
        try {
            // Récupérer l'identifiant de la transaction
            const idTransaction = req.body.idTransaction;

            // Vérifier si l'identifiant de la transaction est fourni
            if (!idTransaction) {
                return res.status(400).json({ error: 'ID de transaction manquant' });
            }


            // Rediriger l'utilisateur vers la page du reçu
            res.redirect(`/recu?idTransaction=${idTransaction}`);

        } catch (error) {
            console.error('Erreur :', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });

    app.post('/ajoutCommentaire', async (req, res) => {
        try {
            const commentaires = dbMongo.collection("commentaires");
            const { nom, note, contenu, planete } = req.body;
            const nomPlanete = await chercherNomPlaneteParId(planete);
            const insert = { nom: nom, note: note, contenu: contenu, planete: nomPlanete };
            const result = await commentaires.insertOne(insert);
            res.status(201).json({ message_positif: "Commentaire ajouté!" });
        } catch (error) {
            console.error('Erreur :', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });

    // Route pour afficher la page du reçu
    app.get('/recu', async (req, res) => {
        const idTransaction = req.query.idTransaction;
        const totalBillets = await recupererTotalBilletsParTransaction(idTransaction);
        const transactionData = await recupererTransactionParId(idTransaction);

        // Récupérer les billets pour cette transaction
        const billetsTransaction = await recupererBilletsParTransaction(idTransaction);
        transactionData.billets = billetsTransaction;

        const frais = null;

        res.render('pages/recu', { totalBillets: totalBillets, transactionData: transactionData, frais: frais });
    });

    /*
        Accès à la page de déconnexion
        paramètres : message_positif, planetes_bd, est_connecte
    */
    app.get('/deconnexion', async (req, res) => {
        try {
            const result = await recupererPlanetes();
            if (req.session.est_connecte) {

                fermer_session(req.session.id);
                await oracleConnexion.commit();

                req.session.destroy(function (err) {
                    if (err) {
                        console.error("Erreur lors de la destruction de la session:", err);
                        return res.render('pages/', {
                            message_negatif: "Erreur lors de la déconnexion.",
                            planetes_bd: result.rows,
                            est_connecte: false,
                            est_admin: false
                        });
                    }
                    deconnecte = true;
                    res.redirect('/');
                });
            } else {
                res.render('pages/', { planetes_bd: result.rows });
            }

        } catch (err) {
            console.error("Erreur lors de la récupération des données de la base de données:", err);
            req.session.message_negatif = "Une erreur s'est produite lors de la récupération des données de la base de données."
            req.session.est_connecte = false;
            req.session.est_admin = false;
            res.redirect('/');
        }
    });

    app.post('/checkout', async (req, res) => {
        const { dataPanier } = req.body;
        console.log(dataPanier);
        let quantiteBilletPanier = [];
        let prixPanier = [];
        let billets = [];
        try {
            let panier = [];
            for (let i = 0; i < dataPanier.length; i++) {
                let found = false;

                for await (const product of stripe.products.list({ limit: 100 })) {
                    if (product.metadata.id_voyage_db === dataPanier[i].idVoyage.toString() &&
                        product.metadata.classe_voyage === dataPanier[i].classeVoyage) {
                        let quantiteBillet = dataPanier[i].quantiteBillet;
                        let prix = await stripe.prices.list({ product: product.id });

                        if (prix.data.length > 0) {
                            prixPanier.push(prix.data[0].unit_amount);
                            quantiteBilletPanier.push(dataPanier[i].quantiteBillet);
                            let item = {
                                price: prix.data[0].id,
                                quantity: quantiteBillet
                            };
                            panier.push(item);
                            found = true;
                            break;
                        }

                    }
                }

                if (!found) {
                    console.log(`Aucun résultat pour l'item ${i} avec ID voyage: ${dataPanier[i].idVoyage} et classe: ${dataPanier[i].classeVoyage}`);
                }
            }

            for (let i = 0; i < quantiteBilletPanier.length; i++) {
                for (let j = 0; j < quantiteBilletPanier[i]; j++) {
                    let billetData = {};

                    // Générer un numéro de siège aléatoire pour chaque billet
                    let siege = await trouverNumeroSiege(i);

                    // Créer l'objet billetData pour chaque billet
                    billetData = {
                        classe: dataPanier[i].classeVoyage,
                        siege: siege,
                        voyage_id_voyage: dataPanier[i].idVoyage,
                        prix: (prixPanier[i]),
                        utilisateur_id_utilisateur: req.session.id_connecte,
                        transaction_id_transaction: null
                    };

                    billets.push(billetData);
                }
            }

            if (panier.length === 0) {
                console.error("Le panier est vide. La session de checkout ne peut pas être ouverte.");
                res.status(400).send("Le panier est vide. La session de checkout ne peut pas être ouverte.");
                return;
            }

            req.session.billetsAffiches = false;

            // Créer la session de paiement Stripe
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: panier,
                mode: 'payment',
                success_url: `http://localhost:4000/success?session_id={CHECKOUT_SESSION_ID}&billets=${encodeURIComponent(JSON.stringify(billets))}`,
                cancel_url: 'http://localhost:4000/reservation',
            });

            // Trouver le prochain numéro de siège
            async function trouverNumeroSiege(index) {
                const resultCountBillet = await oracleConnexion.execute(
                    `SELECT COUNT(*) FROM BILLET WHERE CLASSE = :classe AND VOYAGE_ID_VOYAGE = :idVoyage`,
                    {
                        classe: dataPanier[index].classeVoyage,
                        idVoyage: dataPanier[index].idVoyage
                    },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );

                const billetsVendus = resultCountBillet.rows[0][0] ? resultCountBillet.rows[0][0] : 0;
                const billetsMax = dataPanier[index].capaciteVaisseau;
                console.log(`Billets vendus: ${billetsVendus}, Billets max: ${billetsMax}`)
                if (dataPanier[index].classeVoyage == "affaires" && (parseInt(billetsMax * 0.1)) - billetsVendus > 0) {
                    return billetsVendus + 1;
                }
                else if (dataPanier[index].classeVoyage == "economique" && (parseInt(billetsMax * 0.9)) - billetsVendus > 0) {
                    return parseInt(billetsMax * 0.1) + billetsVendus + 1;
                }

                return null;
            }

            return res.json({ url: session.url });
        } catch (err) {
            console.error('Erreur checkout Stripe:', err);
            res.status(500).send("Erreur lors de la création de la session de paiement");
        }
    });

    app.get('/success', async (req, res) => {
        // Vérifier si l'utilisateur est connecté en vérifiant la présence de l'e-mail et du mot de passe dans la session
        req.session.est_connecte = req.session.courriel && req.session.mdp;

        // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion avec un message
        if (!req.session.est_connecte) {
            return res.render('pages/connexion', {
                message_negatif: 'Connectez vous pour réserver un voyage'
            });
        }

        try {
            // Récupérer les données de l'utilisateur par e-mail
            const { courriel, id_connecte: userId } = req.session;
            const sessionId = req.query.session_id;

            // Si des billets sont inclus dans la requête
            if (req.query.billets && !req.session.billetsAffiches) {
                // Journaliser les billets à des fins de débogage
                console.log('billets:', req.query.billets);

                let billets;
                try {
                    // Parser les données JSON des billets
                    billets = JSON.parse(decodeURIComponent(req.query.billets));
                } catch (jsonError) {
                    throw new Error('JSON invalide dans les billets : ' + jsonError.message);
                }

                // Insérer les données des billets dans la base de données
                billets.forEach(async (billetData) => {
                    await oracleConnexion.execute(
                        `INSERT INTO billet (classe, siege, voyage_id_voyage, prix, utilisateur_id_utilisateur, transaction_id_transaction)
                     VALUES (:classe, :siege, :voyage_id_voyage, :prix, :utilisateur_id_utilisateur, :transaction_id_transaction)`,
                        {
                            classe: billetData.classe,
                            siege: billetData.siege,
                            voyage_id_voyage: billetData.voyage_id_voyage,
                            prix: billetData.prix,
                            utilisateur_id_utilisateur: billetData.utilisateur_id_utilisateur,
                            transaction_id_transaction: billetData.transaction_id_transaction
                        }
                    );
                    console.log('Nouveau billet inséré avec succès');
                });
                await oracleConnexion.commit(); // Valider la transaction
                req.session.billetsAffiches = true;
            }

            // Récupérer les billets de l'utilisateur avec des transactions nulles
            const billetsUtilisateur = await recupererBilletsAvecTransactionNulle(userId);
            console.log(billetsUtilisateur);

            // Calculer le prix total des billets
            const prixTotal = calculerPrixTotalBillets(billetsUtilisateur);
            console.log(prixTotal);

            // Créer une nouvelle transaction si le prix total n'est pas nul
            if (prixTotal !== 0) {
                const idTransaction = await creerNouvelleTransaction(prixTotal);

                // Mettre à jour chaque billet avec l'ID de transaction
                await mettreAJourBilletsAvecTransaction(billetsUtilisateur, idTransaction, sessionId);
            }

            // Récupérer les données de transaction de l'utilisateur
            const transactionData = await recupererTransactionsIdUser(userId);

            // Parcourir chaque transaction
            for (const transaction of transactionData) {
                // Obtenir le nombre total de billets pour cette transaction
                const totalBillets = await recupererTotalBilletsParTransaction(transaction.ID_TRANSACTION);

                // Récupérer les billets pour cette transaction
                const billetsTransaction = await recupererBilletsParTransaction(transaction.ID_TRANSACTION);

                // Parcourir chaque billet de la transaction
                for (const billet of billetsTransaction) {
                    // Récupérer les détails du voyage pour ce billet
                    const voyageResult = await oracleConnexion.execute(
                        `SELECT * FROM VOYAGE WHERE ID_VOYAGE = :idVoyage`,
                        { idVoyage: billet.VOYAGE_ID_VOYAGE },
                        { outFormat: oracledb.OUT_FORMAT_OBJECT }
                    );

                    const voyageDetails = voyageResult.rows[0];

                    // Si les détails du voyage existent, les ajouter aux détails du billet
                    if (voyageDetails) {
                        const vaisseauNom = await chercherNomVaisseauParId(voyageDetails.VAISSEAU_ID_VAISSEAU);
                        voyageDetails.vaisseau_nom = vaisseauNom.NOM;

                        // Ajouter les détails du voyage au billet
                        billet.voyage = voyageDetails;
                    } else {
                        console.error("Aucun détail de voyage trouvé pour l'ID de voyage :", billet.voyage_id_voyage);
                    }
                }

                // Ajouter les billets et le total des billets à l'objet transaction
                transaction.billets = billetsTransaction;
                transaction.billetTotal = totalBillets;
            }

            // Si aucune transaction n'est trouvée ou si le tableau de transactions est vide
            if (!transactionData || transactionData.length === 0) {
                return res.render('pages/success', {
                    est_connecte: req.session.est_connecte,
                    sessionId: sessionId,
                    transactionData: transactionData,
                    message_negatif: 'Aucun billet ou transaction trouvé.'
                });
            }

            // Rendre la page de succès si des données de transaction sont trouvées
            if (transactionData && transactionData.length > 0) {
                return res.render('pages/success', {
                    est_connecte: req.session.est_connecte,
                    sessionId: sessionId,
                    transactionData: transactionData
                });
            }
        } catch (error) {
            // Journaliser l'erreur et renvoyer une réponse d'erreur au client
            console.error('Erreur lors de la finalisation du paiement :', error);
            return res.status(500).send('Erreur lors de la finalisation du paiement');
        }
    });


    app.post('/success', async (req, res) => {
        try {
            // Récupérer l'identifiant de la transaction à annuler depuis le corps de la requête
            const idTransaction = req.body.idTransaction;

            // Vérifier si l'identifiant de la transaction est fourni
            if (!idTransaction) {
                return res.status(400).json({ error: 'ID de transaction manquant' });
            }

            // Supprimer les billets associés à l'identifiant de la transaction
            await supprimerBilletsParTransaction(idTransaction);

            // Supprimer la transaction elle-même
            await supprimerTransaction(idTransaction);

            await oracleConnexion.commit();

            // Envoyer une réponse indiquant que le voyage a été annulé avec succès
            res.status(200).json({ message: 'Voyage annulé avec succès' });
        } catch (error) {
            // S'il y a une erreur lors de l'annulation du voyage, la journaliser et renvoyer une réponse d'erreur
            console.error('Erreur lors de l\'annulation du voyage :', error);
            res.status(500).json({ error: 'Erreur lors de l\'annulation du voyage' });
        }
    });

    // Fonction pour supprimer les billets associés à une transaction
    async function supprimerBilletsParTransaction(idTransaction) {
        await oracleConnexion.execute(
            `DELETE FROM BILLET WHERE TRANSACTION_ID_TRANSACTION = :idTransaction`,
            { idTransaction }
        );
    }

    // Fonction pour supprimer une transaction par son identifiant
    async function supprimerTransaction(idTransaction) {
        await oracleConnexion.execute(
            `DELETE FROM TRANSACTION WHERE ID_TRANSACTION = :idTransaction`,
            { idTransaction }
        );
    }

    async function recupererBilletsAvecTransactionNulle(idUtilisateur) {
        const resultat = await oracleConnexion.execute(
            `SELECT * FROM billet 
             WHERE utilisateur_id_utilisateur = :idUtilisateur 
             AND transaction_id_transaction IS NULL`,
            { idUtilisateur },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return resultat.rows;
    }

    async function recupererBilletsIdUser(idUtilisateur) {
        const resultat = await oracleConnexion.execute(
            `SELECT * FROM billet 
             WHERE utilisateur_id_utilisateur = :idUtilisateur`,
            { idUtilisateur },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return resultat.rows;
    }

    // Fonction pour récupérer le total des billets pour une transaction donnée
    async function recupererTotalBilletsParTransaction(idTransaction) {
        const result = await oracleConnexion.execute(
            `SELECT COUNT(*) AS total_billets FROM billet WHERE transaction_id_transaction = :idTransaction`,
            { idTransaction: idTransaction },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        // Retourne le total des billets pour la transaction
        return result.rows[0].TOTAL_BILLETS;
    }

    async function recupererBilletsParTransaction(idTransaction) {
        const result = await oracleConnexion.execute(
            `SELECT * FROM billet WHERE transaction_id_transaction = :idTransaction`,
            { idTransaction: idTransaction },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    }

    async function recupererTransactionsIdUser(idUtilisateur) {
        const resultat = await oracleConnexion.execute(
            `SELECT * FROM transaction WHERE id_transaction IN (SELECT transaction_id_transaction FROM billet 
             WHERE utilisateur_id_utilisateur = :idUtilisateur)`,
            { idUtilisateur },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return resultat.rows;
    }

    async function recupererTransactionParId(idTransaction) {
        const resultat = await oracleConnexion.execute(
            `SELECT * FROM transaction WHERE id_transaction = :idTransaction`,
            { idTransaction },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return resultat.rows[0];
    }

    function calculerPrixTotalBillets(billets) {
        let prixTotal = 0;
        for (const billet of billets) {
            prixTotal += billet.PRIX;
        }
        return prixTotal;
    }

    async function creerNouvelleTransaction(prixTotal) {
        const resultat = await oracleConnexion.execute(
            `INSERT INTO transaction (date_transaction, prix_total) 
             VALUES (SYSDATE, :prixTotal) 
             RETURNING id_transaction INTO :idTransaction`,
            { prixTotal, idTransaction: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
        );
        await oracleConnexion.commit();
        return resultat.outBinds.idTransaction[0];
    }

    async function mettreAJourBilletsAvecTransaction(billets, idTransaction, sessionId) {
        for (const billet of billets) {
            await oracleConnexion.execute(
                `UPDATE billet 
                 SET transaction_id_transaction = :idTransaction 
                 WHERE id_billet = :idBillet`,
                { idTransaction: idTransaction, idBillet: billet.ID_BILLET }
            );
            await oracleConnexion.commit();
        }
    }

    app.route('/administrateur')
        /*
            Accès à la page administrateur
            paramètres : est_connecte
        */
        .get(async (req, res) => {
            try {
                req.session.message_positif = "";
                req.session.est_connecte = req.session.courriel && req.session.mdp;
                if (req.session.est_connecte && req.session.est_admin) {
                    const result = await oracleConnexion.execute("SELECT table_name FROM user_tables");
                    const collections = await dbMongo.listCollections().toArray();

                    res.render('pages/administrateur', {
                        oracleTables: result.rows,
                        mongoCollections: collections.map(collection => collection.name)
                    });
                } else {
                    req.session.message_negatif = "Connectez vous en tant qu'administrateur pour accéder à cette page";
                    res.redirect('/connexion');
                }
            } catch (err) {
                console.error(err);
                return res.render('pages/administrateur', { message_negatif: 'Erreur lors de la connexion à la base de données.' });
            }
        });

    app.post('/administrateur/voirCollection', async (req, res) => {
        const { nomCollection } = req.body;

        try {
            req.session.est_connecte = req.session.courriel && req.session.mdp;
            if (req.session.est_connecte && req.session.est_admin) {
                const collection = dbMongo.collection(nomCollection);
                const data = await collection.find().toArray();

                let colonnes = data.length > 0 ? Object.keys(data[0]) : [];

                res.render('pages/voir-collection', { data: data, nomCollection: nomCollection, colonnes: colonnes });
            } else {
                req.session.message_negatif = "Connectez vous en tant qu'administrateur pour accéder à cette page";
                res.redirect('/connexion');
            }
        } catch (err) {
            console.error('Erreur lors de la requête:', err);
            res.status(401).send("Erreur lors de la récupération des données.");
        }
    });

    app.post('/administrateur/voirTable', async (req, res) => {
        const { tableName } = req.body;

        try {
            req.session.est_connecte = req.session.courriel && req.session.mdp;
            if (req.session.est_connecte && req.session.est_admin) {
                const result = await oracleConnexion.execute(`SELECT * FROM ${tableName} ORDER BY 1`);
                let colonnes = result.metaData.map(col => col.name);

                // Ce code transforme les rows en objets afin de faciliter la manipulation
                const dataObjets = result.rows.map(row => {
                    let objet = {};
                    row.forEach((value, index) => {
                        objet[colonnes[index]] = value;
                    });
                    return objet;
                });

                res.render('pages/voir-table', { data: dataObjets, tableName: tableName, colonnes: colonnes, });
            } else {
                req.session.message_negatif = "Connectez vous en tant qu'administrateur pour accéder à cette page";
                res.redirect('/connexion');
            }
        } catch (err) {
            console.error('Erreur lors de la requête:', err);
            res.status(401).send("Erreur lors de la récupération des données.");
        }
    });

    app.post('/administrateur/mettreAJour', async (req, res) => {
        const { tableName, sqlRowIndex, data } = req.body;

        try {
            console.log("Requête de mise à jour reçue:", req.body);

            let partiesClause = [];
            for (const [key, value] of Object.entries(data)) {
                if (key.includes("DATE")) {
                    partiesClause.push(`${key} = TO_TIMESTAMP(:${key}, 'YYYY-MM-DD HH24:MI:SS')`);
                } else {
                    partiesClause.push(`${key} = :${key}`);
                }
            }
            let clauseMiseAJour = partiesClause.join(', ');

            console.log("Clause de mise à jour:", clauseMiseAJour);

            const sqlQuery = `UPDATE ${tableName} SET ${clauseMiseAJour} WHERE ID_${tableName} = :sqlRowIndex`;

            console.log("SQL query:", sqlQuery);

            await oracleConnexion.execute(sqlQuery, { ...data, sqlRowIndex: sqlRowIndex }, { autoCommit: true });

            res.json({ success: true, message: 'Mise à jour réussie.' });
        } catch (err) {
            console.error('Erreur lors de la mise à jour:', err);
            res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour.' });
        }
    });

    app.post('/administrateur/ajouter', async (req, res) => {
        const { tableName, data } = req.body;

        try {
            console.log("Requête d'insertion reçue':", req.body);

            let partiesClauseCles = [];
            let partiesClauseValeurs = [];

            for (const [key, value] of Object.entries(data)) {
                partiesClauseCles.push(`${key}`);
                if (key.includes("DATE")) {
                    partiesClauseValeurs.push(`TO_TIMESTAMP(:${key}, 'YYYY-MM-DD HH24:MI:SS')`);
                } else {
                    partiesClauseValeurs.push(`:${key}`);
                }
            }
            let clauseInsertionCles = partiesClauseCles.join(', ');
            let clauseInsertionValeurs = partiesClauseValeurs.join(', ');

            console.log("Clés de la clause d'insertion:", clauseInsertionCles);

            console.log("Valeurs de la clause d'insertion:", clauseInsertionValeurs);

            const sqlQuery = `INSERT INTO ${tableName} (${clauseInsertionCles}) VALUES (${clauseInsertionValeurs})`;

            console.log("SQL query:", sqlQuery);

            await oracleConnexion.execute(sqlQuery, { ...data }, { autoCommit: true });

            res.json({ success: true, message: 'Insertion réussie.' });
        } catch (err) {
            console.error("Erreur lors de l'insertion", err);
            res.status(500).json({ success: false, message: "Erreur lors de l'insertion." });
        }
    });

    app.post('/administrateur/supprimer', async (req, res) => {
        const { tableName, sqlRowIndex, data } = req.body;

        try {
            console.log("Requête de suppression reçue:", req.body);

            const sqlQuery = `DELETE FROM ${tableName} WHERE ID_${tableName} = :sqlRowIndex`;

            await oracleConnexion.execute(sqlQuery, { ...data, sqlRowIndex: sqlRowIndex }, { autoCommit: true });

            res.json({ success: true, message: 'Suppression réussie.' });
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            res.status(500).json({ success: false, message: 'Erreur lors de la suppression.' });
        }

    });

    app.route('/wishlist')
        /*
            Accès à la page wishlist
            paramètres : est_connecte
        */
        .get(async (req, res) => {
            try {
                req.session.message_positif = "";
                req.session.est_connecte = req.session.courriel && req.session.mdp;
                if (req.session.est_connecte) {
                    const courriel = req.session.courriel;

                    const wishlistCollection = dbMongo.collection('wishlist');
                    const wishlistUtilisateur = await wishlistCollection.find({ id_utilisateur: req.session.id_connecte }).toArray();
                    console.log("Wishlist: ", wishlistUtilisateur);

                    res.render('pages/wishlist', {
                        wishlistUtilisateur: wishlistUtilisateur
                    });
                } else {
                    req.session.message_negatif = "Connectez vous pour accéder à cette page";
                    res.redirect('/connexion');
                }
            } catch (err) {
                console.error(err);
                return res.render('pages/wishlist', { message_negatif: 'Erreur lors de la connexion à la base de données.' });
            }
        });

    // Démarrage du serveur après la tentative de connexion à la base de données.
    const server = app.listen(4000, function () {
        console.log("serveur fonctionne sur 4000... !");
    });

}


demarrerServeur().catch(err => console.error("Erreur lors du démarrage du serveur:", err));