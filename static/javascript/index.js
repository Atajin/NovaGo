document.getElementById('aller-simple').addEventListener('change', function () {
    document.getElementById('date_retour-col').style.display = 'none';
    document.getElementById('date_aller-col').classList.remove('col-6');
    document.getElementById('date_aller-col').classList.add('col');
    document.getElementById('date_retour').value = '';
    document.getElementById('date_retour').required = false;
});

document.getElementById('aller-retour').addEventListener('change', function () {
    document.getElementById('date_retour-col').style.display = 'block';
    document.getElementById('date_aller-col').classList.remove('col');
    document.getElementById('date_aller-col').classList.add('col-6');
    document.getElementById('date_retour').required = true;
});