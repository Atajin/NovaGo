document.addEventListener('DOMContentLoaded', function () {
    const premierVoyage = voyagesData[0]; // Accès au premier élément dans le tableau
    console.log("Détails du premier voyage : ", premierVoyage);
    document.getElementById("codeVoyage").innerHTML = "Code " + premierVoyage.ID_VOYAGE;
    document.getElementById("nomDestination").innerHTML = premierVoyage.planetData.NOM;
    document.getElementById("typeDestination").innerHTML = premierVoyage.planetData.TYPE;
    document.getElementById("graviteDestination").innerHTML = premierVoyage.planetData.GRAVITE;

    document.getElementById("nomVaisseau").innerHTML = premierVoyage.vaisseauData.NOM;
    document.getElementById("typeVaisseau").innerHTML = premierVoyage.vaisseauData.TYPE_DE_PROPULSION;
    document.getElementById("capaciteVaisseau").innerHTML = premierVoyage.vaisseauData.CAPACITE;
});

function afficherDetails(idVoyage) {
    // Recherche du voyage correspondant dans les données des voyages
    const voyage = voyagesData.find(v => v.ID_VOYAGE == idVoyage);

    if (voyage) {
        console.log("Détails du voyage : ", voyage);
        document.getElementById("codeVoyage").innerHTML = "Code " + voyage.ID_VOYAGE;

        document.getElementById("nomDestination").innerHTML = voyage.planetData.NOM;
        document.getElementById("typeDestination").innerHTML = voyage.planetData.TYPE;
        document.getElementById("graviteDestination").innerHTML = voyage.planetData.GRAVITE;

        document.getElementById("nomVaisseau").innerHTML = voyage.vaisseauData.NOM;
        document.getElementById("typeVaisseau").innerHTML = voyage.vaisseauData.TYPE_DE_PROPULSION;
        document.getElementById("capaciteVaisseau").innerHTML = voyage.vaisseauData.CAPACITE;
    } else {
        console.error("Voyage non trouvé pour l'ID : ", idVoyage);
    }
}
