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
const stripeWebhookSecret = "whsec_a93d5332994993d080718740b3cc00760a043306bcc28a80dfd8920692957166";

const app = express();
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const saltRounds = 10;

let pool;

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

        const connexion = await pool.getConnection();
        console.log("Connexion à la base de données Oracle réussie !");

        await connexion.close();
    } catch (err) {
        console.error("Impossible de se connecter à la base de données Oracle:", err);
    }
}

async function creer_session(connexion, token, date_creation, date_expiration, id_util){
    await connexion.execute(
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

async function fermer_session(connexion, token){
    await connexion.execute(
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

function updateLocals(req, res, next) {
    res.locals.est_connecte = req.session.email && req.session.mdp;
    res.locals.est_admin = req.session.est_admin;
    res.locals.planete_origine = req.session.planete_util;
    next();
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

async function recupererPlanetes(connexion) {
    try {
        const result = await connexion.execute("SELECT * FROM PLANETE");
        return result;
    } catch (err) {
        console.error("Impossible de se connecter à la base de données Oracle:", err);
        return null;
    }
}

async function recupererVoyages(connection, rechercheData) {
    const voyageResult = await connection.execute(
        `SELECT * FROM voyage WHERE origine = :origine`,
        { origine: rechercheData.planetOrigine },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    await connection.close();
    return voyageResult;
}

async function obtenirDonneesPlaneteParId(connection, planetID) {
    const planetResult = await connection.execute(
        `SELECT * FROM PLANETE WHERE id_planete = :planetID`,
        { planetID: planetID },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return planetResult;
}

async function obtenirDonneesVaisseauParId(connection, vaisseauID) {
    const vaisseauResult = await connection.execute(
        `SELECT * FROM vaisseau WHERE id_vaisseau = :vaisseauID`,
        { vaisseauID: vaisseauID },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return vaisseauResult;
}

async function trouverPlaneteUtil(connexion, id_util) {
    try {
        // Exécution de la requête pour récupérer l'ID de la planète associée à l'utilisateur
        const planetUtil = await connexion.execute(
            `SELECT planete_id_planete FROM utilisateur WHERE id_utilisateur = :utilID`,
            { utilID: id_util },
            { outFormat: oracledb.OUT_FORMAT_ARRAY }
        );
        return planetUtil;
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
    res.locals.est_connecte = req.session.email && req.session.mdp;
    res.locals.est_admin = req.session.est_admin;
    res.locals.planete_origine = req.session.planete_util;
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
                const connexion = await getPool().getConnection();
                const planetes_bd = await recupererPlanetes(connexion);
                await connexion.close();
                // Passer les données obtenues au moteur de rendu
                res.render('pages/', {
                    planetes_bd: planetes_bd.rows
                });
            } catch (err) {
                console.error(err);
                res.render('pages/', { message_negatif: 'Une erreur s\'est produite lors de la récupération des données de la base de données', est_admin: req.session.est_admin });
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
            try {
                res.render('pages/connexion', {});
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
            let connexion;
            try {
                req.session.est_connecte = req.session.email && req.session.mdp;
                const { email, mdp } = req.body;

                // Obtention d'une connexion à partir du pool
                connexion = await getPool().getConnection();

                // Exécution de la requête pour vérifier l'email
                const resultUser = await connexion.execute(
                    `SELECT * FROM UTILISATEUR WHERE EMAIL = :email`,
                    { email: email },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );

                const resultAdmin = await connexion.execute(
                    `SELECT * FROM ADMINISTRATEUR WHERE EMAIL = :email`,
                    { email: email },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );
                if (resultUser.rows.length > 0) {
                    const mdp_valide = await bcrypt.compare(mdp, resultUser.rows[0].MOT_DE_PASSE);
                    if (mdp_valide) {
                        const planeteResult = await trouverPlaneteUtil(connexion, resultUser.rows[0].ID_UTILISATEUR);

                        const listePlanetes = await recupererPlanetes(connexion);
                        if (planeteResult.rows.length > 0) {
                            //Ajout des informations nécessaires à la session
                            req.session.email = email;
                            req.session.mdp = resultUser.rows[0].MOT_DE_PASSE;
                            req.session.est_connecte = true;
                            req.session.est_admin = false;
                            const planeteID = Number(planeteResult.rows[0]);
                            req.session.planete_util = planeteID;

                            creer_session(connexion, req.session.id, new Date(), req.session.cookie.expires, resultUser.rows[0].ID_UTILISATEUR);
                            await connexion.commit();
                            
                            updateLocals(req, res, () => {
                                return res.render('pages/', { message_positif: 'Connexion au compte effectuée avec succès!', planetes_bd: listePlanetes.rows });
                            });
                        } else {
                            return res.render('pages/connexion', { message_negatif: "Aucune planète liée à l'utilisateur." });
                        }

                    } else {
                        // Le mot de passe est incorrect
                        return res.render('pages/connexion', { message_negatif: "L'utilisateur n'exise pas ou le mot de passe est incorrect." });
                    }

                } else if (resultAdmin.rows.length > 0) {
                    const mdp_valide = await bcrypt.compare(mdp, resultAdmin.rows[0].MOT_DE_PASSE);
                    if (mdp_valide) {
                        const listePlanetes = await recupererPlanetes(connexion);
                        //Ajout des informations nécessaires à la session
                        req.session.email = email;
                        req.session.mdp = resultAdmin.rows[0].MOT_DE_PASSE;
                        req.session.est_connecte = req.session.email && req.session.mdp;
                        req.session.est_admin = true;
                        req.session.est_connecte = true;
                        req.session.planete_util = null;
                        updateLocals(req, res, () => {
                            return res.render('pages/', { message_positif: 'Connexion au compte admin effectuée avec succès!' });
                        });
                    } else {
                        // Le mot de passe est incorrect
                        return res.render('pages/connexion', { message_negatif: "L'utilisateur n'exise pas ou le mot de passe est incorrect." });
                    }
                } else {
                    // L'utilisateur n'existe pas
                    return res.render('pages/connexion', { message_negatif: "L'utilisateur n'exise pas ou le mot de passe est incorrect." });
                }
            } catch (err) {
                console.error(err);
                return res.render('pages/connexion', { message_negatif: 'Erreur lors de la connexion à la base de données.' });
            } finally {
                if (connexion) {
                    await connexion.close();
                }
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
                req.session.est_connecte = req.session.email && req.session.mdp;
                const connexion = await getPool().getConnection();
                const planetes_bd = await recupererPlanetes(connexion);
                await connexion.close();
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
            check('email')
                .isEmail()
                .withMessage("L'adresse courriel saisie est invalide."),
            check('mdp')
                .custom(validationMdpEgal),
        ], async (req, res) => {
            req.session.est_connecte = req.session.email && req.session.mdp;
            const { prenom, nom, email, mdp, adresse, telephone, planete } = req.body;
            try {
                const connexion = await getPool().getConnection();
                const planetes_bd = await recupererPlanetes(connexion);
                await connexion.close();
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.render('pages/inscription', {
                        message_negatif: errors.array().map(error => error.msg).join(' '),
                        planetes_bd: planetes_bd.rows,
                        est_connecte: req.session.est_connecte,
                        prenom: prenom,
                        nom: nom,
                        email: email,
                        telephone: telephone,
                        adresse: adresse,
                        planete_id: planete
                    });
                }
            } catch (err) {
                console.error(err);
                return res.render('pages/inscription', { message_negatif: 'Erreur lors de la connexion à la base de données.' });
            }


            try {
                // Obtention d'une connexion à partir du pool
                const connexion = await getPool().getConnection();

                // Exécution de la requête pour vérifier si l'email est utilisé
                const result = await connexion.execute(
                    `SELECT * FROM utilisateur WHERE email = :email`,
                    { email: email },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );



                if (result.rows.length > 0) {
                    const planetes_bd = await recupererPlanetes(connexion);
                    await connexion.close();
                    // L'utilisateur existe
                    return res.render('pages/inscription', {
                        message_negatif: 'Cette adresse courriel est déjà utilisée.',
                        planetes_bd: planetes_bd.rows,
                        prenom: prenom,
                        nom: nom,
                        email: email,
                        telephone: telephone,
                        adresse: adresse,
                        planete_id: planete
                    });
                } else {
                    // L'utilisateur n'existe pas
                    try {
                        // Obtention d'une connexion à partir du pool
                        const hashedMdp = await hashMotDePasse(mdp, saltRounds);

                        //la BD n'accepte que les chiffres
                        const telephone_numerique = telephone.replace(/\D/g, "");

                        // Exécution de l'insertion de données dans la BD
                        await connexion.execute(
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
                        await connexion.commit();

                        const nouvel_util = await connexion.execute("SELECT MAX(ID_UTILISATEUR) FROM utilisateur");
                        const id_nouvel_util = Number(nouvel_util.rows);
                        const planete_util = await trouverPlaneteUtil(connexion, id_nouvel_util);

                        const planete_id = Number(planete_util.rows[0]);

                        const planetes_bd = await recupererPlanetes(connexion);
                        await connexion.close();

                        req.session.email = email;
                        req.session.mdp = hashedMdp;
                        req.session.est_connecte = req.session.email && req.session.mdp;
                        req.session.planete_util = planete;

                        return res.render('pages/', { message_positif: 'Compte créé avec succès!', planetes_bd: planetes_bd.rows, planete_origine: planete_id });

                    } catch (err) {
                        console.error(err);
                        return res.render('pages/inscription', { message_negatif: 'Erreur lors de la connexion à la base de données' });
                    }

                }
            } catch (err) {
                console.error(err);
                return res.render('pages/inscription', { message_negatif: 'Erreur lors de la connexion à la base de données' });
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
                const email = req.session.email;
                req.session.est_connecte = req.session.email && req.session.mdp;
                if (req.session.est_connecte) {
                    const connection = await getPool().getConnection();

                    // Exécution de la requête pour vérifier l'email
                    const result = await connection.execute(
                        `SELECT * FROM UTILISATEUR WHERE EMAIL = :email`,
                        { email: email },
                        { outFormat: oracledb.OUT_FORMAT_OBJECT }
                    );

                    const rechercheData = {
                        planetOrigine: "Terre",
                        planetDestination: "Mars",
                        dateDepart: "2024-02-24",
                        dateRetour: "2024-02-27",
                        nombrePersonnes: 2,
                        typeBillet: ""
                    };

                    // Exécution de la requête SQL pour rechercher les voyages correspondants
                    const voyageResult = await recupererVoyages(connection, rechercheData);

                    // Récupérer les informations de la planète et du vaisseau pour chaque voyage
                    for (const voyage of voyageResult.rows) {
                        const planetId = voyage.PLANETE_ID_PLANETE2;
                        const vaisseauId = voyage.VAISSEAU_ID_VAISSEAU;

                        let connection;
                        try {
                            connection = await pool.getConnection();

                            const planetResult = await obtenirDonneesPlaneteParId(connection, planetId);
                            const vaisseauResult = await obtenirDonneesVaisseauParId(connection, vaisseauId);

                            // Stocker les données de la planète et du vaisseau dans l'objet de voyage actuel
                            voyage.planetData = planetResult.rows[0];
                            voyage.vaisseauData = vaisseauResult.rows[0];
                            
                        } catch (error) {
                            console.error("Une erreur s'est produite lors de la récupération des données :", error);
                        } finally {
                            if (connection) {
                                try {
                                    await connection.close();
                                } catch (error) {
                                    console.error("Erreur lors de la fermeture de la connexion :", error);
                                }
                            }
                        }
                    }

                    if (result.rows.length > 0) {
                        res.render('pages/reservation', {
                            est_connecte: req.session.est_connecte,
                            rechercheData: rechercheData,
                            voyages_bd: voyageResult.rows
                        });
                    }
                } else res.render('pages/connexion', {
                    message_negatif: 'Connectez vous pour réserver un voyage'
                });
            } catch (err) {
                console.error(err);
                return res.render('pages/inscription', { message_negatif: 'Erreur lors de la connexion à la base de données' });
            }
        });


    app.route('/exploration')
        /*
            Accès à la page d'exploration
            paramètres : message_negatif, planetes_bd, est_connecte
        */
        .get(async (req, res) => {
            try {
                req.session.est_connecte = req.session.email && req.session.mdp;
                const connexion = await getPool().getConnection();
                const result = await connexion.execute("SELECT * FROM PLANETE");
                await connexion.close();

                res.render('pages/exploration', {
                    planetes_bd: result.rows,
                });
            } catch (err) {
                console.error(err);
                res.render('pages/exploration', { message_negatif: 'Une erreur s\'est produite lors de la récupération des données de la base de données' });
            }
        })
        /*
            POST du formulaire de la page d'exploration
            paramètres : -
        */
        .post(async (req, res) => {
            const connexion = await getPool().getConnection();
            const planetes_bd = await recupererPlanetes(connexion);
            await connexion.close();
            res.render('pages/', { planetes_bd: planetes_bd.rows, planete_destination: req.body.selection_planete });
        });

    app.route('/recu-billet')
        /*
            Accès à la page de reçu
            paramètres : est_connecte
        */
        .get((req, res) => {
            res.render('pages/recu-billet', {})
        });
    /*
        Accès à la page de déconnexion
        paramètres : message_positif, planetes_bd, est_connecte
    */
    app.get('/deconnexion', async (req, res) => {
        try {
            const connexion = await getPool().getConnection();
            const result = await recupererPlanetes(connexion);
            if(req.session.est_connecte){
                
                fermer_session(connexion, req.session.id);
                await connexion.commit();
                await connexion.close();
    
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
                    res.render('pages/', {
                        message_positif: "Déconnexion réussie!",
                        planetes_bd: result.rows,
                        est_connecte: false,
                        est_admin: false,
                        planete_origine: null
                    });
                });
            } else {
                res.render('pages/', { planetes_bd: result.rows });
            }
            
        } catch (err) {
            console.error("Erreur lors de la récupération des données de la base de données:", err);
            res.render('pages/', {
                message_negatif: 'Une erreur s\'est produite lors de la récupération des données de la base de données',
                est_connecte: false,
                est_admin: false
            });
        }
    });

    app.post('/checkout', async (req, res) => {
        const { idVoyage, classeVoyage } = req.body; // ID du voyage et classe du billet sélectionnés par l'utilisateur

        try {
            // Récupérer les produits correspondant aux critères de recherche
            const produits = await stripe.products.list({
                metadata: { id_voyage_db: idVoyage.toString(), classe_voyage: classeVoyage }
            });

            let prixId;
            // Récupérer l'ID du prix associé au produit trouvé
            if (produits.data.length > 0) {
                const prix = await stripe.prices.list({ product: produits.data[0].id });
                if (prix.data.length > 0) {
                    prixId = prix.data[0].id; // Prendre le premier prix trouvé
                }
            }

            // Créer la session de paiement Stripe
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price: prixId,
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: '/success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url: '/reservation',
            });

            res.redirect(303, session.url);
        } catch (err) {
            console.error(err);
            res.status(500).send("Erreur lors de la création de la session de paiement");
        }
    });

    app.get('/success', (req, res) => {
        // À compléter (logique de gestion du succès de paiement)
        // Récupérer session_id de la requête pour récupérer des détails sur la session
        const sessionId = req.query.session_id;
        // Traiter la session de paiement réussie
        res.send("Paiement réussi !");
    });

    app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
        let event;

        // Vérifier la signature de l'événement reçu
        const signature = req.headers['stripe-signature'];

        try {
            event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);

            // Traiter l'événement reçu
            switch (event.type) {
                case 'checkout.session.completed':
                    const session = event.data.object;
                    // Logique pour traiter le paiement réussi
                    console.log(`Paiement réussi pour la session ${session.id}`);
                    // Mettre à jour la BD ici
                    break;
            }

            // Renvoie une réponse à Stripe pour confirmer la réception de l'événement
            res.status(200).json({ received: true });
        } catch (err) {
            console.log(`Webhook Error: ${err.message}`);
            res.status(400).send(`Webhook Error: ${err.message}`);
        }
    });

    app.route('/administrateur')
        /*
            Accès à la page de réservation
            paramètres : est_connecte
        */
        .get(async (req, res) => {
            try {
                req.session.est_connecte = req.session.email && req.session.mdp;
                if (req.session.est_connecte && req.session.est_admin) {
                    const connexion = await getPool().getConnection();
                    const result = await connexion.execute("SELECT table_name FROM user_tables");
                    await connexion.close();
                    res.render('pages/administrateur', { tables: result.rows });
                } else res.render('pages/connexion', {
                    message_negatif: "Connectez vous en tant qu'administrateur pour accéder à cette page",
                });
            } catch (err) {
                console.error(err);
                return res.render('pages/inscription', { message_negatif: 'Erreur lors de la connexion à la base de données' });
            }
        });

    app.post('/administrateur/voirTable', async (req, res) => {
        const { tableName } = req.body;

        try {
            req.session.est_connecte = req.session.email && req.session.mdp;
            if (req.session.est_connecte && req.session.est_admin) {
                const connexion = await getPool().getConnection();
                const result = await connexion.execute(`SELECT * FROM ${tableName}`);
                let colonnes = result.metaData.map(col => col.name);

                // Ce code transforme les rows en objets afin de faciliter la manipulation
                const dataObjets = result.rows.map(row => {
                    let objet = {};
                    row.forEach((value, index) => {
                        objet[colonnes[index]] = value;
                    });
                    return objet;
                });

                await connexion.close();

                res.render('pages/voir-table', { data: dataObjets, tableName: tableName, colonnes: colonnes, });
            } else res.render('pages/connexion', {
                message_negatif: "Connectez vous en tant qu'administrateur pour accéder à cette page",
            });
        } catch (err) {
            console.error('Erreur lors de la requête:', err);
            res.send('Erreur lors de la récupération des données');
        }
    });

    app.post('/administrateur/mettreAJour', async (req, res) => {
        const { tableName, sqlRowIndex, data } = req.body;

        console.log("Requête de mise à jour reçue:", req.body);

        try {
            const connexion = await getPool().getConnection();

            let partiesClause = [];
            for (const [key, value] of Object.entries(data)) {
                partiesClause.push(`${key} = :${key}`);
            }
            let clauseMiseAJour = partiesClause.join(', ');

            console.log("Clause de mise à jour:", clauseMiseAJour);

            const sqlQuery = `UPDATE ${tableName} SET ${clauseMiseAJour} WHERE ID_${tableName} = :sqlRowIndex`;

            console.log("SQL query:", sqlQuery);

            await connexion.execute(sqlQuery, { ...data, sqlRowIndex: sqlRowIndex }, { autoCommit: true });

            await connexion.close();

            res.json({ success: true, message: 'Mise à jour réussie.' });
        } catch (err) {
            console.error('Erreur lors de la mise à jour:', err);
            res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour.' });
        }
    });

    app.post('/administrateur/supprimer', async (req, res) => {
        const { tableName, sqlRowIndex, data } = req.body;

        try {
            console.log("Requête de suppression reçue:", req.body);

            const connexion = await getPool().getConnection();
            const sqlQuery = `DELETE FROM ${tableName} WHERE ID_${tableName} = :sqlRowIndex`;

            await connexion.execute(sqlQuery, { ...data, sqlRowIndex: sqlRowIndex }, { autoCommit: true });

            await connexion.close();

            res.json({ success: true, message: 'Suppression réussie.' });
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            res.status(500).json({ success: false, message: 'Erreur lors de la suppression.' });
        }

    });

    // Démarrage du serveur après la tentative de connexion à la base de données.
    const server = app.listen(4000, function () {
        console.log("serveur fonctionne sur 4000... !");
    });

}


demarrerServeur().catch(err => console.error("Erreur lors du démarrage du serveur:", err));