document.addEventListener('DOMContentLoaded', function () {
    
    const premierVoyage = voyagesData[0]; // Accès au premier élément dans le tableau
    console.log("Détails du premier voyage : ", premierVoyage);
    document.getElementById("codeVoyage").innerHTML = "Code " + premierVoyage.ID_VOYAGE;
    document.getElementById("nomDestination").innerHTML = premierVoyage.planeteData.NOM;
    document.getElementById("typeDestination").innerHTML = premierVoyage.planeteData.TYPE;
    document.getElementById("graviteDestination").innerHTML = premierVoyage.planeteData.GRAVITE + " m/s";

    document.getElementById("nomVaisseau").innerHTML = premierVoyage.vaisseauData.NOM;
    document.getElementById("typeVaisseau").innerHTML = premierVoyage.vaisseauData.TYPE_DE_PROPULSION;
    document.getElementById("capaciteVaisseau").innerHTML = premierVoyage.vaisseauData.CAPACITE;
    document.getElementById("dateDepartVoyage").innerHTML = new Date(premierVoyage.DATE_DEPART).toISOString().split('T')[0];
});



function afficherDetails(idVoyage) {
    // Recherche du voyage correspondant dans les données des voyages
    const voyage = voyagesData.find(v => v.ID_VOYAGE == idVoyage);

    if (voyage) {
        document.getElementById("codeVoyage").innerHTML = "Code " + voyage.ID_VOYAGE;

        document.getElementById("nomDestination").innerHTML = voyage.planeteData.NOM;
        document.getElementById("typeDestination").innerHTML = voyage.planeteData.TYPE;
        document.getElementById("graviteDestination").innerHTML = voyage.planeteData.GRAVITE + " m/s";

        document.getElementById("nomVaisseau").innerHTML = voyage.vaisseauData.NOM;
        document.getElementById("typeVaisseau").innerHTML = voyage.vaisseauData.TYPE_DE_PROPULSION;
        document.getElementById("capaciteVaisseau").innerHTML = voyage.vaisseauData.CAPACITE;
        document.getElementById("dateDepartVoyage").innerHTML = new Date(voyage.DATE_DEPART).toISOString().split('T')[0];
    } else {
        console.error("Voyage non trouvé pour l'ID : ", idVoyage);
    }
}

function ajouterAWishlist() {
    const idVoyageString = document.getElementById("codeVoyage").innerHTML;
    const idVoyage = parseInt(idVoyageString.match(/\d+/)[0]);
    console.log("idVoyage: ", idVoyage, "idVoyageString:", idVoyageString);
    const dateDepart = document.getElementById("dateDepartVoyage").innerHTML;
    const nomDestination = document.getElementById("nomDestination").innerHTML;
    const nomOrigine = document.getElementById("planeteOrigine").innerHTML;
    const nomVoyage = `${nomOrigine} -> ${nomDestination}`;
    fetch('/reservation/ajoutWishlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_voyage: idVoyage, nom_voyage: nomVoyage, date_depart: dateDepart }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Succès:', data.message);
        } else {
            console.error(data.error);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}