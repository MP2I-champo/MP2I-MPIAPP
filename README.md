# MP2I-MPI Bot

## Informations générales
Cette application a été créée pour le serveur Discord de la MP2I et de la MPI du lycée Champollion. Elle permet notamment l'affichage de l'emploi du temps et d'une certaine gestion des devoirs.

## Features
- Emploi du temps via une image, mis à jour tous les soirs automatiquement à 19h.
- Gestion des devoirs, possibilité d'en ajouter et message permettant de visualiser tous les devoirs à faire.
- Quelques blagues ! (mathTeacherCalypse)
- Possibilité d'ajouter des citations auxquelles le bot réagira automatiquement (voir `params.example.json`).

## Comment l'utiliser
1. Renommer le fichier `.env.example` en `.env` et entrer les variables d'environnement dedans.
2. Renommer `params.example.json` vers `params.json`.
2. Entrer les paramètres voulus dans `params.json`.
2. Build et lancer le bot via Docker :
```sh
$ docker compose build 
$ docker compose up -d
```

## Technologies utilisées 
- Typescript avec node.js
- Docker 
- PostgreSQL, la database est créée automatiquement par Docker

*PS : je suis contactable via Discord sous le pseudo [cocosilex](https://discord.com/users/825309267757629470)*
