const titrePage = document.getElementById('titrePage').innerText;
const tableName = titrePage.split(': ')[1];
const table = document.getElementById("dbTable");

window.addEventListener('resize', setTailleBoutonAjouter);

function attacherEcouteurs() {
    const tbody = document.querySelector('table tbody');
    tbody.addEventListener('click', gestionBouton);

    const boutonAjouter = document.querySelector('.btn-ajouter');
    if (boutonAjouter) {
        boutonAjouter.addEventListener('click', gestionAjouter);
    }
}

function gestionBouton(event) {
    const button = event.target;
    if (!button) return;

    if (button.classList.contains('btn-modifier')) {
        gestionModifier.call(button);
    } else if (button.classList.contains('btn-supprimer')) {
        gestionSupprimer.call(button);
    } else if (button.classList.contains('btn-confirmer-modification')) {
        gestionConfirmerModification.call(button, event);
    } else if (button.classList.contains('btn-annuler')) {
        gestionAnnuler.call(button);
    } else if (button.classList.contains('btn-confirmer-ajout')) {
        gestionConfirmerAjout.call(button, event);
    }
}

function getNomColonne(tableElement, cellIndex) {
    let headerRow = tableElement.rows[0];

    headerCell = headerRow.cells[cellIndex];

    return headerCell.innerText;
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

function gestionModifier() {
    const rowIndex = this.getAttribute('data-index');
    const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
    const dataCells = row.querySelectorAll('td:not(:last-child)');

    dataCells.forEach((cell, i) => {
        let nomColonne = getNomColonne(table, i);
        if (nomColonne.includes("ID_" + tableName) || nomColonne.includes("TOKEN")) {
            const valeurInitiale = cell.innerText;
            cell.setAttribute('data-original-value', valeurInitiale);
        } else {
            const valeurInitiale = cell.innerText;
            cell.setAttribute('data-original-value', valeurInitiale);
            cell.innerHTML = `<input type="text" class="form-control" value="${valeurInitiale}">`;
        }

    });

    const buttonsCell = row.querySelector('td:last-child');
    buttonsCell.innerHTML = `
    <div class="d-grid gap-2">
        <button type="button" class="btn btn-success btn-confirmer-modification" data-index="${rowIndex}">Confirmer</button>
        <button type="button" class="btn btn-secondary btn-annuler" data-index="${rowIndex}">Annuler</button>
    </div>
    `;

    buttonsCell.querySelector('.btn-confirmer-modification').addEventListener('click', gestionConfirmerModification);
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

function gestionConfirmerModification(event) {
    event.stopPropagation();
    const rowIndex = this.getAttribute('data-index');
    const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
    const dataCells = row.querySelectorAll('td:not(:last-child) input.form-control');

    const firstCell = row.querySelector('td');
    const sqlRowIndex = parseInt(firstCell.textContent, 10);

    let dataUpdate = {};
    dataCells.forEach((input) => {
        let nomColonne = input.closest('td').getAttribute('data-column-name');
        let valeur = input.value;

        if (!isNaN(valeur)) {
            valeur = Number(valeur);
        }
        else if (nomColonne.includes("DATE")) {
            const date = new Date(valeur);
            valeur = date.toISOString().replace('T', ' ').substring(0, 19);
        }

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
    const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
    const firstCell = row.querySelector('td');
    const sqlRowIndex = parseInt(firstCell.textContent, 10);

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

function gestionAjouter() {
    const lastRow = table.rows[table.rows.length - 1];
    const nextRowIndex = parseInt(lastRow.getAttribute('data-row-index'), 10) + 1;

    const newRow = table.insertRow(1);
    newRow.setAttribute('data-row-index', nextRowIndex);

    const nbCells = table.rows.length > 0 ? table.rows[2].cells.length : 0;

    for (let i = 0; i < nbCells - 1; i++) {
        let newCell = newRow.insertCell(i);
        let nomColonne = getNomColonne(table, i);

        if (nomColonne.includes("ID_" + tableName)) {
            sqlRowIndex = nextRowIndex + 1;
            newCell.setAttribute('class', 'wrap-text');
            newCell.setAttribute('data-column-name', nomColonne);
            newCell.innerHTML = sqlRowIndex;
        } else {
            newCell.setAttribute('data-column-name', nomColonne);
            newCell.innerHTML = '<input type="text" class="form-control">';
        }
    }


    let buttonsCell = newRow.insertCell(nbCells - 1);
    buttonsCell.innerHTML = `
    <div class="d-grid gap-2">
        <button type="button" class="btn btn-primary btn-confirmer-ajout" data-index="${nextRowIndex}">Confirmer</button>
        <button type="button" class="btn btn-danger btn-supprimer" data-index="${nextRowIndex}">Supprimer</button>
    </div>
    `;
}

function gestionConfirmerAjout(event) {
    event.stopPropagation();
    const rowIndex = this.getAttribute('data-index');
    const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
    const dataCells = row.querySelectorAll('td:not(:last-child) input.form-control');

    let dataInsert = {};
    dataCells.forEach((input) => {
        let nomColonne = input.closest('td').getAttribute('data-column-name');
        let valeur = input.value;
        if (!nomColonne.includes("ID_" + tableName)) {
            dataInsert[nomColonne] = valeur;
        }
        if (!isNaN(valeur)) {
            valeur = Number(valeur);
        }
        else if (nomColonne.includes("DATE")) {
            const date = new Date(valeur);
            valeur = date.toISOString().replace('T', ' ').substring(0, 19);
        }

        dataInsert[nomColonne] = valeur;
    });

    fetch('/administrateur/ajouter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tableName: tableName,
            data: dataInsert,
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

attacherEcouteurs();
setTailleBoutonAjouter();
alignerBoutonAjouter();