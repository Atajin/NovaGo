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