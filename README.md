# Tranched Smart-contracts 💻

L'objectif est de créer une application permettant aux utilisateurs de déposer des jetons et de recevoir ultérieurement des paiements de dividendes (proceeds) proportionnels à leurs jetons initialement déposés.
La structure de base comprend deux contrats de jetons :

- USD Token : Tout utilisateur devrait pouvoir mint n'importe quelle quantité de jetons USD.

- Pool Token : Les utilisateurs peuvent déposer des jetons USD pour recevoir des jetons de pool dans un rapport 1:1. La fonction depositProceeds mint des jetons USD et les réserve pour les détenteurs de jetons de pool. La dispersion des proceeds aux détenteurs de jetons de pool est basée sur leur part relative de l'offre totale. Les utilisateurs peuvent retirer leurs jetons de pool en échange de jetons USD.

J'ai accentué mon application sur la partie bonus: `Demonstrate knowledge of proxied contract upgradability through diamonds or other methods.`
Pour ce faire, j'ai forké la repo `Diamond-1-Hardhat` de Mudgen qui est considéré comme une reference pour l'implémentation de l'EIP-2535 Diamonds (https://github.com/mudgen/diamond-1-hardhat). Diamond-1-Hardhat simplifie la création et la mise à niveau de contrats Diamond en fournissant des fonctionnalités de base pour le modèle de mise à niveau par proxy, améliorant ainsi la flexibilité et la maintenabilité des contrats.

J'ai donc conservé ses contracts `Diamond`, `DiamondLoupeFacet` et `DiamondCutFacet`. J'ai également implémenté le contract `ERC20Facet.sol` qui contient la logique de la pool.
J'ai aussi récuperé les contracts et interfaces ERC20 de la lib OpenZeppelin.
Enfin, j'ai implémenté un contract `USDToken.sol` qui est un contract ERC20 basique.
L'ensemble de ces contract se trouvent dans le dossier `Contracts`.

J'ai pu par ce test technique revoir l'implementation et la configuration de contracts Diamond. Il m'a également permis de me confronter à tous les problèmes qu'on peut retrouver en compilation du solidity 🤡
Je reste disponible par email pour toute question ou informations supplémentaires 😀

## Installation

Afin d'installer le projet chez vous, voici la suite de commandes à lancer.

```bash
  git clone https://github.com/jack75015/spacex-project.git
  cd spacex-project
  npm run compile
  npm run test
```

## Tests

Afin de pouvoir éprouver les contracts, j'ai decidé d'implémenter quelques tests suivant un scénario d'utilisation classique.

- Déploiement du contrat USDToken
- Appel de la fonction mint sur USDToken
- Ajout des fonctions ERC20Facet au diamant
- Appel de la fonction setUsdTokenAddress sur ERC20Facet
- Appel de la fonction approve sur USDToken
- Appel de la fonction deposit sur ERC20Facet
- Fonctionnalités mint, approve et deposit avec un deuxième compte
- Appel de la fonction depositProceeds sur ERC20Facet
- Appel de la fonction withdrawProceeds sur ERC20Facet
- Vérification du revert de la fonction withdrawProceeds en raison du cooldown
- Appel de la fonction withdraw sur ERC20Facet

Pour lancer les tests, merci de suivre ces instructions:

```bash
npm run testERC20
```

on peut également lancer un reseau Ganache de testing et run la commande `testERC20Ganache` (https://trufflesuite.com/ganache/).

Voici le resultat attendu:

```bash
    ✓ should have three facets -- call to facetAddresses function (2990475 gas)
    ✓ facets should have the right function selectors -- call to facetFunctionSelectors function (2990475 gas)
    ✓ selectors should be associated to facets correctly -- multiple calls to facetAddress function (2990475 gas)
    ✓ should deploy USDToken (4293009 gas)
    ✓ should test mint function call (1371583 gas)
    ✓ should add ERC20Facet functions (2896698 gas)
    ✓ should test setUsdTokenAddress function call (661037 gas)
    ✓ should test approve function call (120617 gas)
    ✓ should test deposit function call (164610 gas)
    ✓ should test mint, approve ans deposit with a second acount (290554 gas)
    ✓ should test depositProceeds function call (144029 gas)
    ✓ should test withdrawProceeds function call (148314 gas)
    ✓ should test withdrawProceeds revert because of cooldown (78280 gas)
    ✓ should test withdraw function call (136995 gas)

14 passing (3s)
```
