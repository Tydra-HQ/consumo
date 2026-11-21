/* Mi Consumo — idiomas (español, inglés, portugués).
   El código y el HTML están en español; este archivo traduce lo que aparece en pantalla.
   Cada fila: [español, inglés, portugués, francés, italiano, alemán]. "#" = un número; "{}" = cualquier texto (nombre de estación, auto, etc.). */
'use strict';

const LANGS = { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', it: 'Italiano', de: 'Deutsch' };
const LOCALES = { es: 'es-AR', en: 'en-US', pt: 'pt-BR', fr: 'fr-FR', it: 'it-IT', de: 'de-DE' };
const MONTHS_L = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  fr: ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'],
  it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
};

const T = [
  ["GLP","LPG","GLP","GPL","GPL","Autogas (LPG)"],
  ["Independiente","Independent","Independente","Indépendante","Indipendente","Freie Tankstelle"],
  ["Mi consumo","My fuel log","Meu consumo","Mon carburant","Il mio consumo","Mein Verbrauch"],
  ["¡Hola!","Hi!","Olá!","Bonjour !","Ciao!","Hallo!"],
  ["¡Hola, {}!","Hi, {}!","Olá, {}!","Bonjour, {} !","Ciao, {}!","Hallo, {}!"],
  ["Mi auto","My car","Meu carro","Ma voiture","La mia auto","Mein Auto"],
  ["Mis autos","My cars","Meus carros","Mes voitures","Le mie auto","Meine Autos"],
  ["Bienvenido","Welcome","Bem-vindo","Bienvenue","Benvenuto","Willkommen"],
  ["Registrá cada carga y te mostramos cuánto rinde tu auto.","Log every refuel and we’ll show you how far your car goes.","Registre cada abastecimento e mostramos quanto seu carro rende.","Enregistrez chaque plein et nous vous montrons ce que consomme votre voiture.","Registra ogni rifornimento e ti mostriamo quanto consuma la tua auto.","Erfasse jede Tankfüllung und wir zeigen dir, wie viel dein Auto verbraucht."],
  ["Tip: empezá con el tanque lleno. Desde la siguiente carga completa ya vas a ver tu consumo.","Tip: start with a full tank. From the next full refuel you’ll see your consumption.","Dica: comece com o tanque cheio. A partir do próximo tanque cheio você verá seu consumo.","Astuce : commencez avec un plein complet. Dès le plein suivant, vous verrez votre consommation.","Consiglio: inizia con il pieno. Dal prossimo pieno vedrai il tuo consumo.","Tipp: Starte mit vollem Tank. Ab der nächsten Volltankung siehst du deinen Verbrauch."],
  ["Último tanque medido","Last measured tank","Último tanque medido","Dernier plein mesuré","Ultimo pieno misurato","Zuletzt gemessene Tankfüllung"],
  ["= promedio","= average","= média","= moyenne","= media","= Durchschnitt"],
  ["▲ # vs. promedio","▲ # vs. average","▲ # vs. média","▲ # vs moyenne","▲ # vs media","▲ # vs. Durchschnitt"],
  ["▼ # vs. promedio","▼ # vs. average","▼ # vs. média","▼ # vs moyenne","▼ # vs media","▼ # vs. Durchschnitt"],
  ["Combustible de {} (#{})","Fuel from {} (#{})","Combustível de {} (#{})","Carburant de {} (#{})","Carburante di {} (#{})","Kraftstoff von {} (#{})"],
  ["Costo por km hoy","Cost per km today","Custo por km hoje","Coût par km aujourd’hui","Costo al km oggi","Kosten pro km heute"],
  ["Gastado este mes","Spent this month","Gasto este mês","Dépensé ce mois-ci","Speso questo mese","Diesen Monat ausgegeben"],
  ["Registrar carga","Log refuel","Registrar abastecimento","Enregistrer un plein","Registra rifornimento","Tankung erfassen"],
  ["Iniciar viaje","Start trip","Iniciar viagem","Démarrer un trajet","Inizia viaggio","Fahrt starten"],
  ["Terminar viaje","End trip","Encerrar viagem","Terminer le trajet","Termina viaggio","Fahrt beenden"],
  ["Viaje en curso","Trip in progress","Viagem em andamento","Trajet en cours","Viaggio in corso","Fahrt läuft"],
  ["Últimas cargas","Latest refuels","Últimos abastecimentos","Derniers pleins","Ultimi rifornimenti","Letzte Tankungen"],
  ["Ver todo","See all","Ver tudo","Tout voir","Vedi tutto","Alle ansehen"],
  ["Todavía no registraste cargas.","No refuels logged yet.","Nenhum abastecimento registrado ainda.","Aucun plein enregistré.","Nessun rifornimento registrato.","Noch keine Tankungen erfasst."],
  ["en uso","in use","em uso","en cours","in uso","in Gebrauch"],
  ["parcial","partial","parcial","partiel","parziale","teilweise"],
  ["Tendencia de consumo de los últimos tanques","Consumption trend of the last tanks","Tendência de consumo dos últimos tanques","Tendance de consommation des derniers pleins","Andamento dei consumi degli ultimi pieni","Verbrauchstrend der letzten Tankfüllungen"],
  ["Inicio","Home","Início","Accueil","Home","Start"],
  ["Historial","History","Histórico","Historique","Storico","Verlauf"],
  ["Viajes","Trips","Viagens","Trajets","Viaggi","Fahrten"],
  ["Paso # de #","Step # of #","Passo # de #","Étape # sur #","Passo # di #","Schritt # von #"],
  ["Paso # de # · {}","Step # of # · {}","Passo # de # · {}","Étape # sur # · {}","Passo # di # · {}","Schritt # von # · {}"],
  ["¿Dónde estás cargando?","Where are you refueling?","Onde você está abastecendo?","Où faites-vous le plein ?","Dove stai facendo rifornimento?","Wo tankst du?"],
  ["Buscando tu ubicación…","Finding your location…","Buscando sua localização…","Recherche de votre position…","Cerco la tua posizione…","Standort wird gesucht…"],
  ["Siguiendo tu ubicación en vivo. Tocá tu estación o esperá a llegar.","Following your location live. Tap your station or wait until you arrive.","Seguindo sua localização ao vivo. Toque no seu posto ou espere chegar.","Suivi de votre position en direct. Touchez votre station ou attendez d’arriver.","Seguo la tua posizione in tempo reale. Tocca il tuo distributore o aspetta di arrivare.","Dein Standort wird live verfolgt. Tippe auf deine Tankstelle oder warte, bis du ankommst."],
  ["Estás fuera de {}:","You are outside {}:","Você está fora de {}:","Vous êtes hors de {} :","Sei fuori da {}:","Du bist außerhalb von {}:"],
  ["tocá el mapa donde estás","tap the map where you are","toque no mapa onde você está","touchez la carte là où vous êtes","tocca la mappa dove sei","tippe auf der Karte auf deinen Standort"],
  ["(o buscá la estación).","(or search for the station).","(ou procure o posto).","(ou cherchez la station).","(o cerca il distributore).","(oder suche die Tankstelle)."],
  ["País: automático ({}) ▾","Country: automatic ({}) ▾","País: automático ({}) ▾","Pays : automatique ({}) ▾","Paese: automatico ({}) ▾","Land: automatisch ({}) ▾"],
  ["País: {} ▾","Country: {} ▾","País: {} ▾","Pays : {} ▾","Paese: {} ▾","Land: {} ▾"],
  ["Bandera: todas ▾","Brand: all ▾","Bandeira: todas ▾","Enseigne : toutes ▾","Marchio: tutti ▾","Marke: alle ▾"],
  ["Bandera: # elegidas ▾","Brand: # selected ▾","Bandeira: # escolhidas ▾","Enseigne : # choisies ▾","Marchio: # scelti ▾","Marke: # gewählt ▾"],
  ["Bandera: {} ▾","Brand: {} ▾","Bandeira: {} ▾","Enseigne : {} ▾","Marchio: {} ▾","Marke: {} ▾"],
  ["¿Qué banderas querés ver?","Which brands do you want to see?","Quais bandeiras você quer ver?","Quelles enseignes voulez-vous voir ?","Quali marchi vuoi vedere?","Welche Marken willst du sehen?"],
  ["Sin ninguna marcada se ven todas.","With none selected, all are shown.","Sem nenhuma marcada, aparecem todas.","Si aucune n’est cochée, toutes s’affichent.","Se nessuno è selezionato, si vedono tutti.","Ist keine ausgewählt, werden alle angezeigt."],
  ["Aplicar","Apply","Aplicar","Appliquer","Applica","Anwenden"],
  ["Ver todas","Show all","Ver todas","Tout afficher","Mostra tutti","Alle anzeigen"],
  ["En movimiento · usalo solo con el teléfono en un soporte","Moving · use it only with the phone in a holder","Em movimento · use só com o celular no suporte","En mouvement · à utiliser seulement avec le téléphone sur un support","In movimento · usalo solo con il telefono su un supporto","In Bewegung · nur mit dem Handy in einer Halterung benutzen"],
  ["Te encontramos en una estación.","We found you at a station.","Encontramos você em um posto.","Nous vous avons trouvé dans une station.","Ti abbiamo trovato in un distributore.","Wir haben dich an einer Tankstelle gefunden."],
  ["Estás en","You are at","Você está em","Vous êtes à","Sei a","Du bist bei"],
  ["{} · a # m de vos","{} · # m from you","{} · a # m de você","{} · à # m de vous","{} · a # m da te","{} · # m von dir"],
  ["a # m de vos","# m from you","a # m de você","à # m de vous","a # m da te","# m von dir"],
  ["Sí, estoy acá","Yes, I’m here","Sim, estou aqui","Oui, je suis ici","Sì, sono qui","Ja, ich bin hier"],
  ["No, elegir otra estación","No, choose another station","Não, escolher outro posto","Non, choisir une autre station","No, scegli un altro distributore","Nein, andere Tankstelle wählen"],
  ["Centrar el mapa en mi ubicación","Center the map on my location","Centralizar o mapa na minha localização","Centrer la carte sur ma position","Centra la mappa sulla mia posizione","Karte auf meinen Standort zentrieren"],
  ["Orientación del mapa","Map orientation","Orientação do mapa","Orientation de la carte","Orientamento della mappa","Kartenausrichtung"],
  ["El mapa gira según tu rumbo","The map turns with your heading","O mapa gira conforme sua direção","La carte tourne selon votre direction","La mappa ruota con la tua direzione","Die Karte dreht sich mit deiner Fahrtrichtung"],
  ["Norte siempre arriba","North always up","Norte sempre para cima","Nord toujours en haut","Nord sempre in alto","Norden immer oben"],
  ["Hasta la estación: {} · # min","To the station: {} · # min","Até o posto: {} · # min","Jusqu’à la station : {} · # min","Fino al distributore: {} · # min","Bis zur Tankstelle: {} · # Min."],
  ["Hasta la estación: {} en línea recta","To the station: {} in a straight line","Até o posto: {} em linha reta","Jusqu’à la station : {} à vol d’oiseau","Fino al distributore: {} in linea d’aria","Bis zur Tankstelle: {} Luftlinie"],
  ["Cómo llegar a {}","Directions to {}","Como chegar a {}","Itinéraire vers {}","Indicazioni per {}","Route zu {}"],
  ["Estaciones cerca tuyo","Stations near you","Postos perto de você","Stations près de vous","Distributori vicino a te","Tankstellen in deiner Nähe"],
  ["Estaciones en el mapa (#)","Stations on the map (#)","Postos no mapa (#)","Stations sur la carte (#)","Distributori sulla mappa (#)","Tankstellen auf der Karte (#)"],
  ["Acercá el mapa para ver estaciones","Zoom in to see stations","Aproxime o mapa para ver os postos","Zoomez pour voir les stations","Ingrandisci la mappa per vedere i distributori","Zoome hinein, um Tankstellen zu sehen"],
  ["No hay estaciones en esta zona del mapa","No stations in this area of the map","Não há postos nesta área do mapa","Aucune station dans cette zone de la carte","Nessun distributore in questa zona della mappa","Keine Tankstellen in diesem Kartenbereich"],
  ["y # más: acercá el mapa para verlas","and # more: zoom in to see them","e mais #: aproxime o mapa para vê-los","et # de plus : zoomez pour les voir","e altri #: ingrandisci per vederli","und # weitere: zoome hinein, um sie zu sehen"],
  ["Buscando estaciones cercanas…","Looking for nearby stations…","Buscando postos próximos…","Recherche des stations proches…","Cerco distributori vicini…","Suche Tankstellen in der Nähe…"],
  ["Usadas recientemente","Recently used","Usados recentemente","Utilisées récemment","Usati di recente","Zuletzt genutzt"],
  ["Buscá tu estación","Search for your station","Procure seu posto","Cherchez votre station","Cerca il tuo distributore","Suche deine Tankstelle"],
  ["Buscar por marca, calle o ciudad","Search by brand, street or city","Buscar por bandeira, rua ou cidade","Chercher par enseigne, rue ou ville","Cerca per marchio, via o città","Nach Marke, Straße oder Stadt suchen"],
  ["No está en la lista · Buscar estación","Not on the list · Search station","Não está na lista · Buscar posto","Pas dans la liste · Chercher une station","Non è nella lista · Cerca distributore","Nicht in der Liste · Tankstelle suchen"],
  ["+ Agregar una estación nueva acá","+ Add a new station here","+ Adicionar um posto novo aqui","+ Ajouter une nouvelle station ici","+ Aggiungi un nuovo distributore qui","+ Neue Tankstelle hier hinzufügen"],
  ["Sin resultados. Podés agregarla como estación nueva.","No results. You can add it as a new station.","Sem resultados. Você pode adicioná-lo como posto novo.","Aucun résultat. Vous pouvez l’ajouter comme nouvelle station.","Nessun risultato. Puoi aggiungerlo come nuovo distributore.","Keine Ergebnisse. Du kannst sie als neue Tankstelle hinzufügen."],
  ["TUYA","YOURS","SEU","À VOUS","TUO","DEINE"],
  ["Siguiente","Next","Próximo","Suivant","Avanti","Weiter"],
  ["Volver al inicio","Back to home","Voltar ao início","Retour à l’accueil","Torna alla home","Zurück zum Start"],
  ["Volver al paso #","Back to step #","Voltar ao passo #","Retour à l’étape #","Torna al passo #","Zurück zu Schritt #"],
  ["Este navegador no permite usar el GPS.","This browser doesn’t allow GPS.","Este navegador não permite usar o GPS.","Ce navigateur ne permet pas d’utiliser le GPS.","Questo browser non permette di usare il GPS.","Dieser Browser erlaubt kein GPS."],
  ["No pudimos ubicarte. Buscá la estación a mano.","We couldn’t locate you. Search for the station manually.","Não conseguimos localizar você. Procure o posto manualmente.","Impossible de vous localiser. Cherchez la station manuellement.","Non siamo riusciti a localizzarti. Cerca il distributore a mano.","Wir konnten dich nicht orten. Suche die Tankstelle manuell."],
  ["Sin permiso para usar el GPS. Podés buscar la estación a mano.","No permission to use GPS. You can search for the station manually.","Sem permissão para usar o GPS. Você pode procurar o posto manualmente.","Pas d’autorisation pour le GPS. Vous pouvez chercher la station manuellement.","Nessun permesso per il GPS. Puoi cercare il distributore a mano.","Keine GPS-Berechtigung. Du kannst die Tankstelle manuell suchen."],
  ["¿En qué país cargás?","Which country are you refueling in?","Em que país você abastece?","Dans quel pays faites-vous le plein ?","In che paese fai rifornimento?","In welchem Land tankst du?"],
  ["Si elegís un país distinto de donde estás, el mapa se abre allí y tocás tu ubicación (sirve para probar).","If you choose a country other than where you are, the map opens there and you tap your location (useful for testing).","Se escolher um país diferente de onde está, o mapa abre lá e você toca na sua localização (serve para testar).","Si vous choisissez un autre pays que celui où vous êtes, la carte s’ouvre là-bas et vous touchez votre position (utile pour tester).","Se scegli un paese diverso da dove sei, la mappa si apre lì e tocchi la tua posizione (utile per provare).","Wählst du ein anderes Land als deinen Standort, öffnet sich die Karte dort und du tippst deine Position an (praktisch zum Testen)."],
  ["Automático (según el GPS)","Automatic (by GPS)","Automático (pelo GPS)","Automatique (par GPS)","Automatico (tramite GPS)","Automatisch (per GPS)"],
  ["✓ Automático (según el GPS)","✓ Automatic (by GPS)","✓ Automático (pelo GPS)","✓ Automatique (par GPS)","✓ Automatico (tramite GPS)","✓ Automatisch (per GPS)"],
  ["Automático (según dónde estés)","Automatic (by where you are)","Automático (conforme onde você está)","Automatique (selon où vous êtes)","Automatico (in base a dove sei)","Automatisch (je nach Standort)"],
  ["Argentina","Argentina","Argentina","Argentine","Argentina","Argentinien"],
  ["España","Spain","Espanha","Espagne","Spagna","Spanien"],
  ["Brasil","Brazil","Brasil","Brésil","Brasile","Brasilien"],
  ["✓ {}","✓ {}","✓ {}","✓ {}","✓ {}","✓ {}"],
  ["Estás en {}: cargando sus estaciones…","You’re in {}: loading its stations…","Você está em {}: carregando os postos…","Vous êtes en {} : chargement de ses stations…","Sei in {}: carico i suoi distributori…","Du bist in {}: Tankstellen werden geladen…"],
  ["No se pudo cargar la base de estaciones de {}.","Couldn’t load the station list for {}.","Não foi possível carregar os postos de {}.","Impossible de charger la liste des stations de {}.","Impossibile caricare l’elenco dei distributori di {}.","Die Tankstellenliste für {} konnte nicht geladen werden."],
  ["Nueva estación","New station","Posto novo","Nouvelle station","Nuovo distributore","Neue Tankstelle"],
  ["Guardar estación","Save station","Salvar posto","Enregistrer la station","Salva distributore","Tankstelle speichern"],
  ["Estación agregada.","Station added.","Posto adicionado.","Station ajoutée.","Distributore aggiunto.","Tankstelle hinzugefügt."],
  ["Para agregar una estación necesitamos tu ubicación (GPS).","To add a station we need your location (GPS).","Para adicionar um posto precisamos da sua localização (GPS).","Pour ajouter une station, nous avons besoin de votre position (GPS).","Per aggiungere un distributore ci serve la tua posizione (GPS).","Um eine Tankstelle hinzuzufügen, brauchen wir deinen Standort (GPS)."],
  ["Se guarda en tu ubicación actual. Queda en tu teléfono aunque se actualice la base, y más adelante se enviará como sugerencia.","It’s saved at your current location. It stays on your phone even if the list is updated, and will be sent as a suggestion later.","É salvo na sua localização atual. Fica no seu celular mesmo se a base for atualizada e depois será enviado como sugestão.","Elle est enregistrée à votre position actuelle. Elle reste sur votre téléphone même si la liste est mise à jour, et sera envoyée comme suggestion plus tard.","Viene salvato nella tua posizione attuale. Resta sul tuo telefono anche se l’elenco viene aggiornato e più avanti sarà inviato come suggerimento.","Sie wird an deinem aktuellen Standort gespeichert. Sie bleibt auf deinem Handy, auch wenn die Liste aktualisiert wird, und wird später als Vorschlag gesendet."],
  ["¿Corregimos la ubicación?","Shall we fix the location?","Corrigimos a localização?","On corrige l’emplacement ?","Correggiamo la posizione?","Standort korrigieren?"],
  ["Sí, estoy acá: corregir ubicación","Yes, I’m here: fix location","Sim, estou aqui: corrigir localização","Oui, je suis ici : corriger l’emplacement","Sì, sono qui: correggi la posizione","Ja, ich bin hier: Standort korrigieren"],
  ["No, solo elegirla","No, just choose it","Não, só escolher","Non, juste la choisir","No, solo sceglierlo","Nein, nur auswählen"],
  ["Ubicación corregida. ¡Gracias!","Location fixed. Thanks!","Localização corrigida. Obrigado!","Emplacement corrigé. Merci !","Posizione corretta. Grazie!","Standort korrigiert. Danke!"],
  ["Ej.: Shell Libertador San Isidro","E.g.: Shell Main Street","Ex.: Shell Av. Paulista","Ex. : Shell Grand-Rue","Es.: Shell Via Roma","Z. B.: Shell Hauptstraße"],
  ["Estación","Station","Posto","Station","Distributore","Tankstelle"],
  ["Ver en el mapa ↗","View on map ↗","Ver no mapa ↗","Voir sur la carte ↗","Vedi sulla mappa ↗","Auf der Karte ansehen ↗"],
  ["¿Cuánto cargaste?","How much did you fill?","Quanto você abasteceu?","Combien avez-vous mis ?","Quanto hai messo?","Wie viel hast du getankt?"],
  ["Fecha de la carga","Refuel date","Data do abastecimento","Date du plein","Data del rifornimento","Datum der Tankung"],
  ["Combustible","Fuel","Combustível","Carburant","Carburante","Kraftstoff"],
  ["Como la última vez","Same as last time","Como da última vez","Comme la dernière fois","Come l’ultima volta","Wie beim letzten Mal"],
  ["Tu combustible habitual","Your usual fuel","Seu combustível habitual","Votre carburant habituel","Il tuo carburante abituale","Dein üblicher Kraftstoff"],
  ["Litros","Liters","Litros","Litres","Litri","Liter"],
  ["Total pagado ($)","Total paid ($)","Total pago ($)","Total payé ($)","Totale pagato ($)","Bezahlt gesamt ($)"],
  ["Total pagado (€)","Total paid (€)","Total pago (€)","Total payé (€)","Totale pagato (€)","Bezahlt gesamt (€)"],
  ["Total pagado (R$)","Total paid (R$)","Total pago (R$)","Total payé (R$)","Totale pagato (R$)","Bezahlt gesamt (R$)"],
  ["Precio por litro","Price per liter","Preço por litro","Prix au litre","Prezzo al litro","Preis pro Liter"],
  ["Precio","Price","Preço","Prix","Prezzo","Preis"],
  ["Precio oficial hoy:","Official price today:","Preço oficial hoje:","Prix officiel aujourd’hui :","Prezzo ufficiale oggi:","Offizieller Preis heute:"],
  ["¿Llenaste el tanque?","Did you fill the tank?","Encheu o tanque?","Avez-vous fait le plein complet ?","Hai fatto il pieno?","Hast du vollgetankt?"],
  ["Con tanque lleno calculamos el consumo exacto.","With a full tank we calculate exact consumption.","Com o tanque cheio calculamos o consumo exato.","Avec un plein complet, nous calculons la consommation exacte.","Con il pieno calcoliamo il consumo esatto.","Mit vollem Tank berechnen wir den genauen Verbrauch."],
  ["Tanque lleno","Full tank","Tanque cheio","Plein complet","Pieno","Vollgetankt"],
  ["Súper","Regular","Comum","Ordinaire","Normale","Normal"],
  ["Premium","Premium","Premium","Premium","Premium","Premium"],
  ["Diésel","Diesel","Diesel","Gazole","Gasolio","Diesel"],
  ["GNC","CNG","GNV","GNV","Metano","Erdgas (CNG)"],
  ["Gasolina 95","Petrol 95","Gasolina 95","Essence 95","Benzina 95","Super 95"],
  ["Gasolina 98","Petrol 98","Gasolina 98","Essence 98","Benzina 98","Super Plus 98"],
  ["Diésel+","Diesel+","Diesel+","Gazole+","Gasolio+","Diesel+"],
  ["Gasolina","Gasoline","Gasolina","Essence","Benzina","Benzin"],
  ["Gasolina aditivada","Premium gasoline","Gasolina aditivada","Essence premium","Benzina premium","Premiumbenzin"],
  ["Etanol","Ethanol","Etanol","Éthanol","Etanolo","Ethanol"],
  ["¿Revisamos los litros?","Check the liters?","Revisamos os litros?","Vérifier les litres ?","Controlliamo i litri?","Liter prüfen?"],
  ["Está bien, seguir","It’s fine, continue","Está certo, continuar","C’est bon, continuer","Va bene, continua","Passt, weiter"],
  ["¿Qué marca el cuentakilómetros?","What does the odometer read?","Quanto marca o hodômetro?","Qu’indique le compteur kilométrique ?","Cosa segna il contachilometri?","Was zeigt der Kilometerzähler?"],
  ["Primera carga: anotá el kilometraje actual.","First refuel: enter the current odometer.","Primeiro abastecimento: anote a quilometragem atual.","Premier plein : saisissez le kilométrage actuel.","Primo rifornimento: inserisci il chilometraggio attuale.","Erste Tankung: gib den aktuellen Kilometerstand ein."],
  ["Carga anterior:","Previous refuel:","Abastecimento anterior:","Plein précédent :","Rifornimento precedente:","Vorherige Tankung:"],
  ["Limpiar","Clear","Limpar","Effacer","Cancella","Löschen"],
  ["Guardar y calcular","Save and calculate","Salvar e calcular","Enregistrer et calculer","Salva e calcola","Speichern und berechnen"],
  ["km desde la carga anterior","km since the previous refuel","km desde o abastecimento anterior","km depuis le plein précédent","km dal rifornimento precedente","km seit der letzten Tankung"],
  ["km desde la carga anterior. ¿Lo guardamos igual?","km since the previous refuel. Save anyway?","km desde o abastecimento anterior. Salvamos mesmo assim?","km depuis le plein précédent. On enregistre quand même ?","km dal rifornimento precedente. Salviamo comunque?","km seit der letzten Tankung. Trotzdem speichern?"],
  ["Sí, guardar","Yes, save","Sim, salvar","Oui, enregistrer","Sì, salva","Ja, speichern"],
  ["¿Es correcto?","Is that right?","Está correto?","C’est correct ?","È corretto?","Stimmt das?"],
  ["¡Carga guardada!","Refuel saved!","Abastecimento salvo!","Plein enregistré !","Rifornimento salvato!","Tankung gespeichert!"],
  ["Consumo del tanque anterior","Previous tank consumption","Consumo do tanque anterior","Consommation du plein précédent","Consumo del pieno precedente","Verbrauch der vorherigen Tankfüllung"],
  ["km recorridos","km driven","km rodados","km parcourus","km percorsi","gefahrene km"],
  ["l cada # km","l per # km","l a cada # km","l aux # km","l ogni # km","l pro # km"],
  ["Ver mis gráficos","See my charts","Ver meus gráficos","Voir mes graphiques","Vedi i miei grafici","Meine Diagramme ansehen"],
  ["Igual que tu promedio.","Same as your average.","Igual à sua média.","Identique à votre moyenne.","Uguale alla tua media.","Genau wie dein Durchschnitt."],
  ["rinde más que tu promedio","goes further than your average","rende mais que sua média","va plus loin que votre moyenne","rende più della tua media","kommt weiter als dein Durchschnitt"],
  ["gasta más","uses more","gasta mais","consomme plus","consuma di più","verbraucht mehr"],
  ["Consumo estimado:","Estimated consumption:","Consumo estimado:","Consommation estimée :","Consumo stimato:","Geschätzter Verbrauch:"],
  ["Estimado hasta ahora:","Estimated so far:","Estimado até agora:","Estimé jusqu’ici :","Stima finora:","Bisher geschätzt:"],
  ["· se compara en la próxima carga","· compared at the next refuel","· comparado no próximo abastecimento","· comparé au prochain plein","· confrontato al prossimo rifornimento","· Vergleich bei der nächsten Tankung"],
  ["casi exacto","almost exact","quase exato","presque exact","quasi esatto","fast genau"],
  ["Consumo (km/l)","Consumption (km/l)","Consumo (km/l)","Consommation (km/l)","Consumo (km/l)","Verbrauch (km/l)"],
  ["Gasto por mes","Spending per month","Gasto por mês","Dépenses par mois","Spesa mensile","Ausgaben pro Monat"],
  ["Por estación","By station","Por posto","Par station","Per distributore","Nach Tankstelle"],
  ["Todas las cargas","All refuels","Todos os abastecimentos","Tous les pleins","Tutti i rifornimenti","Alle Tankungen"],
  ["Rinde","Mileage","Rende","Rendement","Resa","Reichweite"],
  ["Cargas","Refuels","Abastecimentos","Pleins","Rifornimenti","Tankungen"],
  ["Todo","All","Tudo","Tout","Tutto","Alles"],
  ["Sin gastos en este período.","No spending in this period.","Sem gastos neste período.","Aucune dépense sur cette période.","Nessuna spesa in questo periodo.","Keine Ausgaben in diesem Zeitraum."],
  ["Necesitás al menos dos tanques llenos medidos para ver el gráfico.","You need at least two measured full tanks to see the chart.","Você precisa de pelo menos dois tanques cheios medidos para ver o gráfico.","Il faut au moins deux pleins complets mesurés pour voir le graphique.","Servono almeno due pieni misurati per vedere il grafico.","Für das Diagramm brauchst du mindestens zwei gemessene Volltankungen."],
  ["Todavía no hay cargas.","No refuels yet.","Ainda não há abastecimentos.","Pas encore de pleins.","Ancora nessun rifornimento.","Noch keine Tankungen."],
  ["¿Borrar esta carga?","Delete this refuel?","Apagar este abastecimento?","Supprimer ce plein ?","Eliminare questo rifornimento?","Diese Tankung löschen?"],
  ["Borrar carga","Delete refuel","Apagar abastecimento","Supprimer le plein","Elimina rifornimento","Tankung löschen"],
  ["{}. No se puede deshacer.","{}. This can’t be undone.","{}. Não pode ser desfeito.","{}. C’est irréversible.","{}. Non si può annullare.","{}. Das kann nicht rückgängig gemacht werden."],
  ["Borrar","Delete","Apagar","Supprimer","Elimina","Löschen"],
  ["Cancelar","Cancel","Cancelar","Annuler","Annulla","Abbrechen"],
  ["Carga borrada.","Refuel deleted.","Abastecimento apagado.","Plein supprimé.","Rifornimento eliminato.","Tankung gelöscht."],
  ["Mis viajes y forma de manejar","My trips and driving style","Minhas viagens e forma de dirigir","Mes trajets et ma conduite","I miei viaggi e la mia guida","Meine Fahrten und mein Fahrstil"],
  ["# carga","# refuel","# abastecimento","# plein","# rifornimento","# Tankung"],
  ["# cargas","# refuels","# abastecimentos","# pleins","# rifornimenti","# Tankungen"],
  ["La línea punteada es tu promedio (","The dotted line is your average (","A linha pontilhada é sua média (","La ligne pointillée est votre moyenne (","La linea tratteggiata è la tua media (","Die gestrichelte Linie ist dein Durchschnitt ("],
  ["Tocá un auto para usarlo. Las cargas y los viajes quedan guardados en cada uno.","Tap a car to use it. Refuels and trips are kept with each car.","Toque em um carro para usá-lo. Abastecimentos e viagens ficam salvos em cada um.","Touchez une voiture pour l’utiliser. Les pleins et les trajets restent liés à chaque voiture.","Tocca un’auto per usarla. Rifornimenti e viaggi restano salvati con ogni auto.","Tippe auf ein Auto, um es zu nutzen. Tankungen und Fahrten bleiben beim jeweiligen Auto."],
  ["EN USO","IN USE","EM USO","EN COURS","IN USO","IN GEBRAUCH"],
  ["+ Agregar auto","+ Add car","+ Adicionar carro","+ Ajouter une voiture","+ Aggiungi auto","+ Auto hinzufügen"],
  ["Archivados (#)","Archived (#)","Arquivados (#)","Archivées (#)","Archiviate (#)","Archiviert (#)"],
  ["Archivar el auto en uso…","Archive the car in use…","Arquivar o carro em uso…","Archiver la voiture utilisée…","Archivia l’auto in uso…","Aktuelles Auto archivieren…"],
  ["Archivar","Archive","Arquivar","Archiver","Archivia","Archivieren"],
  ["¿Archivar {}?","Archive {}?","Arquivar {}?","Archiver {} ?","Archiviare {}?","{} archivieren?"],
  ["Sale de la lista y se conserva todo su historial. Podés volver a usarlo desde \"Archivados\".","It leaves the list and keeps all its history. You can use it again from \"Archived\".","Sai da lista e mantém todo o histórico. Você pode usá-lo de novo em \"Arquivados\".","Elle sort de la liste et garde tout son historique. Vous pouvez la réutiliser depuis « Archivées ».","Esce dalla lista e conserva tutto lo storico. Puoi riusarla da \"Archiviate\".","Es verschwindet aus der Liste und behält seinen ganzen Verlauf. Du kannst es unter „Archiviert“ wieder nutzen."],
  ["Auto archivado.","Car archived.","Carro arquivado.","Voiture archivée.","Auto archiviata.","Auto archiviert."],
  ["Propio","Own","Próprio","Personnelle","Propria","Eigenes"],
  ["Alquilado","Rental","Alugado","Location","Noleggio","Mietwagen"],
  ["Prestado","Borrowed","Emprestado","Prêtée","In prestito","Geliehen"],
  ["Compartido","Shared","Compartilhado","Partagée","Condivisa","Geteilt"],
  ["{} · {} · # carga","{} · {} · # refuel","{} · {} · # abastecimento","{} · {} · # plein","{} · {} · # rifornimento","{} · {} · # Tankung"],
  ["{} · {} · # cargas","{} · {} · # refuels","{} · {} · # abastecimentos","{} · {} · # pleins","{} · {} · # rifornimenti","{} · {} · # Tankungen"],
  ["{} · {} · # cargas · en la nube","{} · {} · # refuels · in the cloud","{} · {} · # abastecimentos · na nuvem","{} · {} · # pleins · dans le cloud","{} · {} · # rifornimenti · nel cloud","{} · {} · # Tankungen · in der Cloud"],
  ["{} · {} · # carga · en la nube","{} · {} · # refuel · in the cloud","{} · {} · # abastecimento · na nuvem","{} · {} · # plein · dans le cloud","{} · {} · # rifornimento · nel cloud","{} · {} · # Tankung · in der Cloud"],
  ["Datos del auto en uso","Details of the car in use","Dados do carro em uso","Données de la voiture utilisée","Dati dell’auto in uso","Daten des aktuellen Autos"],
  ["Marca","Make","Marca","Marque","Marca","Marke"],
  ["Modelo","Model","Modelo","Modèle","Modello","Modell"],
  ["Año","Year","Ano","Année","Anno","Baujahr"],
  ["Año (opcional)","Year (optional)","Ano (opcional)","Année (facultatif)","Anno (facoltativo)","Baujahr (optional)"],
  ["Tanque (litros)","Tank (liters)","Tanque (litros)","Réservoir (litres)","Serbatoio (litri)","Tank (Liter)"],
  ["Tanque (l, opcional)","Tank (l, optional)","Tanque (l, opcional)","Réservoir (l, facultatif)","Serbatoio (l, facoltativo)","Tank (l, optional)"],
  ["Combustible habitual","Usual fuel","Combustível habitual","Carburant habituel","Carburante abituale","Üblicher Kraftstoff"],
  ["Elegí el combustible que carga.","Choose the fuel it takes.","Escolha o combustível que ele usa.","Choisissez le carburant qu’elle utilise.","Scegli il carburante che usa.","Wähle den Kraftstoff, den es tankt."],
  ["cargado en","filled at","abastecido em","fait chez","fatto da","getankt bei"],
  ["¿Qué combustible carga?","Which fuel does it take?","Qual combustível ele usa?","Quel carburant utilise-t-elle ?","Che carburante usa?","Welchen Kraftstoff tankt es?"],
  ["Guardar auto","Save car","Salvar carro","Enregistrer la voiture","Salva auto","Auto speichern"],
  ["Guardado ✓","Saved ✓","Salvo ✓","Enregistré ✓","Salvato ✓","Gespeichert ✓"],
  ["Auto guardado.","Car saved.","Carro salvo.","Voiture enregistrée.","Auto salvata.","Auto gespeichert."],
  ["Auto nuevo","New car","Carro novo","Nouvelle voiture","Nuova auto","Neues Auto"],
  ["Este auto es","This car is","Este carro é","Cette voiture est","Questa auto è","Dieses Auto ist"],
  ["Archivarlo cuando cambie de país","Archive it when I change country","Arquivar quando eu mudar de país","L’archiver quand je change de pays","Archiviala quando cambio paese","Archivieren, wenn ich das Land wechsle"],
  ["Sale de la lista y conserva su historial","It leaves the list and keeps its history","Sai da lista e mantém o histórico","Elle sort de la liste et garde son historique","Esce dalla lista e conserva lo storico","Es verschwindet aus der Liste und behält seinen Verlauf"],
  ["Se usa en {}. En la primera carga llená el tanque: el consumo aparece desde la segunda carga completa.","Used in {}. Fill the tank at the first refuel: consumption appears from the second full refuel.","Usado em {}. No primeiro abastecimento encha o tanque: o consumo aparece a partir do segundo tanque cheio.","Utilisée en {}. Au premier plein, remplissez le réservoir : la consommation apparaît à partir du deuxième plein complet.","Usata in {}. Al primo rifornimento fai il pieno: il consumo appare dal secondo pieno.","Genutzt in {}. Tanke beim ersten Mal voll: Der Verbrauch erscheint ab der zweiten Volltankung."],
  ["Guardar","Save","Salvar","Enregistrer","Salva","Speichern"],
  ["Poné al menos la marca o el modelo.","Enter at least the make or model.","Informe pelo menos a marca ou o modelo.","Indiquez au moins la marque ou le modèle.","Inserisci almeno la marca o il modello.","Gib mindestens Marke oder Modell ein."],
  ["Listo: ahora cargás con {}.","Done: you’re now refueling {}.","Pronto: agora você abastece o {}.","C’est fait : vous faites maintenant le plein de {}.","Fatto: ora fai rifornimento con {}.","Fertig: Du tankst jetzt mit {}."],
  ["Ahora: {}","Now: {}","Agora: {}","Maintenant : {}","Ora: {}","Jetzt: {}"],
  ["¿Qué auto usás?","Which car are you using?","Qual carro você está usando?","Quelle voiture utilisez-vous ?","Che auto stai usando?","Welches Auto benutzt du?"],
  ["+ Auto nuevo","+ New car","+ Carro novo","+ Nouvelle voiture","+ Nuova auto","+ Neues Auto"],
  ["Ver Mis autos","See My cars","Ver Meus carros","Voir Mes voitures","Vedi Le mie auto","Meine Autos ansehen"],
  ["Auto sin nombre","Unnamed car","Carro sem nome","Voiture sans nom","Auto senza nome","Auto ohne Namen"],
  ["Estás cargando en {}","You’re refueling in {}","Você está abastecendo em {}","Vous faites le plein en {}","Stai facendo rifornimento in {}","Du tankst in {}"],
  ["¿Con qué auto? Así el consumo de tu auto no se mezcla con el de uno alquilado.","Which car? That way your car’s consumption doesn’t mix with a rental’s.","Com qual carro? Assim o consumo do seu carro não se mistura com o de um alugado.","Quelle voiture ? Ainsi la consommation de votre voiture ne se mélange pas avec celle d’une location.","Con quale auto? Così il consumo della tua auto non si mescola con quello di un’auto a noleggio.","Welches Auto? So vermischt sich der Verbrauch deines Autos nicht mit dem eines Mietwagens."],
  ["+ Auto nuevo (alquilado o prestado)","+ New car (rental or borrowed)","+ Carro novo (alugado ou emprestado)","+ Nouvelle voiture (location ou prêt)","+ Nuova auto (noleggio o prestito)","+ Neues Auto (Miet- oder Leihwagen)"],
  ["Sigo con {}","Keep using {}","Continuo com {}","Je continue avec {}","Continuo con {}","Weiter mit {}"],
  ["Era una prueba: volver a automático","Just testing: back to automatic","Era um teste: voltar ao automático","C’était un test : revenir en automatique","Era una prova: torna ad automatico","Nur ein Test: zurück zu automatisch"],
  ["Archivamos {} ({}). Su historial queda guardado.","We archived {} ({}). Its history is kept.","Arquivamos {} ({}). O histórico fica salvo.","Nous avons archivé {} ({}). Son historique est conservé.","Abbiamo archiviato {} ({}). Il suo storico resta salvato.","Wir haben {} ({}) archiviert. Der Verlauf bleibt erhalten."],
  ["Resumen","Summary","Resumo","Résumé","Riepilogo","Übersicht"],
  ["Odómetro","Odometer","Hodômetro","Compteur","Contachilometri","Kilometerstand"],
  ["Promedio","Average","Média","Moyenne","Media","Durchschnitt"],
  ["Total gastado: {}","Total spent: {}","Total gasto: {}","Total dépensé : {}","Totale speso: {}","Insgesamt ausgegeben: {}"],
  ["País de las estaciones","Stations country","País dos postos","Pays des stations","Paese dei distributori","Land der Tankstellen"],
  ["Ahora: {} · base preparada a mano","Now: {} · hand-curated list","Agora: {} · base preparada à mão","Actuel : {} · liste préparée à la main","Ora: {} · elenco preparato a mano","Jetzt: {} · von Hand gepflegte Liste"],
  ["Ahora: {} · precios oficiales del {}","Now: {} · official prices of {}","Agora: {} · preços oficiais de {}","Actuel : {} · prix officiels du {}","Ora: {} · prezzi ufficiali del {}","Jetzt: {} · offizielle Preise vom {}"],
  ["Ahora: {} · ANP (sin precios por ahora) · {}","Now: {} · ANP (no prices yet) · {}","Agora: {} · ANP (sem preços por enquanto) · {}","Actuel : {} · ANP (pas encore de prix) · {}","Ora: {} · ANP (ancora senza prezzi) · {}","Jetzt: {} · ANP (noch ohne Preise) · {}"],
  ["Idioma","Language","Idioma","Langue","Lingua","Sprache"],
  ["Compartir","Share","Compartilhar","Partager","Condividi","Teilen"],
  ["Compartir mi consumo","Share my consumption","Compartilhar meu consumo","Partager ma consommation","Condividi il mio consumo","Meinen Verbrauch teilen"],
  ["Enviá un resumen por WhatsApp u otra app.","Send a summary via WhatsApp or another app.","Envie um resumo pelo WhatsApp ou outro app.","Envoyez un résumé par WhatsApp ou une autre app.","Invia un riepilogo su WhatsApp o un’altra app.","Sende eine Übersicht per WhatsApp oder einer anderen App."],
  ["Exportar a Excel (CSV)","Export to Excel (CSV)","Exportar para Excel (CSV)","Exporter vers Excel (CSV)","Esporta in Excel (CSV)","Nach Excel exportieren (CSV)"],
  ["Todas tus cargas en una planilla.","All your refuels in a spreadsheet.","Todos os seus abastecimentos em uma planilha.","Tous vos pleins dans un tableur.","Tutti i tuoi rifornimenti in un foglio di calcolo.","Alle deine Tankungen in einer Tabelle."],
  ["Importar cargas anteriores","Import previous refuels","Importar abastecimentos anteriores","Importer des pleins antérieurs","Importa rifornimenti precedenti","Frühere Tankungen importieren"],
  ["Desde una planilla CSV (Excel).","From a CSV (Excel) spreadsheet.","De uma planilha CSV (Excel).","Depuis un tableur CSV (Excel).","Da un foglio CSV (Excel).","Aus einer CSV-Tabelle (Excel)."],
  ["Importar","Import","Importar","Importer","Importa","Importieren"],
  ["Importar # cargas","Import # refuels","Importar # abastecimentos","Importer # pleins","Importa # rifornimenti","# Tankungen importieren"],
  ["# cargas importadas.","# refuels imported.","# abastecimentos importados.","# pleins importés.","# rifornimenti importati.","# Tankungen importiert."],
  ["Esas cargas ya estaban registradas.","Those refuels were already logged.","Esses abastecimentos já estavam registrados.","Ces pleins étaient déjà enregistrés.","Quei rifornimenti erano già registrati.","Diese Tankungen waren schon erfasst."],
  ["El archivo está vacío.","The file is empty.","O arquivo está vazio.","Le fichier est vide.","Il file è vuoto.","Die Datei ist leer."],
  ["Todavía no hay cargas para exportar.","No refuels to export yet.","Ainda não há abastecimentos para exportar.","Pas encore de pleins à exporter.","Ancora nessun rifornimento da esportare.","Noch keine Tankungen zum Exportieren."],
  ["Resumen copiado. Pegalo donde quieras.","Summary copied. Paste it anywhere.","Resumo copiado. Cole onde quiser.","Résumé copié. Collez-le où vous voulez.","Riepilogo copiato. Incollalo dove vuoi.","Übersicht kopiert. Füge sie ein, wo du willst."],
  ["Mensaje copiado.","Message copied.","Mensagem copiada.","Message copié.","Messaggio copiato.","Nachricht kopiert."],
  ["Navegación","Navigation","Navegação","Navigation","Navigazione","Navigation"],
  ["No se pudo guardar en el teléfono.","Couldn’t save on the phone.","Não foi possível salvar no celular.","Impossible d’enregistrer sur le téléphone.","Impossibile salvare sul telefono.","Speichern auf dem Handy nicht möglich."],
  ["Nube y compartir","Cloud and sharing","Nuvem e compartilhamento","Cloud et partage","Cloud e condivisione","Cloud und Teilen"],
  ["Copia en la nube (opcional)","Cloud backup (optional)","Cópia na nuvem (opcional)","Sauvegarde dans le cloud (facultatif)","Copia nel cloud (facoltativa)","Sicherung in der Cloud (optional)"],
  ["Tus cargas a salvo y en cualquier teléfono. Además podés compartir el auto.","Your refuels safe and on any phone. You can also share the car.","Seus abastecimentos seguros e em qualquer celular. Você também pode compartilhar o carro.","Vos pleins en sécurité et sur n’importe quel téléphone. Vous pouvez aussi partager la voiture.","I tuoi rifornimenti al sicuro e su qualsiasi telefono. Puoi anche condividere l’auto.","Deine Tankungen sicher und auf jedem Handy. Du kannst das Auto auch teilen."],
  ["Tu correo","Your email","Seu e-mail","Votre e-mail","La tua e-mail","Deine E-Mail"],
  ["Enviarme el enlace para entrar","Send me the sign-in link","Enviar o link de acesso","M’envoyer le lien de connexion","Inviami il link di accesso","Anmeldelink senden"],
  ["Sin contraseñas: te llega un enlace por correo.","No passwords: you get a link by email.","Sem senhas: você recebe um link por e-mail.","Sans mot de passe : vous recevez un lien par e-mail.","Senza password: ricevi un link via e-mail.","Ohne Passwort: Du bekommst einen Link per E-Mail."],
  ["Te enviamos un correo a","We sent an email to","Enviamos um e-mail para","Nous avons envoyé un e-mail à","Abbiamo inviato un’e-mail a","Wir haben eine E-Mail gesendet an"],
  [". Abrí el enlace",". Open the link",". Abra o link",". Ouvrez le lien",". Apri il link",". Öffne den Link"],
  ["desde este teléfono","from this phone","neste celular","depuis ce téléphone","da questo telefono","auf diesem Handy"],
  ["¿El correo trae un código de # dígitos? Escribilo acá:","Does the email have a #-digit code? Type it here:","O e-mail tem um código de # dígitos? Digite aqui:","L’e-mail contient un code à # chiffres ? Saisissez-le ici :","L’e-mail ha un codice di # cifre? Scrivilo qui:","Enthält die E-Mail einen #-stelligen Code? Gib ihn hier ein:"],
  ["Entrar","Sign in","Entrar","Se connecter","Accedi","Anmelden"],
  ["Usar otro correo","Use another email","Usar outro e-mail","Utiliser un autre e-mail","Usa un’altra e-mail","Andere E-Mail verwenden"],
  ["Revisá el correo.","Check the email address.","Confira o e-mail.","Vérifiez l’adresse e-mail.","Controlla l’indirizzo e-mail.","Prüfe die E-Mail-Adresse."],
  ["Código incorrecto o vencido.","Wrong or expired code.","Código incorreto ou expirado.","Code incorrect ou expiré.","Codice errato o scaduto.","Falscher oder abgelaufener Code."],
  ["Sincronizando…","Syncing…","Sincronizando…","Synchronisation…","Sincronizzazione…","Synchronisiere…"],
  ["Sincronizado ✓ {}","Synced ✓ {}","Sincronizado ✓ {}","Synchronisé ✓ {}","Sincronizzato ✓ {}","Synchronisiert ✓ {}"],
  ["No se pudo sincronizar: {}","Couldn’t sync: {}","Não foi possível sincronizar: {}","Échec de la synchronisation : {}","Impossibile sincronizzare: {}","Synchronisierung fehlgeschlagen: {}"],
  ["Sincronizar","Sync","Sincronizar","Synchroniser","Sincronizza","Synchronisieren"],
  ["Cerrar sesión","Sign out","Sair","Se déconnecter","Esci","Abmelden"],
  ["¿Cerrar sesión?","Sign out?","Sair?","Se déconnecter ?","Uscire?","Abmelden?"],
  ["Tus cargas siguen en este teléfono y en la nube.","Your refuels stay on this phone and in the cloud.","Seus abastecimentos continuam neste celular e na nuvem.","Vos pleins restent sur ce téléphone et dans le cloud.","I tuoi rifornimenti restano su questo telefono e nel cloud.","Deine Tankungen bleiben auf diesem Handy und in der Cloud."],
  ["Apodo para el ranking (opcional)","Nickname for the ranking (optional)","Apelido para o ranking (opcional)","Pseudo pour le classement (facultatif)","Nickname per la classifica (facoltativo)","Spitzname für die Rangliste (optional)"],
  ["Anónimo","Anonymous","Anônimo","Anonyme","Anonimo","Anonym"],
  ["Apodo guardado.","Nickname saved.","Apelido salvo.","Pseudo enregistré.","Nickname salvato.","Spitzname gespeichert."],
  ["Ese apodo ya está en uso.","That nickname is already taken.","Esse apelido já está em uso.","Ce pseudo est déjà pris.","Questo nickname è già in uso.","Dieser Spitzname ist schon vergeben."],
  ["No se pudo guardar el apodo.","Couldn’t save the nickname.","Não foi possível salvar o apelido.","Impossible d’enregistrer le pseudo.","Impossibile salvare il nickname.","Spitzname konnte nicht gespeichert werden."],
  ["Compartir {}","Share {}","Compartilhar {}","Partager {}","Condividi {}","{} teilen"],
  ["Para que otra persona (por ejemplo, de tu familia) registre cargas de este auto, pasale este código:","For someone else (for example, family) to log refuels for this car, give them this code:","Para que outra pessoa (por exemplo, da família) registre abastecimentos deste carro, passe este código:","Pour qu’une autre personne (de votre famille, par exemple) enregistre des pleins pour cette voiture, donnez-lui ce code :","Perché un’altra persona (per esempio della famiglia) registri rifornimenti di questa auto, passale questo codice:","Damit jemand anderes (z. B. aus der Familie) Tankungen für dieses Auto erfasst, gib ihm diesen Code:"],
  ["Enviar código","Send code","Enviar código","Envoyer le code","Invia codice","Code senden"],
  ["¿Te pasaron un código? Se agrega a tus autos:","Got a code? It’s added to your cars:","Recebeu um código? Ele é adicionado aos seus carros:","On vous a donné un code ? Il s’ajoute à vos voitures :","Ti hanno dato un codice? Si aggiunge alle tue auto:","Hast du einen Code bekommen? Er wird zu deinen Autos hinzugefügt:"],
  ["Sumarme","Join","Entrar","Rejoindre","Unisciti","Beitreten"],
  ["¿Sumarte a ese auto?","Join that car?","Entrar nesse carro?","Rejoindre cette voiture ?","Unirti a quell’auto?","Diesem Auto beitreten?"],
  ["Se agrega a \"Mis autos\" y pasa a ser el auto en uso. Tus otros autos quedan como están; cambiás desde la lista.","It’s added to \"My cars\" and becomes the car in use. Your other cars stay as they are; switch from the list.","É adicionado a \"Meus carros\" e passa a ser o carro em uso. Seus outros carros continuam iguais; troque pela lista.","Elle s’ajoute à « Mes voitures » et devient la voiture utilisée. Vos autres voitures restent telles quelles ; changez depuis la liste.","Si aggiunge a \"Le mie auto\" e diventa l’auto in uso. Le altre auto restano come sono; cambi dalla lista.","Es wird zu „Meine Autos“ hinzugefügt und zum aktuellen Auto. Deine anderen Autos bleiben, wie sie sind; wechsle über die Liste."],
  ["Listo: el auto compartido se agregó a tus autos.","Done: the shared car was added to your cars.","Pronto: o carro compartilhado foi adicionado aos seus carros.","C’est fait : la voiture partagée a été ajoutée à vos voitures.","Fatto: l’auto condivisa è stata aggiunta alle tue auto.","Fertig: Das geteilte Auto wurde zu deinen Autos hinzugefügt."],
  ["El código tiene # caracteres.","The code has # characters.","O código tem # caracteres.","Le code a # caractères.","Il codice ha # caratteri.","Der Code hat # Zeichen."],
  ["Código inexistente.","Code not found.","Código inexistente.","Code introuvable.","Codice inesistente.","Code nicht gefunden."],
  ["No se pudo abrir ese auto.","Couldn’t open that car.","Não foi possível abrir esse carro.","Impossible d’ouvrir cette voiture.","Impossibile aprire quell’auto.","Dieses Auto konnte nicht geöffnet werden."],
  ["Comparar con otros conductores","Compare with other drivers","Comparar com outros motoristas","Comparer avec d’autres conducteurs","Confronta con altri conducenti","Mit anderen Fahrern vergleichen"],
  ["Iniciá sesión para ver cómo rinde tu auto frente a otros del mismo modelo.","Sign in to see how your car compares with others of the same model.","Entre para ver como seu carro rende frente a outros do mesmo modelo.","Connectez-vous pour voir comment votre voiture se compare aux autres du même modèle.","Accedi per vedere come va la tua auto rispetto ad altre dello stesso modello.","Melde dich an, um dein Auto mit anderen desselben Modells zu vergleichen."],
  ["¿Cómo te va vs. otros {}?","How do you do vs. other {}?","Como você está vs. outros {}?","Comment vous situez-vous face aux autres {} ?","Come vai rispetto ad altri {}?","Wie schneidest du gegenüber anderen {} ab?"],
  ["Participar en el ranking (con tu apodo o como \"Anónimo\")","Join the ranking (with your nickname or as \"Anonymous\")","Participar do ranking (com seu apelido ou como \"Anônimo\")","Participer au classement (avec votre pseudo ou en « Anonyme »)","Partecipa alla classifica (con il tuo nickname o come \"Anonimo\")","An der Rangliste teilnehmen (mit Spitzname oder als „Anonym“)"],
  ["Por ahora sos el único con este modelo. ¡Invitá a otros!","You’re the only one with this model for now. Invite others!","Por enquanto você é o único com este modelo. Convide outros!","Vous êtes le seul avec ce modèle pour l’instant. Invitez d’autres personnes !","Per ora sei l’unico con questo modello. Invita altri!","Bisher bist du der Einzige mit diesem Modell. Lade andere ein!"],
  ["Todavía no hay datos de este modelo. Aparecés cuando midas al menos # km.","No data for this model yet. You’ll appear after measuring at least # km.","Ainda não há dados deste modelo. Você aparece quando medir pelo menos # km.","Pas encore de données pour ce modèle. Vous apparaîtrez après au moins # km mesurés.","Ancora nessun dato per questo modello. Comparirai dopo aver misurato almeno # km.","Noch keine Daten für dieses Modell. Du erscheinst, sobald mindestens # km gemessen sind."],
  ["Completá marca y modelo de tu auto (arriba) para compararte.","Fill in your car’s make and model (above) to compare.","Preencha marca e modelo do seu carro (acima) para comparar.","Indiquez la marque et le modèle de votre voiture (ci-dessus) pour comparer.","Inserisci marca e modello della tua auto (sopra) per confrontarti.","Gib Marke und Modell deines Autos (oben) ein, um zu vergleichen."],
  ["No se pudo cargar el ranking.","Couldn’t load the ranking.","Não foi possível carregar o ranking.","Impossible de charger le classement.","Impossibile caricare la classifica.","Rangliste konnte nicht geladen werden."],
  ["Vos","You","Você","Vous","Tu","Du"],
  ["La nube no está disponible sin conexión.","The cloud isn’t available offline.","A nuvem não está disponível sem conexão.","Le cloud n’est pas disponible hors connexion.","Il cloud non è disponibile offline.","Die Cloud ist offline nicht verfügbar."],
  ["Sugerencias de estaciones","Station suggestions","Sugestões de postos","Suggestions de stations","Suggerimenti di distributori","Tankstellen-Vorschläge"],
  ["No hay sugerencias para revisar.","No suggestions to review.","Não há sugestões para revisar.","Aucune suggestion à examiner.","Nessun suggerimento da esaminare.","Keine Vorschläge zu prüfen."],
  ["Aprobada: ya la ven todos.","Approved: everyone sees it now.","Aprovada: todos já veem.","Approuvée : tout le monde la voit maintenant.","Approvato: ora lo vedono tutti.","Genehmigt: Jetzt sehen sie alle."],
  ["¿Guardar {} como tu idioma?","Save {} as your language?","Salvar {} como seu idioma?","Enregistrer {} comme votre langue ?","Salvare {} come tua lingua?","{} als deine Sprache speichern?"],
  ["Lo guardamos en tu cuenta para que la app aparezca en este idioma en cualquier teléfono.","We save it in your account so the app shows in this language on any phone.","Salvamos na sua conta para o app aparecer neste idioma em qualquer celular.","Nous l’enregistrons dans votre compte pour que l’app s’affiche dans cette langue sur n’importe quel téléphone.","La salviamo nel tuo account così l’app appare in questa lingua su qualsiasi telefono.","Wir speichern sie in deinem Konto, damit die App auf jedem Handy in dieser Sprache erscheint."],
  ["Para guardarlo en tu cuenta, iniciá sesión en \"Copia en la nube\" (abajo). Queda guardado al entrar.","To save it in your account, sign in under \"Cloud backup\" (below). It’s saved when you sign in.","Para salvar na sua conta, entre em \"Cópia na nuvem\" (abaixo). Fica salvo ao entrar.","Pour l’enregistrer dans votre compte, connectez-vous dans « Sauvegarde dans le cloud » (ci-dessous). Elle sera enregistrée à la connexion.","Per salvarla nel tuo account, accedi in \"Copia nel cloud\" (sotto). Viene salvata all’accesso.","Um sie in deinem Konto zu speichern, melde dich unter „Sicherung in der Cloud“ (unten) an. Sie wird bei der Anmeldung gespeichert."],
  ["Sí, en mi cuenta","Yes, in my account","Sim, na minha conta","Oui, dans mon compte","Sì, nel mio account","Ja, in meinem Konto"],
  ["Iniciar sesión y guardarlo","Sign in and save it","Entrar e salvar","Me connecter et l’enregistrer","Accedi e salvala","Anmelden und speichern"],
  ["Solo en este teléfono","Only on this phone","Só neste celular","Seulement sur ce téléphone","Solo su questo telefono","Nur auf diesem Handy"],
  ["Idioma guardado en tu cuenta.","Language saved in your account.","Idioma salvo na sua conta.","Langue enregistrée dans votre compte.","Lingua salvata nel tuo account.","Sprache in deinem Konto gespeichert."],
  ["Modo viaje","Trip mode","Modo viagem","Mode trajet","Modalità viaggio","Fahrtmodus"],
  ["Registrar mis viajes","Record my trips","Registrar minhas viagens","Enregistrer mes trajets","Registra i miei viaggi","Meine Fahrten aufzeichnen"],
  ["Registrar velocidad, tipo de vía, ralentí, arranques y frenadas para entender tu consumo.","Record speed, road type, idling, starts and braking to understand your consumption.","Registrar velocidade, tipo de via, marcha lenta, arrancadas e frenagens para entender seu consumo.","Enregistrer la vitesse, le type de route, le ralenti, les démarrages et les freinages pour comprendre votre consommation.","Registra velocità, tipo di strada, minimo, partenze e frenate per capire il tuo consumo.","Geschwindigkeit, Straßentyp, Leerlauf, Anfahren und Bremsen aufzeichnen, um deinen Verbrauch zu verstehen."],
  ["Manual","Manual","Manual","Manuel","Manuale","Manuell"],
  ["Tocás \"Iniciar viaje\" y \"Terminar viaje\".","You tap \"Start trip\" and \"End trip\".","Você toca em \"Iniciar viagem\" e \"Encerrar viagem\".","Vous touchez « Démarrer un trajet » et « Terminer le trajet ».","Tocchi \"Inizia viaggio\" e \"Termina viaggio\".","Du tippst auf „Fahrt starten“ und „Fahrt beenden“."],
  ["Automático con la app abierta","Automatic with the app open","Automático com o app aberto","Automatique avec l’app ouverte","Automatico con l’app aperta","Automatisch bei geöffneter App"],
  ["Detecta solo cuándo empezás y terminás de manejar, mientras la app está en pantalla.","Detects when you start and stop driving, while the app is on screen.","Detecta sozinho quando você começa e termina de dirigir, com o app na tela.","Détecte quand vous commencez et arrêtez de conduire, tant que l’app est à l’écran.","Rileva quando inizi e smetti di guidare, mentre l’app è sullo schermo.","Erkennt, wann du losfährst und anhältst, solange die App auf dem Bildschirm ist."],
  ["Automático solo si el teléfono carga","Automatic only while charging","Automático só com o celular carregando","Automatique seulement en charge","Automatico solo in carica","Automatisch nur beim Laden"],
  ["Igual que el anterior, pero solo con el teléfono enchufado (en el cargador del auto). Evita registrar Uber o bici.","Same as above, but only with the phone plugged in (car charger). Avoids logging Uber or bike rides.","Igual ao anterior, mas só com o celular na tomada (carregador do carro). Evita registrar Uber ou bicicleta.","Comme ci-dessus, mais seulement avec le téléphone branché (chargeur de voiture). Évite d’enregistrer un Uber ou un vélo.","Come sopra, ma solo con il telefono collegato (caricatore dell’auto). Evita di registrare Uber o bici.","Wie oben, aber nur, wenn das Handy angeschlossen ist (Autoladegerät). So werden Uber- oder Radfahrten nicht erfasst."],
  ["Siempre, en segundo plano","Always, in the background","Sempre, em segundo plano","Toujours, en arrière-plan","Sempre, in background","Immer, im Hintergrund"],
  ["Requiere la app de Android (próximamente).","Requires the Android app (coming soon).","Requer o app Android (em breve).","Nécessite l’app Android (bientôt).","Richiede l’app Android (presto).","Erfordert die Android-App (bald)."],
  ["Usar el sensor de movimiento (más preciso para arranques y frenadas; teléfono fijo en un soporte)","Use the motion sensor (more accurate for starts and braking; phone fixed in a holder)","Usar o sensor de movimento (mais preciso para arrancadas e frenagens; celular fixo no suporte)","Utiliser le capteur de mouvement (plus précis pour les démarrages et freinages ; téléphone fixé sur un support)","Usa il sensore di movimento (più preciso per partenze e frenate; telefono fisso su un supporto)","Bewegungssensor nutzen (genauer bei Anfahren und Bremsen; Handy fest in einer Halterung)"],
  ["El recorrido detallado queda solo en este teléfono. Mientras registra, la pantalla se mantiene encendida: conviene tener el teléfono cargando.","The detailed route stays only on this phone. While recording, the screen stays on: keep the phone charging.","O trajeto detalhado fica só neste celular. Enquanto registra, a tela fica ligada: convém deixar o celular carregando.","Le parcours détaillé reste uniquement sur ce téléphone. Pendant l’enregistrement, l’écran reste allumé : gardez le téléphone en charge.","Il percorso dettagliato resta solo su questo telefono. Durante la registrazione lo schermo resta acceso: tieni il telefono in carica.","Die genaue Route bleibt nur auf diesem Handy. Während der Aufzeichnung bleibt der Bildschirm an: Lade das Handy dabei."],
  ["Mis viajes","My trips","Minhas viagens","Mes trajets","I miei viaggi","Meine Fahrten"],
  ["Por tanque","By tank","Por tanque","Par plein","Per pieno","Pro Tankfüllung"],
  ["Tanque actual (en uso)","Current tank (in use)","Tanque atual (em uso)","Plein actuel (en cours)","Pieno attuale (in uso)","Aktuelle Tankfüllung (in Gebrauch)"],
  ["Del {} (# km) al {} (# km).","From {} (# km) to {} (# km).","De {} (# km) a {} (# km).","Du {} (# km) au {} (# km).","Dal {} (# km) al {} (# km).","Vom {} (# km) bis {} (# km)."],
  ["Sin bandera","Unbranded","Sem bandeira","Sans enseigne","Senza marchio","Ohne Marke"],
  ["Ciudad # %, avenida # %, ruta # %","City # %, avenue # %, highway # %","Cidade # %, avenida # %, estrada # %","Ville # %, avenue # %, route # %","Città # %, viale # %, strada extraurbana # %","Stadt # %, Hauptstraße # %, Landstraße/Autobahn # %"],
  ["Ciudad # %","City # %","Cidade # %","Ville # %","Città # %","Stadt # %"],
  ["Avenida # %","Avenue # %","Avenida # %","Avenue # %","Viale # %","Hauptstraße # %"],
  ["Ruta # %","Highway # %","Estrada # %","Route # %","Extraurbana # %","Landstraße/Autobahn # %"],
  ["Arranques fuertes","Hard starts","Arrancadas fortes","Démarrages brusques","Partenze brusche","Starkes Anfahren"],
  ["Frenadas bruscas","Hard braking","Frenagens bruscas","Freinages brusques","Frenate brusche","Starkes Bremsen"],
  ["Puntaje","Score","Pontuação","Score","Punteggio","Punktzahl"],
  ["Detalle del viaje","Trip details","Detalhes da viagem","Détail du trajet","Dettaglio del viaggio","Fahrtdetails"],
  ["Volver a mis viajes","Back to my trips","Voltar às minhas viagens","Retour à mes trajets","Torna ai miei viaggi","Zurück zu meinen Fahrten"],
  ["Este viaje no tiene recorrido guardado.","This trip has no saved route.","Esta viagem não tem trajeto salvo.","Ce trajet n’a pas de parcours enregistré.","Questo viaggio non ha un percorso salvato.","Für diese Fahrt ist keine Route gespeichert."],
  ["Velocidad (km/h)","Speed (km/h)","Velocidade (km/h)","Vitesse (km/h)","Velocità (km/h)","Geschwindigkeit (km/h)"],
  ["Consumo instantáneo (km/l)","Instant consumption (km/l)","Consumo instantâneo (km/l)","Consommation instantanée (km/l)","Consumo istantaneo (km/l)","Momentanverbrauch (km/l)"],
  ["Ver el recorrido y consumo instantáneo ›","See route and instant consumption ›","Ver trajeto e consumo instantâneo ›","Voir le parcours et la consommation instantanée ›","Vedi percorso e consumo istantaneo ›","Route und Momentanverbrauch ansehen ›"],
  ["Manejé yo este auto (contar en la evaluación)","I drove this car (count in the evaluation)","Eu dirigi este carro (contar na avaliação)","C’est moi qui conduisais cette voiture (compter dans l’évaluation)","Guidavo io quest’auto (conta nella valutazione)","Ich bin dieses Auto gefahren (in die Bewertung einbeziehen)"],
  ["¿Borrar este viaje?","Delete this trip?","Apagar esta viagem?","Supprimer ce trajet ?","Eliminare questo viaggio?","Diese Fahrt löschen?"],
  ["Borrar viaje","Delete trip","Apagar viagem","Supprimer le trajet","Elimina viaggio","Fahrt löschen"],
  ["Viaje iniciado.","Trip started.","Viagem iniciada.","Trajet démarré.","Viaggio iniziato.","Fahrt gestartet."],
  ["Viaje guardado: {}","Trip saved: {}","Viagem salva: {}","Trajet enregistré : {}","Viaggio salvato: {}","Fahrt gespeichert: {}"],
  ["midiendo…","measuring…","medindo…","mesure en cours…","misurazione…","wird gemessen…"],
  ["Ruta, ciudad, arranques y frenadas por tanque.","Highway, city, starts and braking per tank.","Estrada, cidade, arrancadas e frenagens por tanque.","Route, ville, démarrages et freinages par plein.","Extraurbano, città, partenze e frenate per pieno.","Landstraße, Stadt, Anfahren und Bremsen pro Tankfüllung."],
  ["# km registrados · # min detenido · máx. # km/h","# km recorded · # min stopped · max # km/h","# km registrados · # min parado · máx. # km/h","# km enregistrés · # min à l’arrêt · max. # km/h","# km registrati · # min fermo · max # km/h","# km erfasst · # Min. Stillstand · max. # km/h"],
  ["🚗 Auto · # km · # min · máx. # km/h","🚗 Car · # km · # min · max # km/h","🚗 Carro · # km · # min · máx. # km/h","🚗 Voiture · # km · # min · max. # km/h","🚗 Auto · # km · # min · max # km/h","🚗 Auto · # km · # Min. · max. # km/h"],
  ["🚲 Bici","🚲 Bike","🚲 Bicicleta","🚲 Vélo","🚲 Bici","🚲 Fahrrad"],
  ["🚶 A pie","🚶 On foot","🚶 A pé","🚶 À pied","🚶 A piedi","🚶 Zu Fuß"],
  ["💡 Anticipá las frenadas: dejá rodar el auto antes de frenar.","💡 Anticipate braking: let the car coast before braking.","💡 Antecipe as frenagens: deixe o carro rodar antes de frear.","💡 Anticipez les freinages : laissez rouler la voiture avant de freiner.","💡 Anticipa le frenate: lascia scorrere l’auto prima di frenare.","💡 Bremsen vorausschauend: Lass das Auto vor dem Bremsen rollen."],
  ["💡 Arrancá más suave: muchas aceleraciones fuertes.","💡 Start more gently: many hard accelerations.","💡 Arranque mais suave: muitas acelerações fortes.","💡 Démarrez plus en douceur : beaucoup d’accélérations fortes.","💡 Parti più dolcemente: molte accelerazioni forti.","💡 Fahr sanfter an: viele starke Beschleunigungen."],
  ["💡 Mucho tiempo detenido con el motor en marcha: el ralentí gasta sin avanzar.","💡 Lots of idling: the engine burns fuel without moving.","💡 Muito tempo parado com o motor ligado: a marcha lenta gasta sem andar.","💡 Beaucoup de temps à l’arrêt moteur allumé : le ralenti consomme sans avancer.","💡 Molto tempo fermo a motore acceso: il minimo consuma senza avanzare.","💡 Viel Leerlauf: Der Motor verbraucht Kraftstoff, ohne dass du vorankommst."],
  ["💡 Por encima de # km/h el consumo sube mucho.","💡 Above # km/h consumption rises a lot.","💡 Acima de # km/h o consumo sobe muito.","💡 Au-delà de # km/h, la consommation augmente beaucoup.","💡 Oltre i # km/h il consumo sale molto.","💡 Über # km/h steigt der Verbrauch stark."],
  ["💡 ¡Manejo parejo! Seguí así.","💡 Smooth driving! Keep it up.","💡 Direção suave! Continue assim.","💡 Conduite régulière ! Continuez comme ça.","💡 Guida regolare! Continua così.","💡 Gleichmäßige Fahrweise! Weiter so."],
  ["Modo viaje automático: empieza solo cuando manejás","Automatic trip mode: starts when you drive","Modo viagem automático: começa quando você dirige","Mode trajet automatique : démarre quand vous conduisez","Modalità viaggio automatica: parte quando guidi","Automatischer Fahrtmodus: startet, wenn du fährst"],
  ["Cargando…","Loading…","Carregando…","Chargement…","Caricamento…","Wird geladen…"],
  ["Sin datos.","No data.","Sem dados.","Pas de données.","Nessun dato.","Keine Daten."],
  ["Según la base,","According to the list,","Segundo a base,","Selon la liste,","Secondo l’elenco,","Laut Liste ist"],
  ["está a # m de donde estás ahora. Si estás en esa estación, guardamos tu posición como la correcta. La próxima vez la vas a encontrar por GPS.","is # m from where you are now. If you are at that station, we’ll save your position as the correct one. Next time GPS will find it.","está a # m de onde você está agora. Se você está nesse posto, salvamos sua posição como a correta. Da próxima vez o GPS vai encontrá-lo.","est à # m de l’endroit où vous êtes. Si vous êtes dans cette station, nous enregistrons votre position comme la bonne. La prochaine fois, le GPS la trouvera.","è a # m da dove sei ora. Se sei in quel distributore, salviamo la tua posizione come quella corretta. La prossima volta il GPS lo troverà.","# m von deinem aktuellen Standort entfernt. Wenn du an dieser Tankstelle bist, speichern wir deine Position als die richtige. Beim nächsten Mal findet das GPS sie."],
  ["está a # km de donde estás ahora. Si estás en esa estación, guardamos tu posición como la correcta. La próxima vez la vas a encontrar por GPS.","is # km from where you are now. If you are at that station, we’ll save your position as the correct one. Next time GPS will find it.","está a # km de onde você está agora. Se você está nesse posto, salvamos sua posição como a correta. Da próxima vez o GPS vai encontrá-lo.","est à # km de l’endroit où vous êtes. Si vous êtes dans cette station, nous enregistrons votre position comme la bonne. La prochaine fois, le GPS la trouvera.","è a # km da dove sei ora. Se sei in quel distributore, salviamo la tua posizione come quella corretta. La prossima volta il GPS lo troverà.","# km von deinem aktuellen Standort entfernt. Wenn du an dieser Tankstelle bist, speichern wir deine Position als die richtige. Beim nächsten Mal findet das GPS sie."],
  ["Cargaste # l y el tanque de tu auto es de # l.","You filled # l and your car’s tank holds # l.","Você abasteceu # l e o tanque do seu carro é de # l.","Vous avez mis # l et le réservoir de votre voiture fait # l.","Hai messo # l e il serbatoio della tua auto è da # l.","Du hast # l getankt, und der Tank deines Autos fasst # l."],
  ["Es menor que la carga anterior (# km)","It’s lower than the previous refuel (# km)","É menor que o abastecimento anterior (# km)","C’est inférieur au plein précédent (# km)","È inferiore al rifornimento precedente (# km)","Das ist weniger als bei der vorherigen Tankung (# km)"],
  ["Es mayor que una carga posterior (# km)","It’s higher than a later refuel (# km)","É maior que um abastecimento posterior (# km)","C’est supérieur à un plein ultérieur (# km)","È superiore a un rifornimento successivo (# km)","Das ist mehr als bei einer späteren Tankung (# km)"],
  ["El kilometraje tiene que ser mayor a # km.","The odometer must be higher than # km.","A quilometragem tem que ser maior que # km.","Le kilométrage doit être supérieur à # km.","Il chilometraggio deve essere superiore a # km.","Der Kilometerstand muss über # km liegen."],
  ["El kilometraje tiene que ser menor a # km (hay una carga posterior).","The odometer must be lower than # km (there’s a later refuel).","A quilometragem tem que ser menor que # km (há um abastecimento posterior).","Le kilométrage doit être inférieur à # km (il y a un plein ultérieur).","Il chilometraggio deve essere inferiore a # km (c’è un rifornimento successivo).","Der Kilometerstand muss unter # km liegen (es gibt eine spätere Tankung)."],
  ["equivale a # l cada # km","that’s # l per # km","equivale a # l a cada # km","soit # l aux # km","cioè # l ogni # km","das sind # l pro # km"],
  ["Un # % mejor que tu promedio. ¡Bien!","# % better than your average. Nice!","# % melhor que sua média. Muito bem!","# % mieux que votre moyenne. Bravo !","# % meglio della tua media. Bravo!","# % besser als dein Durchschnitt. Super!"],
  ["Un # % peor que tu promedio.","# % worse than your average.","# % pior que sua média.","# % moins bien que votre moyenne.","# % peggio della tua media.","# % schlechter als dein Durchschnitt."],
  ["Faltan columnas: Fecha, Litros, Total y Kilometraje son obligatorias.","Missing columns: Date, Liters, Total and Odometer are required.","Faltam colunas: Data, Litros, Total e Quilometragem são obrigatórias.","Colonnes manquantes : Date, Litres, Total et Kilométrage sont obligatoires.","Colonne mancanti: Data, Litri, Totale e Chilometraggio sono obbligatorie.","Fehlende Spalten: Datum, Liter, Gesamt und Kilometerstand sind Pflicht."],
  ["No se pudo leer ninguna fila (revisá las filas {}).","No row could be read (check rows {}).","Nenhuma linha pôde ser lida (confira as linhas {}).","Aucune ligne n’a pu être lue (vérifiez les lignes {}).","Nessuna riga leggibile (controlla le righe {}).","Keine Zeile konnte gelesen werden (prüfe die Zeilen {})."],
  ["🚗 # % ruta · # % ciudad · puntaje de manejo #/#","🚗 # % highway · # % city · driving score #/#","🚗 # % estrada · # % cidade · pontuação #/#","🚗 # % route · # % ville · score de conduite #/#","🚗 # % extraurbano · # % città · punteggio di guida #/#","🚗 # % Landstraße · # % Stadt · Fahrstil #/#"],
  ["Tus viajes estimaban # km/l: {} vs. el real","Your trips estimated # km/l: {} vs. actual","Suas viagens estimavam # km/l: {} vs. o real","Vos trajets estimaient # km/l : {} vs le réel","I tuoi viaggi stimavano # km/l: {} vs il reale","Deine Fahrten schätzten # km/l: {} vs. tatsächlich"],
  ["normal","normal","normal","normal","normale","normal"],
  ["gasta mucho (aceleración)","uses a lot (acceleration)","gasta muito (aceleração)","consomme beaucoup (accélération)","consuma molto (accelerazione)","verbraucht viel (Beschleunigung)"],
  ["Ahora: {} · base {} · # estaciones","Now: {} · list {} · # stations","Agora: {} · base {} · # postos","Actuel : {} · liste {} · # stations","Ora: {} · elenco {} · # distributori","Jetzt: {} · Liste {} · # Tankstellen"],
  ["{} · base {} · # estaciones","{} · list {} · # stations","{} · base {} · # postos","{} · liste {} · # stations","{} · elenco {} · # distributori","{} · Liste {} · # Tankstellen"],
  ["⚠ Solo registra mientras la app está en pantalla. Si pasás a otra app o se apaga la pantalla, ese tramo queda sin registrar.","⚠ It only records while the app is on screen. If you switch apps or the screen turns off, that stretch isn’t recorded.","⚠ Só registra enquanto o app está na tela. Se você mudar de app ou a tela apagar, esse trecho não é registrado.","⚠ L’enregistrement ne fonctionne que si l’app est à l’écran. Si vous changez d’app ou si l’écran s’éteint, ce tronçon n’est pas enregistré.","⚠ Registra solo mentre l’app è sullo schermo. Se cambi app o lo schermo si spegne, quel tratto non viene registrato.","⚠ Es wird nur aufgezeichnet, solange die App auf dem Bildschirm ist. Wechselst du die App oder geht der Bildschirm aus, fehlt dieser Abschnitt."],
  ["Viaje iniciado. Dejá la app en pantalla para que registre.","Trip started. Keep the app on screen so it records.","Viagem iniciada. Deixe o app na tela para registrar.","Trajet démarré. Gardez l’app à l’écran pour qu’elle enregistre.","Viaggio iniziato. Tieni l’app sullo schermo perché registri.","Fahrt gestartet. Lass die App auf dem Bildschirm, damit sie aufzeichnet."],
  ["Viaje en curso · # km · # min","Trip in progress · # km · # min","Viagem em andamento · # km · # min","Trajet en cours · # km · # min","Viaggio in corso · # km · # min","Fahrt läuft · # km · # Min."],
  ["Dejá la app en pantalla mientras manejás","Keep the app on screen while driving","Deixe o app na tela enquanto dirige","Gardez l’app à l’écran pendant que vous conduisez","Tieni l’app sullo schermo mentre guidi","Lass die App beim Fahren auf dem Bildschirm"],
  ["⚠ Hubo 1 pausa sin registrar (# min en total)","⚠ There was 1 unrecorded pause (# min total)","⚠ Houve 1 pausa sem registro (# min no total)","⚠ Il y a eu 1 pause non enregistrée (# min au total)","⚠ C’è stata 1 pausa non registrata (# min in totale)","⚠ Es gab 1 nicht aufgezeichnete Pause (insgesamt # Min.)"],
  ["⚠ Hubo # pausas sin registrar (# min en total)","⚠ There were # unrecorded pauses (# min total)","⚠ Houve # pausas sem registro (# min no total)","⚠ Il y a eu # pauses non enregistrées (# min au total)","⚠ Ci sono state # pause non registrate (# min in totale)","⚠ Es gab # nicht aufgezeichnete Pausen (insgesamt # Min.)"],
  ["La app no estuvo en pantalla (otra app abierta o pantalla apagada). Faltan unos # km en línea recta, marcados con línea gris punteada en el mapa y en gris en los gráficos. El consumo y el puntaje se calculan solo con lo registrado.","The app wasn’t on screen (another app open or screen off). About # km are missing in a straight line, shown as a dotted grey line on the map and in grey on the charts. Consumption and score use only what was recorded.","O app não estava na tela (outro app aberto ou tela apagada). Faltam cerca de # km em linha reta, marcados com linha cinza pontilhada no mapa e em cinza nos gráficos. O consumo e a pontuação usam só o que foi registrado.","L’app n’était pas à l’écran (autre app ouverte ou écran éteint). Il manque environ # km à vol d’oiseau, indiqués par une ligne grise pointillée sur la carte et en gris sur les graphiques. La consommation et le score n’utilisent que ce qui a été enregistré.","L’app non era sullo schermo (altra app aperta o schermo spento). Mancano circa # km in linea d’aria, indicati da una linea grigia tratteggiata sulla mappa e in grigio nei grafici. Consumo e punteggio usano solo ciò che è stato registrato.","Die App war nicht auf dem Bildschirm (andere App offen oder Bildschirm aus). Es fehlen etwa # km Luftlinie, als grau gestrichelte Linie auf der Karte und grau in den Diagrammen markiert. Verbrauch und Punktzahl beruhen nur auf dem Aufgezeichneten."],
  ["Sin registrar · # min","Not recorded · # min","Sem registro · # min","Non enregistré · # min","Non registrato · # min","Nicht aufgezeichnet · # Min."],
  ["{} · # km · # min · máx. # km/h · ⚠ con pausas","{} · # km · # min · max # km/h · ⚠ with pauses","{} · # km · # min · máx. # km/h · ⚠ com pausas","{} · # km · # min · max. # km/h · ⚠ avec pauses","{} · # km · # min · max # km/h · ⚠ con pause","{} · # km · # Min. · max. # km/h · ⚠ mit Pausen"],
  ["{} · # km · # min · máx. # km/h","{} · # km · # min · max # km/h","{} · # km · # min · máx. # km/h","{} · # km · # min · max. # km/h","{} · # km · # min · max # km/h","{} · # km · # Min. · max. # km/h"],
  ["El viaje quedó en pausa # min mientras la app no estaba en pantalla.","The trip was paused for # min while the app wasn’t on screen.","A viagem ficou em pausa # min enquanto o app não estava na tela.","Le trajet a été en pause # min pendant que l’app n’était pas à l’écran.","Il viaggio è rimasto in pausa # min mentre l’app non era sullo schermo.","Die Fahrt war # Min. pausiert, während die App nicht auf dem Bildschirm war."],
  ["El viaje quedó en pausa unos segundos mientras la app no estaba en pantalla.","The trip was paused a few seconds while the app wasn’t on screen.","A viagem ficou em pausa alguns segundos enquanto o app não estava na tela.","Le trajet a été en pause quelques secondes pendant que l’app n’était pas à l’écran.","Il viaggio è rimasto in pausa qualche secondo mentre l’app non era sullo schermo.","Die Fahrt war einige Sekunden pausiert, während die App nicht auf dem Bildschirm war."],
  ["Cada vez que cargues combustible, tocá acá.","Every time you refuel, tap here.","Toda vez que abastecer, toque aqui.","Chaque fois que vous faites le plein, touchez ici.","Ogni volta che fai rifornimento, tocca qui.","Tippe hier jedes Mal, wenn du tankst."],
  ["Este es el mapa con las estaciones cerca tuyo. Tocá una (en el mapa o en la lista de abajo).","This is the map with stations near you. Tap one (on the map or in the list below).","Este é o mapa com os postos perto de você. Toque em um (no mapa ou na lista abaixo).","Voici la carte avec les stations près de vous. Touchez-en une (sur la carte ou dans la liste ci-dessous).","Questa è la mappa con i distributori vicino a te. Toccane uno (sulla mappa o nella lista sotto).","Das ist die Karte mit Tankstellen in deiner Nähe. Tippe auf eine (auf der Karte oder in der Liste darunter)."],
  ["Acá elegís el país y, al lado, filtrás por bandera (por ejemplo, solo YPF o Shell).","Here you choose the country and, next to it, filter by brand (for example, only Shell).","Aqui você escolhe o país e, ao lado, filtra por bandeira (por exemplo, só Petrobras ou Shell).","Ici vous choisissez le pays et, à côté, vous filtrez par enseigne (par exemple, seulement Shell).","Qui scegli il paese e, accanto, filtri per marchio (per esempio, solo Shell).","Hier wählst du das Land und filterst daneben nach Marke (zum Beispiel nur Shell)."],
  ["Ahora tocá Siguiente.","Now tap Next.","Agora toque em Próximo.","Maintenant touchez Suivant.","Ora tocca Avanti.","Tippe jetzt auf Weiter."],
  ["Tu combustible habitual ya viene marcado. Si cargaste otro, cambialo acá.","Your usual fuel is already selected. If you filled another, change it here.","Seu combustível habitual já vem marcado. Se abasteceu outro, mude aqui.","Votre carburant habituel est déjà sélectionné. Si vous en avez mis un autre, changez-le ici.","Il tuo carburante abituale è già selezionato. Se ne hai messo un altro, cambialo qui.","Dein üblicher Kraftstoff ist schon ausgewählt. Hast du einen anderen getankt, ändere ihn hier."],
  ["Escribí los litros que cargaste. Es una práctica: no se guarda.","Type the liters you filled. It’s practice: it won’t be saved.","Digite os litros que abasteceu. É um treino: não será salvo.","Saisissez les litres que vous avez mis. C’est un exercice : rien n’est enregistré.","Scrivi i litri che hai messo. È una prova: non viene salvato.","Gib die getankten Liter ein. Das ist eine Übung: Es wird nicht gespeichert."],
  ["Y el total que pagaste.","And the total you paid.","E o total que você pagou.","Et le total payé.","E il totale pagato.","Und den bezahlten Betrag."],
  ["Si llenaste el tanque, dejalo prendido: así calculamos el consumo exacto.","If you filled the tank, leave it on: that’s how we calculate exact consumption.","Se encheu o tanque, deixe ligado: assim calculamos o consumo exato.","Si vous avez fait le plein complet, laissez activé : c’est ainsi que nous calculons la consommation exacte.","Se hai fatto il pieno, lascialo attivo: così calcoliamo il consumo esatto.","Wenn du vollgetankt hast, lass es eingeschaltet: So berechnen wir den genauen Verbrauch."],
  ["Tocá Siguiente.","Tap Next.","Toque em Próximo.","Touchez Suivant.","Tocca Avanti.","Tippe auf Weiter."],
  ["Marcá los kilómetros que dice el tablero del auto.","Enter the kilometers shown on the car’s dashboard.","Digite os quilômetros que aparecem no painel do carro.","Saisissez les kilomètres affichés au tableau de bord.","Inserisci i chilometri indicati sul cruscotto.","Gib die Kilometer vom Armaturenbrett ein."],
  ["Tocá Guardar y calcular. (Es la práctica: esta carga no se guarda.)","Tap Save and calculate. (It’s practice: this refuel won’t be saved.)","Toque em Salvar e calcular. (É treino: este abastecimento não será salvo.)","Touchez Enregistrer et calculer. (C’est un exercice : ce plein n’est pas enregistré.)","Tocca Salva e calcola. (È una prova: questo rifornimento non viene salvato.)","Tippe auf Speichern und berechnen. (Das ist eine Übung: Diese Tankung wird nicht gespeichert.)"],
  ["En Historial ves los gráficos de consumo y de gasto.","In History you see consumption and spending charts.","No Histórico você vê os gráficos de consumo e de gasto.","Dans Historique, vous voyez les graphiques de consommation et de dépenses.","In Storico vedi i grafici di consumo e spesa.","Im Verlauf siehst du Diagramme zu Verbrauch und Ausgaben."],
  ["En Mis autos cargás los datos del auto, agregás otros (por ejemplo, uno alquilado) y elegís el idioma.","In My cars you enter the car’s details, add others (for example, a rental) and choose the language.","Em Meus carros você informa os dados do carro, adiciona outros (por exemplo, um alugado) e escolhe o idioma.","Dans Mes voitures, vous saisissez les données de la voiture, en ajoutez d’autres (une location, par exemple) et choisissez la langue.","In Le mie auto inserisci i dati dell’auto, ne aggiungi altre (per esempio una a noleggio) e scegli la lingua.","Unter Meine Autos gibst du die Daten deines Autos ein, fügst weitere hinzu (z. B. einen Mietwagen) und wählst die Sprache."],
  ["¡Listo! Ya sabés usar la app. La próxima carga, hacela de verdad.","Done! Now you know how to use the app. Log your next refuel for real.","Pronto! Agora você sabe usar o app. O próximo abastecimento, registre de verdade.","C’est fait ! Vous savez utiliser l’app. Le prochain plein, faites-le pour de vrai.","Fatto! Ora sai usare l’app. Il prossimo rifornimento registralo davvero.","Fertig! Jetzt weißt du, wie die App funktioniert. Erfasse die nächste Tankung echt."],
  ["¡Listo!","Done!","Pronto!","C’est fait !","Fatto!","Fertig!"],
  ["¡Muy bien! Así se registra una carga. (Esta era de práctica.)","Well done! That’s how you log a refuel. (This one was practice.)","Muito bem! É assim que se registra um abastecimento. (Este era de treino.)","Bravo ! C’est comme ça qu’on enregistre un plein. (Celui-ci était un exercice.)","Bravo! Così si registra un rifornimento. (Questo era una prova.)","Super! So erfasst man eine Tankung. (Diese war eine Übung.)"],
  ["Guardar","Save","Salvar","Enregistrer","Salva","Speichern"],
  ["Guardar carga","Save refuel","Salvar abastecimento","Enregistrer le plein","Salva rifornimento","Tankung speichern"],
  ["Saltar","Skip","Pular","Passer","Salta","Überspringen"],
  ["Entendido","Got it","Entendi","Compris","Capito","Verstanden"],
  ["Ver el tutorial otra vez","See the tutorial again","Ver o tutorial de novo","Revoir le tutoriel","Rivedi il tutorial","Tutorial noch einmal ansehen"]
];

/* ---------- Motor ---------- */
let LANG = 'es';
const TL = ['en', 'pt', 'fr', 'it', 'de']; // columnas de T después del español
const EXACT = {}, PATS = {};
TL.forEach((l) => { EXACT[l] = {}; PATS[l] = []; });
const NUM = /\d+(?:[.,]\d+)*/g;
const normKey = (s) => s.replace(/\s+/g, ' ').trim();
(function build() {
  for (const [es, ...tr] of T) {
    const key = normKey(es);
    if (!key.includes('{}') && !key.includes('#')) { TL.forEach((l, i) => { EXACT[l][key] = tr[i] ?? es; }); continue; }
    // patrón: "#" número, "{}" texto cualquiera
    const rx = new RegExp('^' + key.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/#/g, '(\\d+(?:[., ]\\d+)*)').replace(/\{\}/g, '(.+?)') + '$');
    const order = (key.match(/#|\{\}/g) || []);
    TL.forEach((l, i) => PATS[l].push({ rx, out: tr[i] ?? es, order }));
  }
})();
function fill(out, order, groups) {
  // reparte los valores capturados entre los "#" y "{}" de la traducción, en orden por tipo
  const nums = [], txts = [];
  order.forEach((k, i) => (k === '#' ? nums : txts).push(groups[i]));
  let n = 0, t = 0;
  return out.replace(/#|\{\}/g, (k) => (k === '#' ? (nums[n++] ?? '') : tr(txts[t++] ?? '')));
}
// Traduce un texto suelto (para usar desde el código)
function tr(s) {
  if (LANG === 'es' || s == null) return s;
  const key = normKey(String(s));
  if (!key) return s;
  const ex = EXACT[LANG][key];
  if (ex != null) return ex;
  for (const p of PATS[LANG]) { const m = key.match(p.rx); if (m) return fill(p.out, p.order, m.slice(1)); }
  return s;
}
const locale = () => LOCALES[LANG] || 'es-AR';
const monthNames = () => MONTHS_L[LANG] || MONTHS_L.es;

/* ---------- Traducción de la pantalla ---------- */
const ATTRS = ['placeholder', 'aria-label', 'title'];
function trNode(n) {
  if (n.nodeType === 3) {
    const p = n.parentElement;
    if (!p || p.closest('script,style,.notr')) return;
    const v = n.nodeValue;
    if (n.__tr === v) return;               // ya traducido por nosotros
    n.__es = v;                             // texto original (español)
    const core = v.trim(); if (!core || !/[a-zA-ZáéíóúñÁÉÍÓÚ]/.test(core)) return;
    const t = tr(core);
    if (t !== core) { const nv = v.replace(core, t); n.__tr = nv; n.nodeValue = nv; }
  } else if (n.nodeType === 1) {
    for (const a of ATTRS) {
      if (!n.hasAttribute(a)) continue;
      const v = n.getAttribute(a), k = '__tr_' + a;
      if (n[k] === v) continue;
      n['__es_' + a] = v;
      const t = tr(v); if (t !== v) { n[k] = t; n.setAttribute(a, t); }
    }
  }
}
function trTree(root) {
  if (root.nodeType === 3) { trNode(root); return; }
  if (root.nodeType !== 1) return;
  trNode(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n; while ((n = w.nextNode())) trNode(n);
}
function restoreTree(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n; while ((n = w.nextNode())) {
    if (n.nodeType === 3) { if (n.__es != null && n.__tr === n.nodeValue) n.nodeValue = n.__es; n.__tr = null; }
    else for (const a of ATTRS) if (n['__es_' + a] != null && n['__tr_' + a] === n.getAttribute(a)) { n.setAttribute(a, n['__es_' + a]); n['__tr_' + a] = null; }
  }
}
const i18nObs = new MutationObserver((ms) => {
  if (LANG === 'es') return;
  for (const m of ms) {
    if (m.type === 'characterData') trNode(m.target);
    else if (m.type === 'attributes') trNode(m.target);
    else m.addedNodes.forEach(trTree);
  }
});
i18nObs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });

// Idioma del teléfono: es/en/pt; si no es ninguno, español
function detectLang() {
  for (const l of (navigator.languages || [navigator.language || 'es'])) {
    const c = String(l).slice(0, 2).toLowerCase();
    if (LANGS[c]) return c;
  }
  return 'es';
}
function setLang(l, rerender) {
  if (!LANGS[l]) l = 'es';
  const was = LANG; LANG = l;
  document.documentElement.lang = l === 'pt' ? 'pt-BR' : l;
  if (was !== 'es') restoreTree(document.body);
  if (l !== 'es') trTree(document.body);
  if (rerender && typeof RENDER !== 'undefined' && RENDER[current]) RENDER[current]();
}
// Idioma inicial: el guardado; si es la primera vez, el del teléfono
(function initLang() {
  let d = {};
  try { d = JSON.parse(localStorage.getItem('miconsumo.v1')) || {}; } catch (e) { /* nada */ }
  // Quien ya usaba la app (antes de que hubiera idiomas) sigue en español; solo las instalaciones nuevas toman el idioma del teléfono
  const before = !d.lang && ((d.loads && d.loads.length) || (d.car && d.car.model));
  if (before) { d.lang = 'es'; try { localStorage.setItem('miconsumo.v1', JSON.stringify(d)); } catch (e) { /* nada */ } }
  setLang(d.lang || detectLang(), false);
})();
