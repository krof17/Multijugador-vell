
class KeyPressListener {
   constructor(codiTecla, callback) {
     let teclaSegura = true;
     this.keydownFunction = function(event) {
       if (event.code === codiTecla) {
          if (teclaSegura) {
             teclaSegura = false;
             callback();
          }  
       }
    };
 
    this.keyupFunction = function(event) {
       if (event.code === codiTecla) {
          teclaSegura = true;
       }         
    };
 
    document.addEventListener("keydown", this.keydownFunction);
    document.addEventListener("keyup", this.keyupFunction);
   }
 
   unbind() { 
     document.removeEventListener("keydown", this.keydownFunction);
     document.removeEventListener("keyup", this.keyupFunction);
   }
 }
 