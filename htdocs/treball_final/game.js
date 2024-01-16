const mapa = {
  Objectes: [
    //Pedres
    "(3, 8)",
    "(7, 10)",
    "(11, 12)",
    "(14, 14)",
    "(20, 14)",
    "(26, 14)",
    //Riu
    "(29, 15)",
    "(29, 14)",
    "(29, 13)",
    "(29, 6)",
    "(28, 15)",
    //CASES
    "(28, 11)",
    "(28, 10)",
    "(28, 9)",
    "(28, 8)",
    "(28, 7)",
    "(27, 11)",
    "(27, 10)",
    "(27, 9)",
    "(27, 8)",
    "(27, 7)",
    "(26, 11)",
    "(26, 10)",
    "(26, 9)",  
    "(26, 8)",
    "(26, 7)",
    "(25, 11)",
    "(25, 10)",
    "(25, 9)",
    "(25, 8)",
    "(25, 7)",
    "(0, 6)",
    "(1, 6)",
    "(4, 6)",
    "(5, 6)",
    "(7, 6)",
    "(8, 6)",
    "(10, 7)",
    "(11, 7)",
    "(12, 7)",
    "(10, 8)",
    "(11, 8)",
    "(12, 8)",
    "(4, 12)",
    "(5, 12)",
  ]
};


const partidaSeleccionada = localStorage.getItem('partidaSeleccionada');

var pos_max_x = 30;
var pos_min_x = 0;
var pos_max_y = 17;
var pos_min_y = 3;

const Colors = ["blau", "vermell"];
const Color = Colors[Math.floor(Math.random() * Colors.length)];

function getKeyString(x, y) {
  return `${x}x${y}`;
}

function transitable(x, y) {
  // Espais bloquejats al mapa
  var bloquejat = mapa.Objectes.includes(`(${x}, ${y})`);

  // Comprobem si les coordenades estan dins el mapa i no estan bloquejades
  if (!bloquejat && x < pos_max_x && x >= pos_min_x && y < pos_max_y && y > pos_min_y)
  {
    return true;
  } 
  else 
  {
    return false;
  }
}

var altresCoordenades = [];
for (let x = pos_min_x; x <= pos_max_x; x++) {
  for (let y = pos_min_y; y <= pos_max_y; y++) {
    altresCoordenades.push(`(${x}, ${y})`);
  }
}

// Filtrar les coordenades que no ens serveixen
var coordenadesPosibles = altresCoordenades.filter(coordenada => !mapa.Objectes.includes(coordenada));

(function () {

  var id_jugador;
  var jugador;
  var jugadors = {};
  
  var monedes = {};
  
  const jocHTML = document.querySelector(".joc");
  const Inserir_nom = document.querySelector("#Inserir_Nom");
  const Guanyador_partida = document.querySelector(".Guanyador");
  Guanyador_partida.style.display = "none";

  var elementjugador = {};
  var elementmoneda = {};

  function cooldownMonedes(){
    var cooldown = [1000, 2000, 2500, 3000, 3500, 4000];
    setTimeout(() => { posicio_Monedes(); }, cooldown[Math.floor(Math.random() * cooldown.length)]);
  }

  function posicio_Monedes() {
    // Escull una coordenada aleatoria
    const coordenadaAleatoria = coordenadesPosibles[Math.floor(Math.random() * coordenadesPosibles.length)];    
    var valors = coordenadaAleatoria.match(/\d+/g).map(Number);
    var x = valors[0];
    var y = valors[1];
    const referenciaMoneda = firebase.database().ref(`partides/${partidaSeleccionada}/monedes/${getKeyString(x, y)}`);
    referenciaMoneda.set({
      x,
      y,
    })

    cooldownMonedes();
  }

  function agafarNoneda(x, y) {
    const clau = getKeyString(x, y);
    if (monedes[clau]) {
      // Eliminem la moneda de la base de dades i li afegim una moneda al jugador
      firebase.database().ref(`partides/${partidaSeleccionada}/monedes/${clau}`).remove();
      jugador.update({
        monedes: jugadors[id_jugador].monedes + 1,
      })
    }
  }

  function Moviment(MovimentX, MovimentY) {
    // Calculem les coordenades
    var posX = jugadors[id_jugador].x + MovimentX;
    var posY = jugadors[id_jugador].y + MovimentY;

    // Comprobem que no hi hagi obstacles
    if (transitable(posX, posY)) {
      jugadors[id_jugador].x = posX;
      jugadors[id_jugador].y = posY;

      // Actualitzem la posicio del jugador en la base de dades
      jugador.set(jugadors[id_jugador]);

      // Comprobem si hi ha alguna moneda
      agafarNoneda(posX, posY);
    }
  }


  function startGame() {

    new KeyPressListener("ArrowUp", () => Moviment(0, -1))
    new KeyPressListener("ArrowDown", () => Moviment(0, 1))
    new KeyPressListener("ArrowLeft", () => Moviment(-1, 0))
    new KeyPressListener("ArrowRight", () => Moviment(1, 0))

    const db = firebase.database();

    const ReferenciaJugadors = db.ref(`partides/${partidaSeleccionada}/jugadors`);
    const ReferenciaMonedes = db.ref(`partides/${partidaSeleccionada}/monedes`);

    // Escolta els canvis en la referencia dels jugadors
    ReferenciaJugadors.on("value", (snapshot) => {
      // S'activa cada vegada que hi ha algun canvi
      jugadors = snapshot.val() || {};
      var puntuacio_maxima = false;
      // Recorre cada jugador
      Object.keys(jugadors).forEach((clau) => {
        var jugadoractual = jugadors[clau];
        var element = elementjugador[clau];
        
        // S'actualiza el DOM
        element.querySelector(".Character_name").innerText = jugadoractual.name;
        element.querySelector(".Monedes").innerText = jugadoractual.monedes;
        element.setAttribute("data-color", jugadoractual.color);
        
        var left = 16 * jugadoractual.x + "px";
        var top = 16 * jugadoractual.y - 4 + "px";
        element.style.transform = "translate3d(" + left + ", " + top + ", 0)";
        if(jugadoractual.monedes === 10){
          puntuacio_maxima = true;
          Guanyador_partida.innerText = "HA GUANYAT EL JUGADOR: "+ jugadoractual.name;
          // Mostra el guanyador
          Guanyador_partida.style.display = "block";

          setTimeout(function() {
            Guanyador_partida.style.display = "none";
          }, 3000);
        }
      })
      if(puntuacio_maxima){
        Object.keys(jugadors).forEach(function(clau) {
          var jugadoractual = jugadors[clau];
          jugadoractual.monedes = 0;
          ReferenciaJugadors.child(clau).update({monedes: 0});
        });
      }
    })

    // Escolta quan s'afageix un node nou a l'arbre
    ReferenciaJugadors.on("child_added", (snapshot) => {
      // S'activa cada vegada que s'afageix un nou node
      var jugadornou = snapshot.val();
      
      // Restableix les monedes de tots els jugadors a 0
      Object.keys(jugadors).forEach(function(clau) {
        var jugadoractual = jugadors[clau];
        jugadoractual.monedes = 0;
        ReferenciaJugadors.child(clau).update({monedes: 0});
      });

////////////////////
      const ref = db.ref(`/partides/${partidaSeleccionada}/num_jugadors`);

      ref.transaction(currentValue => {
        if (currentValue === null) {
          return 1;
        } else {
          return currentValue + 1;
        }
      });
////////////////////////


      // Creem un nou element div
      var divelement = document.createElement("div");
      divelement.classList.add("Character", "grid-cell");

      divelement.innerHTML = (`<div class="Character_sprite grid-cell"></div><div class="Nom_personatge"><span class="Character_name"></span><span class="Monedes">0</span></div>`);
      elementjugador[jugadornou.id] = divelement;

      // Emplenem l'estat inicial
      divelement.querySelector(".Character_name").innerText = jugadornou.name;
      divelement.querySelector(".Monedes").innerText = jugadornou.monedes;
      divelement.setAttribute("data-color", jugadornou.color);

      var left = 16 * jugadornou.x + "px";
      var top = 16 * jugadornou.y - 4 + "px";

      divelement.style.transform = "translate3d(" + left + ", " + top + ", 0)";

      jocHTML.appendChild(divelement);
    })

    // Elimina l'element DOM del personatge un cop aquest ha marxat
    ReferenciaJugadors.on("child_removed", (snapshot) => {
      var removedKey = snapshot.val().id;

      jocHTML.removeChild(elementjugador[removedKey]);

      delete elementjugador[removedKey];
    })


    //Quan s'actualitza el valor monedes de Firebase s'eliminaran les monede de l'estat local
    ReferenciaMonedes.on("value", (snapshot) => {
      //Guardem el valor de l'snapshot a la variable monedes si l'snapshot està buit, llavors assignem un objecte buit a monedes
      monedes = snapshot.val() || {};
    });

    ReferenciaMonedes.on("child_added", (snapshot) => {
      //Obtenim la moneda i la clau de l'snapshot
      var moneda = snapshot.val();
      var clau = getKeyString(moneda.x, moneda.y);

      // Afegim la moneda
      monedes[clau] = true;

      // Creem l'element DOM per la moneda
      const elmoneda = document.createElement("div");
      elmoneda.classList.add("Moneda", "grid-cell");

      elmoneda.innerHTML = `<div class="Coin_sprite grid-cell"></div>`;

      // Posicionem l'element en el taulell
      const left = 16 * moneda.x + "px";
      const top = 16 * moneda.y - 4 + "px";
      elmoneda.style.transform = "translate3d(" + left + ", " + top + ", 0)";

      //Ens guardem una referencia a l'element per poder eliminar-lo més tard i l'afegim al DOM
      elementmoneda[clau] = elmoneda;
      jocHTML.appendChild(elmoneda);
    })

    ReferenciaMonedes.on("child_removed", (snapshot) => {
      const {x,y} = snapshot.val();
      const clau_per_eliminar = getKeyString(x,y);
      jocHTML.removeChild( elementmoneda[clau_per_eliminar] );
      delete elementmoneda[clau_per_eliminar];
    })


    //Actualitza el nom del jugador
    Inserir_nom.addEventListener("change", (e) => {
      var nomInserit = e.target.value;
      Inserir_nom.value = nomInserit;
      jugador.update({
        name: nomInserit
      })
    })
    
  }

  firebase.auth().onAuthStateChanged((user) => {
    console.log(user)
    if (user) {
      id_jugador = user.uid;
      jugador = firebase.database().ref(`partides/${partidaSeleccionada}/jugadors/${id_jugador}`);

      var name = "NEW PLAYER";
      Inserir_nom.value = name;
      
      // Nomes spawneja monedes quan hi ha 2 jugadors
      jugador.once("value", (snapshot) => {
        const playersRef = firebase.database().ref(`partides/${partidaSeleccionada}/jugadors`);
        playersRef.once('value')
          .then(snapshot => {
            const playerCount = snapshot.numChildren();
            if (playerCount >= 2) {
              // Al menys hi ha 2 jugadors, per tant comença el joc
              posicio_Monedes();
            }
            else {
              firebase.database().ref(`partides/${partidaSeleccionada}/monedes/`).remove();
              // Espera a que s'uneixin més jugadors
              console.log("Esperant a que entrin més jugadors...");
            }
          })
          .catch(error => {
            console.error('Error al obtenir dades dels jugadors:', error);
          });
      });

      
      var spawns = [{ x: 3, y: 5 }, { x: 8, y: 8 }, { x: 10, y: 10 }];
      var {x, y} = spawns[Math.floor(Math.random() * spawns.length)];

      jugador.set({
        id: id_jugador,
        name,
        color: Color,
        x,
        y,
        monedes: 0,
      })

      //Elimina el jugador quan es desconecta
      jugador.onDisconnect().remove();

      //Inicia el joc
      startGame();
    }
  })

  firebase.auth().signInAnonymously().catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;

    console.log(errorCode, errorMessage);
  });


})();
