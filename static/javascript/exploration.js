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
          if (note != 0){
            if (document.getElementById("contenu"+i).value != null){
              if (document.getElementById("nom"+i).value != null){
                document.getElementById("bouton_commentaire"+i).innerHTML = "Laisser un commentaire";
                document.getElementById("custom_commentaire"+i).style.display = "none";

                document.getElementById("contenu"+i).classList.remove('is-invalid');
                document.getElementById("nom"+i).classList.remove('is-invalid');

                document.getElementById("contenu"+i).value = "";
                document.getElementById("nom"+i).value = "";
                document.getElementById(""+note+i).checked = false;
                //ajout sur mongodb ici
            } else {
              document.getElementById("nom"+i).classList.add('is-invalid');
            }
          } else {
            document.getElementById("contenu"+i).classList.add('is-invalid');
          }
          } else {
          }
        }
      });
  };
  