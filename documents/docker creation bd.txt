Dans command prompt (en tant qu'admin):

Pull l'image oracle:
docker pull gvenzl/oracle-xe:21

Run l'image dans docker:
docker run -d -p 1521:1521 --name oracle-xe -e ORACLE_PASSWORD=oracle gvenzl/oracle-xe:21

Copier le script de creation dans le container docker:
docker cp /chemin/vers/nom_script_creation.ddl oracle-xe:/home/nom_script_creation.ddl

Par exemple, pour moi: docker cp C:/Users/kianl/NovaGo/scripts/script_creation_novago_7.0_21c.ddl oracle-xe:/home/script_creation_novago_7.0_21c.ddl


Copier le script d'insertion dans le container docker:
docker cp /chemin/vers/nom_script_insertion.ddl oracle-xe:/home/nom_script_insertion.ddl

Par exemple, pour moi: docker cp C:/Users/kianl/NovaGo/scripts/script_insertion_novago.ddl oracle-xe:/home/script_insertion_novago.ddl


Dans docker exec:

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
@/home/script_creation_novago_7.0_21c.ddl

Lancer le script d'insertion:
@/home/script_insertion_novago.ddl

Normalement, c'est bon!


Pour effacer les tables en cas de probleme:

BEGIN
    FOR r IN (SELECT table_name FROM user_tables) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE "' || r.table_name || '" CASCADE CONSTRAINTS';
    END LOOP;
END;
/

Si jamais les tables ne s'affichent pas bien dans la console de docker, ajuster la taille de la page avec SET PAGESIZE (exemple: SET PAGESIZE 50)