function ajouterGestionnairesEvenements() {
    document.querySelectorAll('.btn-modifier').forEach(button => {
        button.addEventListener('click', gestionModifier);
    });

    document.querySelectorAll('.btn-supprimer').forEach(button => {
        button.addEventListener('click', gestionSupprimer);
    });
}

function gestionModifier() {
    const rowIndex = this.getAttribute('data-index');
    const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
    const dataCells = row.querySelectorAll('td:not(:last-child)');

    dataCells.forEach((cell) => {
        const valeurInitiale = cell.innerText;
        cell.setAttribute('data-original-value', valeurInitiale);
        cell.innerHTML = `<input type="text" class="form-control" value="${valeurInitiale}">`;
    });

    const buttonsCell = row.querySelector('td:last-child');
    buttonsCell.innerHTML = `
    <div class="d-grid gap-2">
        <button type="button" class="btn btn-success btn-confirmer" data-index="${rowIndex}">Confirmer</button>
        <button type="button" class="btn btn-secondary btn-annuler" data-index="${rowIndex}">Annuler</button>
    </div>
    `;

    buttonsCell.querySelector('.btn-confirmer').addEventListener('click', gestionConfirmer);
    buttonsCell.querySelector('.btn-annuler').addEventListener('click', gestionAnnuler);
}

function gestionAnnuler() {
    const rowIndex = this.getAttribute('data-index');
    const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
    const dataCells = row.querySelectorAll('td:not(:last-child)');

    dataCells.forEach((cell) => {
        const valeurInitiale = cell.getAttribute('data-original-value');
        cell.innerHTML = valeurInitiale;
    });

    const buttonsCell = row.querySelector('td:last-child');
    buttonsCell.innerHTML = `
        <div class="d-grid gap-2">
            <button type="button" class="btn btn-primary btn-modifier" data-index="${rowIndex}">Modifier</button>
            <button type="button" class="btn btn-danger btn-supprimer" data-index="${rowIndex}">Supprimer</button>
        </div>
    `;

    ajouterGestionnairesEvenements();
}

function gestionConfirmer() {

}


function gestionSupprimer() {

}

ajouterGestionnairesEvenements();