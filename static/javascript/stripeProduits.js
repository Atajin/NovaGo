import oracledb from "oracledb";
import Stripe from 'stripe';

const stripe = new Stripe('sk_test_51OyhQ9HnZinsmfjjIC2WMi0WX4MeknqPktZdbrEWHNhibQL4SOlHC8fvohjiMYeZqcJG1kzSF0KEaQFiCZjetdx9009ovLcic3');

async function creerProduitsEtPrix() {
    try {
        const connection = await oracledb.getConnection({
            user: "novago",
            password: "oracle",
            connectString: "localhost:1521/xe"
        });

        const result = await connection.execute(
            `SELECT * FROM voyage`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        for (let voyage of result.rows) {
            const voyageClasseEconomique = await stripe.products.create({
                name: `Classe économique pour ${voyage.DESTINATION} - Départ: ${voyage.DATE_DEPART}`,
                description: `Ticket classe économique pour ${voyage.ORIGINE} en direction de ${voyage.DESTINATION}`,
                metadata: {
                    id_voyage_db: `${voyage.ID_VOYAGE}` // Stockage de l'ID du voyage de la base de données dans les métadonnées
                },
            });

            const voyageClasseAffaires = await stripe.products.create({
                name: `Classe affaires pour ${voyage.DESTINATION} - Départ: ${voyage.DATE_DEPART}`,
                description: `Ticket classe affaires pour ${voyage.ORIGINE} en direction de ${voyage.DESTINATION}`,
                metadata: {
                    id_voyage_db: `${voyage.ID_VOYAGE}` // Stockage de l'ID du voyage de la base de données dans les métadonnées
                },
            });

            console.log(`Produits crées pour le voyage avec l'ID ${voyage.ID_VOYAGE}`);
            console.log(`ID du produit classe économique: ${voyageClasseEconomique.id}`);
            console.log(`ID du produit classe affaires: ${voyageClasseAffaires.id}`);

            const prixClasseEconomique = await stripe.prices.create({
                unit_amount: voyage.PRIX_ECONO * 100, // Stripe utilise la plus petite unité monétaire (par exemple, les cents pour le dollar canadien).
                currency: 'cad',
                product: voyageClasseEconomique.id,
            });

            const prixClasseAffaires = await stripe.prices.create({
                unit_amount: voyage.PRIX_BUSINESS * 100, // Stripe utilise la plus petite unité monétaire (par exemple, les cents pour le dollar canadien).
                currency: 'cad',
                product: voyageClasseAffaires.id,
            });

            console.log(`Produits et prix créés pour le voyage avec l'ID ${voyage.ID_VOYAGE}`);
            console.log(`ID du produit classe économique: ${voyageClasseEconomique.id}, Prix ID: ${prixClasseEconomique.id}`);
            console.log(`ID du produit classe affaires: ${voyageClasseAffaires.id}, Prix ID: ${prixClasseAffaires.id}`);
        }

        await connection.close();
    } catch (err) {
        console.error('Une erreur est survenue durant la création des produits/prix:', err);
    }
}

async function archiverPrixStripe() {
    const reponsePrix = await stripe.prices.list({ limit: 100 });
    for (const prix of reponsePrix.data) {
        await stripe.prices.update(prix.id, {
            active: false, // Désactive le prix
        });
        console.log(`Prix ${prix.id} désactivé.`);
    }
}

async function archiverProduitsStripe() {
    const reponseProduits = await stripe.products.list({ limit: 100 });
    for (const produit of reponseProduits.data) {
        await stripe.products.update(produit.id, {
            active: false, // Désactive le produit
        });
        console.log(`Produit ${produit.id} désactivé.`);
    }
}

creerProduitsEtPrix();