Pour initialiser le conteneur mongoDB:

Ouvrir l'invite de commandes windows en tant qu'admin

Se diriger dans le dossier scripts du dépôt Github:
cd /chemin/vers/scripts

Créer le conteneur à partir du fichier docker-compose:
docker-compose up -d

Dans docker exec pour se connecter:
mongosh "mongodb://novago:mongo@localhost:27017"

Si jamais il y a un problème avec la BD mongo, s'assurer d'effacer le container ET le volume mongodb dans docker et réessayer.


Pour initialiser le conteneur oracle:

Ouvrir l'invite de commandes windows en tant qu'admin

Pull l'image oracle:
docker pull gvenzl/oracle-xe:21

Run l'image oracle dans docker:
docker run -d -p 1521:1521 --name oracle-xe -e ORACLE_PASSWORD=oracle gvenzl/oracle-xe:21

Copier le script de creation dans le container docker:
docker cp /chemin/vers/nom_script_creation.ddl oracle-xe:/home/nom_script_creation.ddl

Par exemple, pour moi: docker cp C:/Users/kianl/NovaGo/scripts/script_creation_novago_11.0_21c.ddl oracle-xe:/home/script_creation_novago_11.0_21c.ddl


Copier le script d'insertion dans le container docker:
docker cp /chemin/vers/nom_script_insertion.ddl oracle-xe:/home/nom_script_insertion.ddl

Par exemple, pour moi: docker cp C:/Users/kianl/NovaGo/scripts/script_insertion_novago_4.0.ddl oracle-xe:/home/script_insertion_novago_4.0.ddl


Dans docker exec pour la BD oracle:

Se connecter en tant qu'admin:
sqlplus sys/oracle as sysdba

Creer une nouvel utilisateur pour notre BD.
CREATE USER novago IDENTIFIED BY oracle DEFAULT TABLESPACE users QUOTA UNLIMITED ON users;

Lui donner les droits necessaires:
GRANT CREATE SESSION, CREATE TABLE, CREATE VIEW, CREATE SEQUENCE, CREATE PROCEDURE, CREATE TRIGGER TO novago;

GRANT dba to novago;

EXIT;

Se connecter en tant que le nouvel utilisateur (novago):
sqlplus novago/oracle

Lancer le script de creation:
@/home/script_creation_novago_11.0_21c.ddl

Lancer le script d'insertion:
@/home/script_insertion_novago_4.0.ddl

COMMIT;

Normalement, c'est bon!


Pour effacer les tables en cas de probleme:

Se connecter en tant que novago (sqlplus novago/oracle)

BEGIN
    -- Suppression des tables
    FOR r IN (SELECT table_name FROM user_tables) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE "' || r.table_name || '" CASCADE CONSTRAINTS';
    END LOOP;
    
    -- Suppression des déclencheurs
    FOR r IN (SELECT trigger_name FROM user_triggers) LOOP
        EXECUTE IMMEDIATE 'DROP TRIGGER "' || r.trigger_name || '"';
    END LOOP;
    
    -- Suppression des séquences
    FOR r IN (SELECT sequence_name FROM user_sequences) LOOP
        EXECUTE IMMEDIATE 'DROP SEQUENCE "' || r.sequence_name || '"';
    END LOOP;
END;
/

Si jamais les tables ne s'affichent pas bien dans la console de docker, ajuster la taille de la page avec SET PAGESIZE (exemple: SET PAGESIZE 50)

Pour initialiser un serveur dans Visual Studio Code en utilisant nodemon :

1. Ouvrir Visual Studio Code
2. Ouvrir le projet dans Visual Studio Code en utilisant Fichier > Ouvrir un dossier
3. Ouvrir le fichier server.js est présent dans le dossier 
4. Ouvrir le terminal intégré dans Visual Studio Code en utilisant Affichage > Terminal
6. Si "nodemon" n'est pas installé, installe-le : Executer dans le terminal : npm install -g nodemon
5. Executer dans le terminal : npx nodemon server.js

Pour se connecter à un compte admin: 
Courriel: nithyrian@gmail.com
Mot de passe: csgopr0123

Vous pouvez vous créer un compte avec le site pour utiliser un compte utilisateur normal.