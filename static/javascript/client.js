if (document.getElementById('aller-simple') && document.getElementById('aller-retour')) {
    document.getElementById('aller-simple').addEventListener('change', function () {
        document.getElementById('date-retour-col').style.display = 'none';
        document.getElementById('date-aller-col').classList.remove('col-6');
        document.getElementById('date-aller-col').classList.add('col');
        document.getElementById('date-retour').value = '';
    });

    document.getElementById('aller-retour').addEventListener('change', function () {
        document.getElementById('date-retour-col').style.display = 'block';
        document.getElementById('date-aller-col').classList.remove('col');
        document.getElementById('date-aller-col').classList.add('col-6');
    });
}
if (document.getElementById('carousel')){
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
}