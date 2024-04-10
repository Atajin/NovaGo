document.getElementById('aller-simple').addEventListener('change', function () {
    document.getElementById('date-retour-col').style.display = 'none';
    document.getElementById('date-aller-col').classList.remove('col-6');
    document.getElementById('date-aller-col').classList.add('col');
    document.getElementById('date-retour').required = false;
});

document.getElementById('aller-retour').addEventListener('change', function () {
    document.getElementById('date-retour-col').style.display = 'block';
    document.getElementById('date-aller-col').classList.remove('col');
    document.getElementById('date-aller-col').classList.add('col-6');
    document.getElementById('date-retour').required = true;
});