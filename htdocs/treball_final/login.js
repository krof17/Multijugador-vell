const db = firebase.database();
const usuari = firebase.auth();

async function register() {
  var email = document.getElementById('email_register').value;
  var phone = document.getElementById('phone_register').value;
  var password = document.getElementById('password_register').value;
  var password_2 = document.getElementById('password_repetida').value;
  var nom = document.getElementById('full_name').value;

  // Verificar si las contraseñas coinciden
  if (password !== password_2) {
    alert("Las contraseñas no coinciden.");
    return;
  }

  if (!validacio_correu(email) || !camo_no_buit(nom)) {
    alert("El correo o el nombre no son correctos.");
    return;
  }

  if (!(await validate_password(password))) {
    alert("La contraseña ya existe.");
    return;
  }

  // Registro del usuario en Firebase
  usuari.createUserWithEmailAndPassword(email, password).then(function () {
    var usuari_actual = usuari.currentUser;

    // Verificación por teléfono
    var phoneProvider = new firebase.auth.PhoneAuthProvider();
    phoneProvider.verifyPhoneNumber(phone, new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
    })).then((verificationId) => {
      var verificationCode = prompt('Por favor, escribe el código de verificación');
      return firebase.auth.PhoneAuthProvider.credential(verificationId, verificationCode);
    }).then((phoneCredential) => {
      return usuari_actual.updatePhoneNumber(phoneCredential);
    }).then(() => {
      var db_ref = db.ref();

      var now = new Date();
      var dia = now.getDate();
      var mes = now.getMonth() + 1;
      var any = now.getFullYear();
      var hora = now.getHours();
      var minuts = now.getMinutes();
      var segons = now.getSeconds();

      var data = `${dia}/${mes}/${any} ${hora}:${minuts}:${segons}`;

      var user_data = {
        email: email,
        nom: nom,
        ultim_login: data
      }

      db_ref.child('users/' + usuari_actual.uid).set(user_data);
      alert("Usuario registrado correctamente.");
    }).catch((error) => {
      console.error("Error in phone verification:", error);
      alert("Error en la verificación por teléfono. Por favor, inténtalo de nuevo.");
    });
  }).catch((error) => {
    var error_code = error.code;
    var error_message = error.message;

    alert(error_message);
  });
}


function login () {
  email = document.getElementById('email').value
  password = document.getElementById('password').value
  
  usuari.signInWithEmailAndPassword(email, password).then(function() {
    var usuari_actual = usuari.currentUser

    var db_ref = db.ref();
    var now = new Date();
    var dia = now.getDate();
    var mes = now.getMonth() + 1;
    var any = now.getFullYear();
    var hora = now.getHours();
    var minuts = now.getMinutes();
    var segons = now.getSeconds();

    var data = `${dia}/${mes}/${any} ${hora}:${minuts}:${segons}`;

    var user_data = {
      ultim_login : data
    }

    db_ref.child('users/' + usuari_actual.uid).update(user_data);

    alert("Benvingut!");
    ////////////////////////////////////////////////////


    const partidesRef = db.ref('/partides');

    partidesRef.once('value').then((snapshot) => {
        if (snapshot.exists()) {
            // Obtiene los datos de todas las partidas
            const partides = snapshot.val();

            // Encuentra la primera partida con menos de 6 jugadores
            let partidaSeleccionada = null;
            for (const key in partides) {
                if (partides.hasOwnProperty(key) && partides[key].num_jugadors < 6) {
                    partidaSeleccionada = key;
                    break; // Termina el bucle al encontrar la primera partida adecuada
                }
            }

            if (partidaSeleccionada) {
                console.log('Se encontró una partida con menos de 6 jugadores:', partidaSeleccionada);
                localStorage.setItem('partidaSeleccionada', partidaSeleccionada);
                window.location.href = 'index.html';
            } 
            else {
                console.log('No se encontraron partidas con menos de 6 jugadores.');

                // A continuación, puedes crear una nueva partida si es necesario
                const partida = "Partida 1";
                const jugadors = 0;
                const partidaNueva = {
                    nom: partida,
                    creacio: data,
                    num_jugadors: jugadors
                };

                db_ref.child('partides/' + partida).set(partidaNueva);
                console.log('Nueva partida creada:', partida);
                localStorage.setItem('partidaSeleccionada', partida);
                window.location.href = 'index.html';
            }
        } 
        else {
            console.log('No se encontraron datos en /partides');
            const partida = "Partida 1";
            const jugadors = 1;
            const partidaNueva = {
                nom: partida,
                creacio: data,
                num_jugadors: jugadors
            };

            db_ref.child('partides/' + partida).set(partidaNueva);
            console.log('Nueva partida creada:', partida);
            localStorage.setItem('partidaSeleccionada', partida);
            window.location.href = 'index.html';
        }
    });
   

    /////////////////////////////////////////////////////
    //window.location.href = 'index.html';
  
  })
  .catch(function(error) {
    alert("El correu i la contrasenya no coincideixen")
  })
}
  
// Validate Functions
function validacio_correu(email) {
    expression = /^[^@]+@\w+(\.\w+)+\w$/
    if (expression.test(email) == true) {
      return true
    } else {
      return false
    }
}
  
async function validate_password(password) {
      // Check if password has been pwned
      const hash = sha1(password);
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const text = await response.text();
      const hashes = text.split('\r\n').map(h => h.split(':'));
      const match = hashes.find(([hash, count]) => hash.toLowerCase() === suffix);
      if (match) {
          console.log(`Password has been pwned ${match[1]} times`);
          return false;
      } else {
          return true;
      }
}

function sha1(msg)
{
    function rotate_left(n,s) {
        var t4 = ( n<<s ) | (n>>>(32-s));
        return t4;
    };
    function lsb_hex(val) {
        var str="";
        var i;
        var vh;
        var vl;
        for( i=0; i<=6; i+=2 ) {
            vh = (val>>>(i*4+4))&0x0f;
            vl = (val>>>(i*4))&0x0f;
            str += vh.toString(16) + vl.toString(16);
        }
        return str;
    };
    function cvt_hex(val) {
        var str="";
        var i;
        var v;
        for( i=7; i>=0; i-- ) {
            v = (val>>>(i*4))&0x0f;
            str += v.toString(16);
        }
        return str;
    };
    function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    };
    var blockstart;
    var i, j;
    var W = new Array(80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var temp;
    msg = Utf8Encode(msg);
    var msg_len = msg.length;
    var word_array = new Array();
    for( i=0; i<msg_len-3; i+=4 ) {
        j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
        msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
        word_array.push( j );
    }
    switch( msg_len % 4 ) {
        case 0: i = 0x080000000; break;
        case 1: i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000; break;
        case 2: i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000; break;
        case 3: i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8  | 0x80; break;
    }
    word_array.push( i );
    while( (word_array.length % 16) != 14 ) word_array.push( 0 );
    word_array.push( msg_len>>>29 );
    word_array.push( (msg_len<<3)&0x0ffffffff );
    for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {
        for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
        for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;
        for( i= 0; i<=19; i++ ) {
            temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }
        for( i=20; i<=39; i++ ) {
            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }
        for( i=40; i<=59; i++ ) {
            temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }
        for( i=60; i<=79; i++ ) {
            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }
        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;
    }
    var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
    return temp.toLowerCase();
}

  
function camo_no_buit(camp) {
    if (camp == null) {
        return false
    }
  
    if (camp.length <= 0) {
        return false
    } else {
        return true
    }
}
