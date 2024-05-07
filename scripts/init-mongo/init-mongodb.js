db.commentaires.drop();

db.createCollection("commentaires");
db.commentaires.insertMany([
    { nom: "Alice", note: 5, contenu: "Une expérience à couper le souffle en visitant Jupiter!", planete: "Jupiter" },
    { nom: "Bob", note: 4, contenu: "Mars est incroyable, à voir absolument pour tout aventurier!", planete: "Mars" },
    { nom: "Claire", note: 4, contenu: "Vénus était plus chaude que prévu, mais fascinante!", planete: "Vénus" },
    { nom: "Dave", note: 5, contenu: "La vue sur Saturne était hors de ce monde.", planete: "Saturne" },
    { nom: "Eve", note: 3, contenu: "Aquarion est paisible mais un peu trop calme à mon goût.", planete: "Aquarion" },
    { nom: "Frank", note: 5, contenu: "Les paysages de Zyphoria sont extraordinaires!", planete: "Zyphoria" },
    { nom: "Grace", note: 2, contenu: "Nebulon a été un peu décevant, peut-être avais-je trop d'attentes.", planete: "Nebulon" },
    { nom: "Heidi", note: 4, contenu: "Elysium est aussi belle que son nom le suggère.", planete: "Elysium" },
    { nom: "Ivan", note: 5, contenu: "Vortexia vous transporte dans une autre dimension. Incroyable!", planete: "Vortexia" },
    { nom: "Judy", note: 3, contenu: "Terra Nova est un choix solide pour les débutants en voyage spatial.", planete: "Terra Nova" }
]);