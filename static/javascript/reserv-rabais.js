function envoyerCodeRabais() {
    const codeRabais = document.getElementById('rabais').value;

    // Vérifier si rabaisData existe
    if (rabaisData) {
        let rabaisValide = false;

        // Parcourir le tableau rabaisData pour rechercher le rabais valide
        for (let i = 0; i < rabaisData.length; i++) {
            const rabais = rabaisData[i];
            if (rabais.CODE === codeRabais) {
                rabaisValide = true;
                if (rabaisValide) {
                    // Afficher le code de rabais et le bouton Annuler
                    document.getElementById('rabaisAffiche').innerText = codeRabais;
                    document.getElementById('rabaisInputContainer').style.display = 'none';
                    document.getElementById('rabaisDisplayContainer').style.display = 'block';
                    rabaisValide = false;
                } else {
                    // Gérer le cas où le code de rabais est invalide
                    console.log('Code de rabais invalide');
                    // Afficher un message d'erreur ou prendre une autre action appropriée
                }
                break; // Sortir de la boucle dès qu'un rabais valide est trouvé
            }
        }

        // Envoie du code de rabais au serveur via une requête AJAX
        fetch('/reservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: codeRabais })
        })
        .then(response => response.json())
        .then(data => {
            // Traitement de la réponse du serveur (data) ici...
            console.log('Réponse du serveur :', data);
        })
        .catch(error => {
            console.error('Erreur lors de l\'envoi du code de rabais :', error);
        });
    } else {
        // rabaisData est null ou undefined, ne rien faire
    }
}

function annulerRabais() {
    // Réinitialiser l'élément input et afficher à nouveau l'élément input et le bouton Appliquer
    document.getElementById('rabais').value = '';
    document.getElementById('rabaisInputContainer').style.display = 'block';
    document.getElementById('rabaisDisplayContainer').style.display = 'none';
}
