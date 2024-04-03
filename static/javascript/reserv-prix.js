document.addEventListener('DOMContentLoaded', function () {
    const radioEconomique = document.getElementById('economique');
    const radioAffaire = document.getElementById('affaires');

    radioEconomique.addEventListener('change', updatePrix);
    radioAffaire.addEventListener('change', updatePrix);

    function updatePrix() {
        voyagesData.forEach(voyage => {
            const prixElement = document.getElementById('prix_' + voyage.ID_VOYAGE);
            const prixEconomique = voyage.PRIX_ECONO;
            const prixAffaire = voyage.PRIX_BUSINESS;
            let prixFinal;
            if (radioEconomique.checked) {
                prixFinal = prixEconomique;
            } else if (radioAffaire.checked) {
                prixFinal = prixAffaire;
            }
            prixElement.textContent = prixFinal + ' $';
        });
    }

    updatePrix();
});
