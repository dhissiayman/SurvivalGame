# 🎮 Survival Game - Rapport de Projet

**Réalisé par :** DHISSI AYMAN et HANNOUNI LINA  
**Année Universitaire :** 2025-2026  

**Lien GitHub Pages (Jeu) :** [https://dhissiayman.github.io/SurvivalGame/](https://dhissiayman.github.io/SurvivalGame/) 🌐  
**Lien YouTube (Démo) :** [https://www.youtube.com/watch?v=J_SGEIbudao](https://www.youtube.com/watch?v=J_SGEIbudao) 📹

---

## 1. 📖 Introduction

### Présentation générale
**Survival Game** est un jeu vidéo de type *Action / Arcade / Survival* développé en **JavaScript** avec la bibliothèque **p5.js** 🎨. Le joueur incarne une entité cybernétique piégée dans une arène infinie, devant survivre à des vagues progressives d'ennemis autonomes en utilisant ses réflexes et des améliorations stratégiques.

### 🎯 Objectif principal
Ce projet a été conçu dans le cadre du module "IA pour le jeu vidéo" pour démontrer l'implémentation pratique des **Steering Behaviors** (comportements de direction) théorisés par **Craig Reynolds**. L'objectif technique n'est pas seulement de créer un jeu fonctionnel, mais de simuler des mouvements organiques et coordonnés pour les ennemis, dépassant les simples trajectoires linéaires.

### Contexte de réalisation
Le développement s'est concentré sur la création d'un moteur de jeu léger mais robuste, capable de gérer des centaines d'entités à l'écran grâce à une architecture orientée objet (*Object-Oriented Programming*).

---

## 2. 🕹️ Description détaillée du Jeu

### Principe & Gameplay
Le joueur évolue dans une arène fermée ("Infinite Arena"). Le but est de survivre le plus longtemps possible pour atteindre le niveau le plus élevé et maximiser son score.

-   **🏃 Déplacements :** ZQSD ou Flèches directionnelles (Moteur physique avec inertie).
-   **🔫 Combat :** Visée à la souris, Tir avec `Espace`.
-   **🛡️ Défense :** Le joueur peut invoquer des Murs (`Touche E`) pour bloquer les ennemis ou créer des goulots d'étranglement.

### 📈 Système de Progression (StageManager)
Le jeu repose sur une difficulté croissante gérée par le `StageManager` :
1.  **Niveaux Infinis :** Le niveau augmente après un certain nombre d'éliminations (20 kills initiaux + 5 par niveau).
2.  **Scaling de Difficulté :** À chaque niveau, les ennemis gagnent en vitesse et en points de vie ⚡. Le taux d'apparition augmente également.
3.  **🦇 Hordes :** Périodiquement, une nuée massive d'ennemis ("Chauves-souris") traverse l'écran, forçant le joueur à esquiver plutôt qu'à combattre.
4.  **👹 Combats de Boss :** Tous les **5 niveaux** (5, 10, 15...), le jeu bascule en mode "Boss Fight". Un Boss unique apparaît avec des mécaniques spéciales.

### ✨ Améliorations (Power-ups)
Pour contrer la difficulté croissante, le joueur collecte des bonus permanents. Un système de **limitation (Cap)** a été implémenté pour l'équilibre :

| Type | Couleur | Effet | Limite (Cap) |
| :--- | :--- | :--- | :--- |
| **Vitesse** ⚡ | Cyan | Augmente la vitesse de déplacement (+1) | Max 16 |
| **Cadence** 🔥 | Orange | Réduit le délai entre les tirs (-2 frames) | Max 26 |
| **Multishot** 💥 | Jaune | Ajoute un projectile supplémentaire (+1) | Max 13 |
| **Bouclier** 🛡️ | Bleu | Absorbe un coup (cumulable) | Illimité |
| **Soin** 💚 | Vert | Restaure 30 PV | Max 100 PV |

---

## 3. 🛠️ Architecture Technique

### Technologies
-   **Javascript** (ES6+ classes).
-   **p5.js** (Canvas API).
-   **GitHub Pages** (Hébergement).

### 🏗️ Structure du Code
L'architecture suit strictement les principes de la programmation orientée objet :

1.  **`Vehicle.js` (Classe Mère) :**
    -   Implémente la physique newtonienne : `Position`, `Vitesse`, `Accélération`.
    -   Contient les méthodes de *Steering Behaviors* : `seek()` (poursuite), `arrive()` (arrivée douce), `separate()` (anti-collisio).
    -   Toutes les entités mobiles (Joueur, Ennemis, Projectiles) en héritent.

2.  **🧠 Intelligence Artificielle (Steering Behaviors) :**
    -   **Ennemis Standards :** Utilisent `seek(player)` combiné à `separate(enemies)` pour foncer sur le joueur sans se chevaucher.
    -   **Flocking Enemies (Nuées) :** Utilisent une combinaison complexe de 3 règles :
        -   *Cohesion :* Rester groupés.
        -   *Alignment :* Aller dans la même direction que les voisins.
        -   *Separation :* Ne pas se percuter.
    -   **Projectiles :** Intègrent un comportement de guidage (`Homing`) léger pour aider la visée.

3.  **Gestionnaires de Jeu :**
    -   **`StageManager.js` :** Le "chef d'orchestre" qui gère les états (Menu, Jeu, Boss), les spawns et la musique.
    -   **`Sketch.js` :** La boucle principale (`draw()`) qui orchestre le rendu graphique et les interactions.

### 👾 Types d'Ennemis (`EnemyTypes.js`)
L'utilisation de l'héritage permet une grande variété d'adversaires :
-   **Fast Enemy (Orange) :** Rapide ⚡, faible, fonce sur le joueur.
-   **Tank Enemy (Gris/Squelette) :** Lent 🐢, très résistant, inflige de lourds dégâts.
-   **Splitter Enemy (Violet/Vampire) :** Se divise en deux ennemis plus petits lorsqu'il est détruit 🩸.
-   **Boss (1 à 4) :** Entités complexes avec des barres de vie dédiées et des attaques spéciales 💀.

---

## 4. 📊 Analyse et Critique

### ⚠️ Difficultés rencontrées
1.  **Performance (FPS Drop) :**
    -   *Problème :* Avec +50 ennemis et +20 projectiles calculant chacun leur distance avec tous les autres (complexité O(N²)), le jeu ralentissait.
    -   *Solution :* Optimisation des boucles, limitation du nombre de projectiles actifs (30 max), et suppression agressive des entités hors écran.
2.  **Dégâts Instantanés (One-Shot) :**
    -   *Problème :* Les collisions étant vérifiées 60 fois par seconde, toucher un boss tuait le joueur instantanément.
    -   *Solution :* Ajout d'une période d'invulnérabilité (i-frames) de 1 seconde après chaque coup reçu, avec clignotement visuel (`Player.js`).

### ✅ Réussites
-   **Fluidité des Mouvements :** L'IA ne semble pas robotique ; les ennemis s'écoulent comme un fluide autour des obstacles grâce aux forces de répulsion.
-   **Architecture Modulaire :** Ajouter un nouvel ennemi ou un nouveau bonus prend quelques minutes grâce à la structure de classes bien définie.
-   **Expérience de Jeu ("Game Feel") :** Les retours visuels (particules, secousses, clignotements) rendent l'action dynamique et satisfaisante.

### 🤖 Utilisation de l'IA Générative
Des outils LLM ont assisté le développement pour :
-   **Refactoring :** Optimisation des méthodes de calcul vectoriel.
-   **Génération d'Assets :** Création des sprites (images) via des outils de génération d'image (intégrés ou externes).
-   **Debugging :** Identification rapide des problèmes de portée de variables (`scope`) dans les callbacks audio.

---

## 5. 🏁 Conclusion

Ce projet a permis de valider la maîtrise des concepts d'IA appliqués aux jeux vidéo. Le résultat est un jeu complet, techniquement solide et ludique. L'utilisation des *Steering Behaviors* offre une complexité émergente fascinante : des règles simples appliquées individuellement créent des comportements de groupe complexes et réalistes.

**🔮 Pistes d'amélioration futures :**
-   Sauvegarde du meilleur score (LocalStorage).
-   Ajout de nouveaux types de Steering (ex: *Wander* pour des ennemis passifs).
-   Portage sur mobile (contrôles tactiles).

---
*Projet universitaire - Master 2 Intelligence Artificielle*