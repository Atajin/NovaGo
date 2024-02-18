-- Généré par Oracle SQL Developer Data Modeler 23.1.0.087.0806
--   à :        2024-02-13 21:28:36 HNE
--   site :      Oracle Database 11g
--   type :      Oracle Database 11g



-- predefined type, no DDL - MDSYS.SDO_GEOMETRY

-- predefined type, no DDL - XMLTYPE

CREATE TABLE billet (
    id_billet            NUMBER(17) NOT NULL,
    origine              VARCHAR2(100 CHAR) NOT NULL,
    destination          VARCHAR2(100 CHAR) NOT NULL,
    prix                 NUMBER(17, 2) NOT NULL,
    temps_depart         DATE NOT NULL,
    duree                DATE NOT NULL,
    aller_retour         VARCHAR2(30 CHAR) NOT NULL,
    classe_transport     VARCHAR2(30 CHAR) NOT NULL,
    siege                VARCHAR2(30 CHAR) NOT NULL,
    rabais_id_rabais     NUMBER(17),
    planete_id_planete   NUMBER NOT NULL,
    recu_id_recu         NUMBER(17) NOT NULL,
    utilisateur_courriel VARCHAR2(100 CHAR) NOT NULL,
    voyage_id_voyage1    NUMBER(17) NOT NULL
);

CREATE UNIQUE INDEX voyage__idx ON
    billet (
        recu_id_recu
    ASC );

ALTER TABLE billet ADD CONSTRAINT voyage_pk PRIMARY KEY ( id_billet );

CREATE TABLE droit (
    id_droit    NUMBER(3) NOT NULL,
    nom         VARCHAR2(100 CHAR) NOT NULL,
    description VARCHAR2(150 CHAR)
);

ALTER TABLE droit ADD CONSTRAINT droit_pk PRIMARY KEY ( id_droit );

CREATE TABLE planete (
    id_planete     NUMBER(17) NOT NULL,
    nom            VARCHAR2(100 CHAR) NOT NULL,
    solide_gazeuse VARCHAR2(30 CHAR) NOT NULL,
    gravite        NUMBER(100, 2) NOT NULL,
    description    VARCHAR2(150 CHAR)
);

ALTER TABLE planete ADD CONSTRAINT planete_pk PRIMARY KEY ( id_planete );

CREATE TABLE rabais (
    id_rabais   NUMBER(17) NOT NULL,
    pourcentage NUMBER(2) NOT NULL,
    date_debut  DATE NOT NULL,
    date_fin    DATE NOT NULL,
    code        VARCHAR2(100 CHAR) NOT NULL
);

ALTER TABLE rabais ADD CONSTRAINT rabais_pk PRIMARY KEY ( id_rabais );

CREATE TABLE recu (
    id_recu              NUMBER(17) NOT NULL,
    prix                 NUMBER(17, 2) NOT NULL,
    "date"               DATE NOT NULL,
    utilisateur_courriel VARCHAR2(100 CHAR) NOT NULL,
    voyage_id_voyage     NUMBER(17) NOT NULL
);

CREATE UNIQUE INDEX recu__idx ON
    recu (
        voyage_id_voyage
    ASC );

ALTER TABLE recu ADD CONSTRAINT recu_pk PRIMARY KEY ( id_recu );

CREATE TABLE session_util (
    id_session           NUMBER(20) NOT NULL,
    token                VARCHAR2(1000 CHAR) NOT NULL,
    temps_expiration     DATE NOT NULL,
    utilisateur_courriel VARCHAR2(100 CHAR) NOT NULL
);

ALTER TABLE session_util ADD CONSTRAINT session_pk PRIMARY KEY ( id_session );

ALTER TABLE session_util ADD CONSTRAINT session_token_un UNIQUE ( token );

CREATE TABLE souhait_voyage (
    id_voyage            NUMBER(17) NOT NULL,
    date_ajout           DATE NOT NULL,
    utilisateur_courriel VARCHAR2(100 CHAR) NOT NULL,
    voyage_id_voyage     NUMBER(17) NOT NULL,
    voyage_id_voyage1    NUMBER(17) NOT NULL
);

CREATE UNIQUE INDEX souhait_voyage__idx ON
    souhait_voyage (
        voyage_id_voyage1
    ASC );

ALTER TABLE souhait_voyage ADD CONSTRAINT souhait_de_voyage_pk PRIMARY KEY ( id_voyage );

CREATE TABLE util_droit (
    utilisateur_courriel VARCHAR2(100 CHAR) NOT NULL,
    droit_id_droit       NUMBER(3) NOT NULL
);

ALTER TABLE util_droit ADD CONSTRAINT utilisateur_droit_pk PRIMARY KEY ( utilisateur_courriel,
                                                                         droit_id_droit );

CREATE TABLE utilisateur (
    courriel           VARCHAR2(100 CHAR) NOT NULL,
    mot_passe          VARCHAR2(30 CHAR) NOT NULL,
    nom                VARCHAR2(30 CHAR) NOT NULL,
    prenom             VARCHAR2(30 CHAR) NOT NULL,
    adresse            VARCHAR2(100 CHAR),
    telephone          VARCHAR2(30 CHAR),
    planete_id_planete NUMBER NOT NULL
);

ALTER TABLE utilisateur ADD CONSTRAINT utilisateur_pk PRIMARY KEY ( courriel );

CREATE TABLE vaisseau (
    id_vaisseau        NUMBER(17) NOT NULL,
    type_propulsion    VARCHAR2(100 CHAR) NOT NULL,
    capacite           NUMBER(13) NOT NULL,
    couleur            VARCHAR2(30 CHAR),
    planete_id_planete NUMBER NOT NULL
);

ALTER TABLE vaisseau ADD CONSTRAINT vaisseau_pk PRIMARY KEY ( id_vaisseau );

CREATE TABLE voyage (
    id_voyage1           NUMBER(17) NOT NULL,
    origine1             VARCHAR2(30 CHAR) NOT NULL,
    destination1         VARCHAR2(30 CHAR) NOT NULL,
    temps_depart1        DATE,
    temps_arrivee        DATE NOT NULL,
    aller_retour1        VARCHAR2(30 CHAR) NOT NULL,
    vaisseau_id_vaisseau NUMBER(17) NOT NULL
);

CREATE UNIQUE INDEX voyage__idx ON
    voyage (
        vaisseau_id_vaisseau
    ASC );

ALTER TABLE voyage ADD CONSTRAINT voyage_pkv1 PRIMARY KEY ( id_voyage1 );

CREATE TABLE voyage_planete (
    planete_id_planete NUMBER(17) NOT NULL,
    voyage_id_voyage1  NUMBER(17) NOT NULL
);

ALTER TABLE voyage_planete ADD CONSTRAINT voyage_planete_pk PRIMARY KEY ( planete_id_planete,
                                                                          voyage_id_voyage1 );

CREATE TABLE voyage_vaisseau (
    vaisseau_id_vaisseau NUMBER(17) NOT NULL,
    voyage_id_voyage     NUMBER(17) NOT NULL
);

ALTER TABLE voyage_vaisseau ADD CONSTRAINT voyage_vaisseau_pk PRIMARY KEY ( vaisseau_id_vaisseau,
                                                                            voyage_id_voyage );

ALTER TABLE billet
    ADD CONSTRAINT billet_voyage_fk FOREIGN KEY ( voyage_id_voyage1 )
        REFERENCES voyage ( id_voyage1 );

ALTER TABLE recu
    ADD CONSTRAINT recu_utilisateur_fk FOREIGN KEY ( utilisateur_courriel )
        REFERENCES utilisateur ( courriel );

ALTER TABLE session_util
    ADD CONSTRAINT session_utilisateur_fk FOREIGN KEY ( utilisateur_courriel )
        REFERENCES utilisateur ( courriel );

--  ERROR: FK name length exceeds maximum allowed length(30) 
ALTER TABLE souhait_voyage
    ADD CONSTRAINT souhait_voyage_utilisateur_fk FOREIGN KEY ( utilisateur_courriel )
        REFERENCES utilisateur ( courriel );

ALTER TABLE souhait_voyage
    ADD CONSTRAINT souhait_voyage_voyage_fk FOREIGN KEY ( voyage_id_voyage )
        REFERENCES billet ( id_billet );

ALTER TABLE souhait_voyage
    ADD CONSTRAINT souhait_voyage_voyage_fk FOREIGN KEY ( voyage_id_voyage1 )
        REFERENCES voyage ( id_voyage1 );

ALTER TABLE util_droit
    ADD CONSTRAINT utilisateur_droit_droit_fk FOREIGN KEY ( droit_id_droit )
        REFERENCES droit ( id_droit );

ALTER TABLE util_droit
    ADD CONSTRAINT utilisateur_droit_util_fk FOREIGN KEY ( utilisateur_courriel )
        REFERENCES utilisateur ( courriel );

ALTER TABLE utilisateur
    ADD CONSTRAINT utilisateur_planete_fk FOREIGN KEY ( planete_id_planete )
        REFERENCES planete ( id_planete );

ALTER TABLE vaisseau
    ADD CONSTRAINT vaisseau_planete_fk FOREIGN KEY ( planete_id_planete )
        REFERENCES planete ( id_planete );

ALTER TABLE billet
    ADD CONSTRAINT voyage_planete_fk FOREIGN KEY ( planete_id_planete )
        REFERENCES planete ( id_planete );

ALTER TABLE voyage_planete
    ADD CONSTRAINT voyage_planete_planete_fk FOREIGN KEY ( planete_id_planete )
        REFERENCES planete ( id_planete );

ALTER TABLE voyage_planete
    ADD CONSTRAINT voyage_planete_voyage_fk FOREIGN KEY ( voyage_id_voyage1 )
        REFERENCES voyage ( id_voyage1 );

ALTER TABLE billet
    ADD CONSTRAINT voyage_rabais_fk FOREIGN KEY ( rabais_id_rabais )
        REFERENCES rabais ( id_rabais );

ALTER TABLE billet
    ADD CONSTRAINT voyage_utilisateur_fk FOREIGN KEY ( utilisateur_courriel )
        REFERENCES utilisateur ( courriel );

ALTER TABLE voyage
    ADD CONSTRAINT voyage_vaisseau_fk FOREIGN KEY ( vaisseau_id_vaisseau )
        REFERENCES vaisseau ( id_vaisseau );

ALTER TABLE voyage_vaisseau
    ADD CONSTRAINT voyage_vaisseau_vaisseau_fk FOREIGN KEY ( vaisseau_id_vaisseau )
        REFERENCES vaisseau ( id_vaisseau );

ALTER TABLE voyage_vaisseau
    ADD CONSTRAINT voyage_vaisseau_voyage_fk FOREIGN KEY ( voyage_id_voyage )
        REFERENCES billet ( id_billet );



-- Rapport récapitulatif d'Oracle SQL Developer Data Modeler : 
-- 
-- CREATE TABLE                            13
-- CREATE INDEX                             4
-- ALTER TABLE                             32
-- CREATE VIEW                              0
-- ALTER VIEW                               0
-- CREATE PACKAGE                           0
-- CREATE PACKAGE BODY                      0
-- CREATE PROCEDURE                         0
-- CREATE FUNCTION                          0
-- CREATE TRIGGER                           0
-- ALTER TRIGGER                            0
-- CREATE COLLECTION TYPE                   0
-- CREATE STRUCTURED TYPE                   0
-- CREATE STRUCTURED TYPE BODY              0
-- CREATE CLUSTER                           0
-- CREATE CONTEXT                           0
-- CREATE DATABASE                          0
-- CREATE DIMENSION                         0
-- CREATE DIRECTORY                         0
-- CREATE DISK GROUP                        0
-- CREATE ROLE                              0
-- CREATE ROLLBACK SEGMENT                  0
-- CREATE SEQUENCE                          0
-- CREATE MATERIALIZED VIEW                 0
-- CREATE MATERIALIZED VIEW LOG             0
-- CREATE SYNONYM                           0
-- CREATE TABLESPACE                        0
-- CREATE USER                              0
-- 
-- DROP TABLESPACE                          0
-- DROP DATABASE                            0
-- 
-- REDACTION POLICY                         0
-- 
-- ORDS DROP SCHEMA                         0
-- ORDS ENABLE SCHEMA                       0
-- ORDS ENABLE OBJECT                       0
-- 
-- ERRORS                                   1
-- WARNINGS                                 0
