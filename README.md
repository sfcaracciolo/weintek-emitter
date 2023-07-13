## weintek-emitter

Es una interfaz que permite simular la librería **dgram** en el proyecto **cmt-snmp** (https://github.com/sfcaracciolo/cmt-snmp). Fue concebida para trabajar en conjunto con un macro de EBPro (*SNMP driver.ebm*) que maneja dos drivers: un *server UDP* destinado al *SNMP Agent*, y un *socket UDP* destinado al *SNMP Originator*.

Conceptualmente, el macro espera un paquete en el *server UDP*, al recibirlo informa mediante ```TRIGGER``` e ```IS_TRAP=false``` y queda en estado de espera. El trigger ejecuta, en el contexto JS, la maquinaria para leer el buffer y crear la respuesta SNMP con **cmt-snmp**, cuando la tiene, escribe el buffer y setea ```READY``` para informar al macro que deje de esperar y despache el paquete. 

Por otro lado, el macro verifica cuando hay una notificación disponible, si la encuentra, informa mediante ```TRIGGER``` e ```IS_TRAP=true```. En el objeto JS, se crea el TRAP con **cmt-snmp** y setea ```READY``` para informar al macro que deje de esperar y despache el paquete por *socket UDP*. 

En todos los casos, si durante la espera del macro, el contexto JS falla, se setea ```ERROR```.

Para su correcto funcionamiento, requiere definer las siguientes varibles en *this.config*:

* ```TRIGGER```: Variable que al cambiar de valor se ejecuta la lectura del buffer para generar el RESPONSE o se crea el TRAP según IS_TRAP. 
* ```IS_TRAP```: Flag que informa si se requiere crear un TRAP o un RESPONSE.
* ```IO_BUFFER```: Variable inicial donde leer y escribir el socket UDP.
* ```IO_BUFFER_LEN```: Variable indicando el tamaño del paquete recibido o a enviar.
* ```READY```: Flag que informa cuando se ha terminado de escribir el buffer.
* ```ERROR```: Flag que informa cuando ocurre un error durante la creación de la respuesta SNMP.

