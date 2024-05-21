if (document.querySelector('input[name="selection_planete"]')) {
    document.querySelectorAll('input[name="selection_planete"]').forEach((elem) => {
      elem.addEventListener("change", function() {
        document.getElementById("id_planete_choisie").value = elem.id;
        if (document.getElementById("bouton_submit").disabled) {
            document.getElementById("bouton_submit").disabled = false;
        }
      });
    });
  }
  for (let i = 1; i < 26; i++) {
      document.getElementById('bouton_commentaire'+i).addEventListener('click', function () {
        if (document.getElementById("bouton_commentaire"+i).innerHTML == "Laisser un commentaire"){
          document.getElementById("bouton_commentaire"+i).innerHTML = "Partager";
          document.getElementById("custom_commentaire"+i).style.display = "block";
        } else {
          let note = 0;
          for (let j = 1; j < 6; j++){
            if (document.getElementById(""+j+i).checked){
              note = j;
            }
          }
          if (note != 0 && document.getElementById("contenu"+i).value != "" && document.getElementById("nom"+i).value != ""){
                document.getElementById("bouton_commentaire"+i).innerHTML = "Laisser un commentaire";
                document.getElementById("custom_commentaire"+i).style.display = "none";

                document.getElementById("contenu"+i).classList.remove('is-invalid');
                document.getElementById("nom"+i).classList.remove('is-invalid');


                //ajout sur mongodb
                const f = fetch("ajoutCommentaire", {
                  method: "POST",
                  headers: {'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      nom: document.getElementById("nom"+i).value,
                      note: note,
                      contenu: document.getElementById("contenu"+i).value,
                      planete: i
                  }),
                })
                .then(response => response.json())
                .then(data => {
                  if (typeof data.message_positif !== 'undefined'){
                    console.log("Commentaire ajouté!");
                  }
                }).catch((error) => {
                  console.error('Erreur:', error);
                });
                document.getElementById("contenu"+i).value = "";
                document.getElementById("nom"+i).value = "";
                document.getElementById(""+note+i).checked = false;
            }
            if (document.getElementById("nom"+i).value == "") {
              document.getElementById("nom"+i).classList.add('is-invalid');
            } else document.getElementById("nom"+i).classList.remove('is-invalid');

            if (document.getElementById("contenu"+i).value == "") {
              document.getElementById("contenu"+i).classList.add('is-invalid');
            } else document.getElementById("contenu"+i).classList.remove('is-invalid');
        }
      });
  };
  