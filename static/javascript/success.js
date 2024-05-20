let idTransactionActuelle;

// Récupérer les données transactionData depuis l'attribut de données
const transactionDataElement = document.getElementById('transactionData');
const transactionDataString = transactionDataElement.getAttribute('data-transaction');
const transactionData = JSON.parse(transactionDataString);

window.onload = function () {

    // Si vous avez au moins une transaction dans votre ensemble de données
    if (transactionData.length > 0) {
        // Appelez afficherTransaction avec l'ID de la première transaction
        afficherTransaction(transactionData[0].ID_TRANSACTION);
    }

    let transactionSelectionnee = transactionData.find(function (transaction) {
        return transaction.ID_TRANSACTION == idTransaction;
    });
    
    let auMoinsUnBilletExpire = false;
    let tousBilletsExpirent = true;
    
    transactionSelectionnee.billets.forEach(function (billet) {
        const dateDepart = new Date(billet.voyage.DATE_DEPART.split("T")[0]);
        const dateActuelle = new Date();
        
        let billetExpire = false;
    
        if (dateDepart > dateActuelle) {
            billetExpire = false;
        } else {
            billetExpire = true;
        }
    
        auMoinsUnBilletExpire = auMoinsUnBilletExpire || billetExpire; // Au moins un billet expire
        tousBilletsExpirent = tousBilletsExpirent && billetExpire; // Tous les billets expirent
    });
    
    const annulerBtn = document.querySelector('.annuler-btn');
    
    if (auMoinsUnBilletExpire && !tousBilletsExpirent) {
        annulerBtn.addEventListener('click', function () {
            annulerVoyage(idTransaction);
        });
        annulerBtn.disabled = false; // Réactive le bouton d'annulation
    } else {
        annulerBtn.disabled = true; // Désactive le bouton d'annulation
        alert("Impossible d'annuler la transaction. Tous les billets ne sont pas expirés.");
    }
    
    // Réinitialiser les variables booléennes
    auMoinsUnBilletExpire = false;
    tousBilletsExpirent = true;    
    
    const recuBtn = document.querySelector('.recu-btn');
    recuBtn.addEventListener('click', function () {
        const idTransaction = idTransactionActuelle;
        ouvrirRecu(idTransaction);
    });
};

function afficherTransaction(idTransaction) {
    idTransactionActuelle = idTransaction;

    let transactionSelectionnee = transactionData.find(function (transaction) {
        return transaction.ID_TRANSACTION == idTransaction;
    });

    let auMoinsUnBilletExpire = false;

    transactionSelectionnee.billets.forEach(function (billet) {
        const dateDepart = new Date(billet.voyage.DATE_DEPART.split("T")[0]);
        const dateActuelle = new Date();

        let billetExpire = false;

        if (dateDepart > dateActuelle) {
            billetExpire = false;
        } else {
            billetExpire = true;
        }
        auMoinsUnBilletExpire = billetExpire; // Au moins un billet expire
    });

    const annulerBtn = document.querySelector('.annuler-btn');

    if (!auMoinsUnBilletExpire) {
        annulerBtn.addEventListener('click', function () {
            annulerVoyage(idTransaction);
        });
        annulerBtn.disabled = false; // Réactive le bouton d'annulation
        ajouterElementSVG(false);
    } else {
        annulerBtn.disabled = true; // Désactive le bouton d'annulation
        ajouterElementSVG(true);
    }

    // Réinitialiser les variables booléennes
    auMoinsUnBilletExpire = false;

    // Construct the content string
    let content = "Transaction " + transactionSelectionnee.ID_TRANSACTION + " - " + transactionSelectionnee.DATE_TRANSACTION.split("T")[0];

    document.getElementById("nomBillet").innerHTML = content;

    let transactionDetailsHTML = ""; // Initialisez la letiable

    // Vérifier si la transaction a été trouvée 
    if (transactionSelectionnee) {
        // Construct transaction details HTML
        transactionSelectionnee.billets.forEach(function (billet) {
            transactionDetailsHTML += `<div class='row p-1'>
                                            <div class='shadow-sm p-3 mb-5 bg-body-tertiary rounded px-3 border text-black' style='width: 150px;'>
                                                <div class='col'>
                                                    <p class='custom-font-rvt m-0 text-center' style='font-size: small;'><b>${billet.voyage.vaisseau_nom}</b></p>
                                                </div>
                                                <div class='col'>
                                                    <p class='custom-font-rvt m-0 text-center'>${billet.voyage.ORIGINE}</p>
                                                </div>
                                                <div class='col'>
                                                    <p class='custom-font-rvt m-0 text-center'><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-rocket mt-1' viewBox='0 0 16 16' style=' margin-bottom: 5px;'>
                                                        <path d='M8 8c.828 0 1.5-.895 1.5-2S8.828 4 8 4s-1.5.895-1.5 2S7.172 8 8 8' />
                                                        <path d='M11.953 8.81c-.195-3.388-.968-5.507-1.777-6.819C9.707 1.233 9.23.751 8.857.454a3.5 3.5 0 0 0-.463-.315A2 2 0 0 0 8.25.064.55.55 0 0 0 8 0a.55.55 0 0 0-.266.073 2 2 0 0 0-.142.08 4 4 0 0 0-.459.33c-.37.308-.844.803-1.31 1.57-.805 1.322-1.577 3.433-1.774 6.756l-1.497 1.826-.004.005A2.5 2.5 0 0 0 2 12.202V15.5a.5.5 0 0 0 .9.3l1.125-1.5c.166-.222.42-.4.752-.57.214-.108.414-.192.625-.281l.198-.084c.7.428 1.55.635 2.4.635s1.7-.207 2.4-.635q.1.044.196.083c.213.09.413.174.627.282.332.17.586.348.752.57l1.125 1.5a.5.5 0 0 0 .9-.3v-3.298a2.5 2.5 0 0 0-.548-1.562zM12 10.445v.055c0 .866-.284 1.585-.75 2.14.146.064.292.13.425.199.39.197.8.46 1.1.86L13 14v-1.798a1.5 1.5 0 0 0-.327-.935zM4.75 12.64C4.284 12.085 4 11.366 4 10.5v-.054l-.673.82a1.5 1.5 0 0 0-.327.936V14l.225-.3c.3-.4.71-.664 1.1-.861.133-.068.279-.135.425-.199M8.009 1.073q.096.06.226.163c.284.226.683.621 1.09 1.28C10.137 3.836 11 6.237 11 10.5c0 .858-.374 1.48-.943 1.893C9.517 12.786 8.781 13 8 13s-1.517-.214-2.057-.607C5.373 11.979 5 11.358 5 10.5c0-4.182.86-6.586 1.677-7.928.409-.67.81-1.082 1.096-1.32q.136-.113.236-.18Z' />
                                                        <path d='M9.479 14.361c-.48.093-.98.139-1.479.139s-.999-.046-1.479-.139L7.6 15.8a.5.5 0 0 0 .8 0z' />
                                                    </svg></p>
                                                </div>
                                                <div class='col'>
                                                    <p class='custom-font-rvt m-0 text-center'>${billet.voyage.DESTINATION}</p>
                                                </div>
                                            </div>
                                            <div class='shadow-sm p-3 mb-5 bg-body-tertiary rounded px-3 border text-black' style='width: 440px;'>
                                                <div class='row p-0'>
                                                    <p class='navbar-brand m-0' style='font-size: xx-large;  line-height: 0.8;'>NovaGo</p>
                                                </div>
                                                <div class='row p-0'>
                                                    <div class='col'>
                                                        <div class='row'>
                                                            <p class='custom-font-rvt m-0' style='font-size: small;'>Destination : ${billet.voyage.DESTINATION}</p>
                                                        </div>
                                                        <div class='row'>
                                                            <p class='custom-font-rvt m-0' style='font-size: small;'>Date de départ : ${billet.voyage.DATE_DEPART.split("T")[0]}</p>
                                                        </div>
                                                        <div class='row'>
                                                            <p class='custom-font-rvt m-0' style='font-size: small;'>Date de Retour : </p>
                                                        </div>
                                                        <div class='row'>
                                                            <p class='custom-font-rvt m-0' style='font-size: small;'>Siege : ${billet.SIEGE}</p>
                                                        </div>
                                                        <div class='row'>
                                                            <p class='custom-font-rvt m-0' style='font-size: small;'>Classe : ${billet.CLASSE}</p>
                                                        </div>
                                                    </div>
                                                    <div class='col'>
                                                        <!--QR Code-->
                                                    </div>
                                                </div>
                                            </div>
                                        </div>`;
        });

        let transactionsContainer = document.getElementById("transactionsContainer");
        if (transactionsContainer) {
            transactionsContainer.innerHTML = transactionDetailsHTML;
        }
    }
}

function annulerVoyage(idTransaction) {
    fetch('/success', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idTransaction: idTransaction })
    })
        .then(() => {
            // Recharger la page après avoir envoyé la demande d'annulation du voyage
            window.location.reload();
        })
        .catch(error => {
            console.error('Erreur :', error);
        });
}

function ouvrirRecu(idTransaction) {
    fetch('/recu', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idTransaction: idTransaction })
    })
        .then(response => {
            if (response.redirected) {
                window.location.href = response.url; // Rediriger l'utilisateur vers l'URL du reçu
            } else {
                return response.json().then(data => {
                    console.error('Erreur :', data.error);
                });
            }
        })
        .catch(error => {
            console.error('Erreur :', error);
        });
}

function ajouterElementSVG(date_expiration) {
    const parentElement = document.getElementById('activation');

    // Supprimer le dernier élément ajouté s'il en existe un
    if (parentElement.lastChild) {
        parentElement.removeChild(parentElement.lastChild);
    }

    const pElement = parentElement.appendChild(document.createElement('p'));
    pElement.classList.add('custom-font-labels', 'm-0', 'px-2');

    const svgElement = pElement.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('width', '15');
    svgElement.setAttribute('height', '15');
    svgElement.setAttribute('fill', 'currentColor');
    svgElement.classList.add('bi', 'bi-circle', 'rounded-circle');

    const pathElement = svgElement.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "path"));
    pathElement.setAttribute('d', 'M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16');

    if (date_expiration) {
        svgElement.classList.add('bg-danger', 'text-danger');
    } else {
        svgElement.classList.add('bg-success', 'text-success');
    }
}
