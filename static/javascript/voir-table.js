const titrePage = document.getElementById('titrePage').innerText;
const tableName = titrePage.split(': ')[1];

window.addEventListener('resize', setTailleBoutonAjouter);

function attacherEcouteurs() {
    const tbody = document.querySelector('table tbody');
    tbody.addEventListener('click', gestionBouton);
}

function setTailleBoutonAjouter() {
    const boutonModifier = document.querySelector('.btn-modifier');
    if (boutonModifier) {
        const largeurBoutonModifier = window.getComputedStyle(boutonModifier).width;
        const boutonAjouter = document.querySelector('.btn-ajouter');
        if (boutonAjouter) {
            boutonAjouter.style.width = largeurBoutonModifier;
        }
    }
}

function alignerBoutonAjouter() {
    const boutonModifier = document.querySelector('.btn-modifier');
    if (boutonModifier) {
        const boutonModifierDroite = boutonModifier.getBoundingClientRect().right;
        const boutonAjouter = document.querySelector('.btn-ajouter');
        const viewportWidth = window.innerWidth;

        if (boutonAjouter) {
            const boutonAjouterDroite = boutonAjouter.getBoundingClientRect().right;
            if (viewportWidth > boutonModifierDroite) {
                const ajustementDroite = boutonAjouterDroite - boutonModifierDroite;
                console.log("Adjustment Margin for marginRight: " + ajustementDroite);
                boutonAjouter.style.marginRight = `${ajustementDroite}px`;
            } else {
                const ajustementDroite = 8;
                console.log("Adjustment Margin for right: " + ajustementDroite);
                boutonAjouter.style.marginRight = `${ajustementDroite}px`;
            }
        }
    }
}


function gestionBouton(event) {
    const button = event.target;
    if (button.classList.contains('btn-modifier')) {
        gestionModifier.call(button);
    } else if (button.classList.contains('btn-supprimer')) {
        gestionSupprimer.call(button);
    } else if (button.classList.contains('btn-confirmer')) {
        gestionConfirmer.call(button);
    } else if (button.classList.contains('btn-annuler')) {
        gestionAnnuler.call(button);
    }
}

/*function ajouterGestionnairesEvenements() {
    document.querySelectorAll('.btn-modifier').forEach(button => {
        button.addEventListener('click', gestionModifier);
    });
 
    document.querySelectorAll('.btn-supprimer').forEach(button => {
        button.addEventListener('click', gestionSupprimer);
    });
}*/

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

}

function gestionConfirmer() {
    const rowIndex = this.getAttribute('data-index');
    const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
    const dataCells = row.querySelectorAll('td:not(:last-child) input.form-control');

    const sqlRowIndex = parseInt(rowIndex, 10) + 1;

    let dataUpdate = {};
    dataCells.forEach((input) => {
        let nomColonne = input.closest('td').getAttribute('data-column-name');
        let valeur = input.value;
        dataUpdate[nomColonne] = valeur;
    });

    fetch('/administrateur/mettreAJour', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tableName: tableName,
            sqlRowIndex: sqlRowIndex,
            data: dataUpdate,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Succès:', data.message);

                dataCells.forEach((input) => {
                    const newValue = input.value;
                    const cell = input.closest('td');
                    cell.innerHTML = newValue;
                });

                const buttonsCell = row.querySelector('td:last-child');
                buttonsCell.innerHTML = `
                <div class="d-grid gap-2">
                    <button type="button" class="btn btn-primary btn-modifier" data-index="${rowIndex}">Modifier</button>
                    <button type="button" class="btn btn-danger btn-supprimer" data-index="${rowIndex}">Supprimer</button>
                </div>
            `;

            } else {
                console.error('Erreur lors de la mise à jour:', data.message);
            }
        })
        .catch((error) => {
            console.error('Erreur:', error);
        });
}


function gestionSupprimer() {
    const rowIndex = this.getAttribute('data-index');
    const sqlRowIndex = parseInt(rowIndex, 10) + 1;

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) return;

    fetch('/administrateur/supprimer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tableName: tableName,
            sqlRowIndex: sqlRowIndex,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Suppression réussie:', data.message);

                const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
                if (row) {
                    row.remove();
                }
            } else {
                console.error('Erreur lors de la suppression:', data.message);
            }
        })
        .catch((error) => {
            console.error('Erreur:', error);
        });
}

attacherEcouteurs();
setTailleBoutonAjouter();
alignerBoutonAjouter();