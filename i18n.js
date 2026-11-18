/* Mi Consumo — idiomas (español, inglés, portugués).
   El código y el HTML están en español; este archivo traduce lo que aparece en pantalla.
   Cada fila: [español, inglés, portugués]. "#" = un número; "{}" = cualquier texto (nombre de estación, auto, etc.). */
'use strict';

const LANGS = { es: 'Español', en: 'English', pt: 'Português' };
const LOCALES = { es: 'es-AR', en: 'en-US', pt: 'pt-BR' };
const MONTHS_L = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
};

const T = [
  // Inicio
  ['Mi consumo', 'My fuel log', 'Meu consumo'],
  ['¡Hola!', 'Hi!', 'Olá!'],
  ['¡Hola, {}!', 'Hi, {}!', 'Olá, {}!'],
  ['Mi auto', 'My car', 'Meu carro'],
  ['Mis autos', 'My cars', 'Meus carros'],
  ['Bienvenido', 'Welcome', 'Bem-vindo'],
  ['Registrá cada carga y te mostramos cuánto rinde tu auto.', 'Log every refuel and we’ll show you how far your car goes.', 'Registre cada abastecimento e mostramos quanto seu carro rende.'],
  ['Tip: empezá con el tanque lleno. Desde la siguiente carga completa ya vas a ver tu consumo.', 'Tip: start with a full tank. From the next full refuel you’ll see your consumption.', 'Dica: comece com o tanque cheio. A partir do próximo tanque cheio você verá seu consumo.'],
  ['Último tanque medido', 'Last measured tank', 'Último tanque medido'],
  ['= promedio', '= average', '= média'],
  ['▲ # vs. promedio', '▲ # vs. average', '▲ # vs. média'],
  ['▼ # vs. promedio', '▼ # vs. average', '▼ # vs. média'],
  ['Combustible de {} (#{})', 'Fuel from {} (#{})', 'Combustível de {} (#{})'],
  ['Costo por km hoy', 'Cost per km today', 'Custo por km hoje'],
  ['Gastado este mes', 'Spent this month', 'Gasto este mês'],
  ['Registrar carga', 'Log refuel', 'Registrar abastecimento'],
  ['Iniciar viaje', 'Start trip', 'Iniciar viagem'],
  ['Terminar viaje', 'End trip', 'Encerrar viagem'],
  ['Viaje en curso', 'Trip in progress', 'Viagem em andamento'],
  ['Últimas cargas', 'Latest refuels', 'Últimos abastecimentos'],
  ['Ver todo', 'See all', 'Ver tudo'],
  ['Todavía no registraste cargas.', 'No refuels logged yet.', 'Nenhum abastecimento registrado ainda.'],
  ['en uso', 'in use', 'em uso'],
  ['parcial', 'partial', 'parcial'],
  ['Tendencia de consumo de los últimos tanques', 'Consumption trend of the last tanks', 'Tendência de consumo dos últimos tanques'],
  ['Inicio', 'Home', 'Início'],
  ['Historial', 'History', 'Histórico'],
  ['Viajes', 'Trips', 'Viagens'],
  // Paso 1
  ['Paso # de #', 'Step # of #', 'Passo # de #'],
  ['Paso # de # · {}', 'Step # of # · {}', 'Passo # de # · {}'],
  ['¿Dónde estás cargando?', 'Where are you refueling?', 'Onde você está abastecendo?'],
  ['Buscando tu ubicación…', 'Finding your location…', 'Buscando sua localização…'],
  ['Siguiendo tu ubicación en vivo. Tocá tu estación o esperá a llegar.', 'Following your location live. Tap your station or wait until you arrive.', 'Seguindo sua localização ao vivo. Toque no seu posto ou espere chegar.'],
  ['Estás fuera de {}:', 'You are outside {}:', 'Você está fora de {}:'],
  ['tocá el mapa donde estás', 'tap the map where you are', 'toque no mapa onde você está'],
  ['(o buscá la estación).', '(or search for the station).', '(ou procure o posto).'],
  ['País: automático ({}) ▾', 'Country: automatic ({}) ▾', 'País: automático ({}) ▾'],
  ['País: {} ▾', 'Country: {} ▾', 'País: {} ▾'],
  ['Bandera: todas ▾', 'Brand: all ▾', 'Bandeira: todas ▾'],
  ['Bandera: # elegidas ▾', 'Brand: # selected ▾', 'Bandeira: # escolhidas ▾'],
  ['Bandera: {} ▾', 'Brand: {} ▾', 'Bandeira: {} ▾'],
  ['¿Qué banderas querés ver?', 'Which brands do you want to see?', 'Quais bandeiras você quer ver?'],
  ['Sin ninguna marcada se ven todas.', 'With none selected, all are shown.', 'Sem nenhuma marcada, aparecem todas.'],
  ['Aplicar', 'Apply', 'Aplicar'],
  ['Ver todas', 'Show all', 'Ver todas'],
  ['En movimiento · usalo solo con el teléfono en un soporte', 'Moving · use it only with the phone in a holder', 'Em movimento · use só com o celular no suporte'],
  ['Te encontramos en una estación.', 'We found you at a station.', 'Encontramos você em um posto.'],
  ['Estás en', 'You are at', 'Você está em'],
  ['{} · a # m de vos', '{} · # m from you', '{} · a # m de você'],
  ['a # m de vos', '# m from you', 'a # m de você'],
  ['Sí, estoy acá', 'Yes, I’m here', 'Sim, estou aqui'],
  ['No, elegir otra estación', 'No, choose another station', 'Não, escolher outro posto'],
  ['Centrar el mapa en mi ubicación', 'Center the map on my location', 'Centralizar o mapa na minha localização'],
  ['Orientación del mapa', 'Map orientation', 'Orientação do mapa'],
  ['El mapa gira según tu rumbo', 'The map turns with your heading', 'O mapa gira conforme sua direção'],
  ['Norte siempre arriba', 'North always up', 'Norte sempre para cima'],
  ['Hasta la estación: {} · # min', 'To the station: {} · # min', 'Até o posto: {} · # min'],
  ['Hasta la estación: {} en línea recta', 'To the station: {} in a straight line', 'Até o posto: {} em linha reta'],
  ['Cómo llegar a {}', 'Directions to {}', 'Como chegar a {}'],
  ['Estaciones cerca tuyo', 'Stations near you', 'Postos perto de você'],
  ['Estaciones en el mapa (#)', 'Stations on the map (#)', 'Postos no mapa (#)'],
  ['Acercá el mapa para ver estaciones', 'Zoom in to see stations', 'Aproxime o mapa para ver os postos'],
  ['No hay estaciones en esta zona del mapa', 'No stations in this area of the map', 'Não há postos nesta área do mapa'],
  ['y # más: acercá el mapa para verlas', 'and # more: zoom in to see them', 'e mais #: aproxime o mapa para vê-los'],
  ['Buscando estaciones cercanas…', 'Looking for nearby stations…', 'Buscando postos próximos…'],
  ['Usadas recientemente', 'Recently used', 'Usados recentemente'],
  ['Buscá tu estación', 'Search for your station', 'Procure seu posto'],
  ['Buscar por marca, calle o ciudad', 'Search by brand, street or city', 'Buscar por bandeira, rua ou cidade'],
  ['No está en la lista · Buscar estación', 'Not on the list · Search station', 'Não está na lista · Buscar posto'],
  ['+ Agregar una estación nueva acá', '+ Add a new station here', '+ Adicionar um posto novo aqui'],
  ['Sin resultados. Podés agregarla como estación nueva.', 'No results. You can add it as a new station.', 'Sem resultados. Você pode adicioná-lo como posto novo.'],
  ['TUYA', 'YOURS', 'SEU'],
  ['Siguiente', 'Next', 'Próximo'],
  ['Volver al inicio', 'Back to home', 'Voltar ao início'],
  ['Volver al paso #', 'Back to step #', 'Voltar ao passo #'],
  ['Este navegador no permite usar el GPS.', 'This browser doesn’t allow GPS.', 'Este navegador não permite usar o GPS.'],
  ['No pudimos ubicarte. Buscá la estación a mano.', 'We couldn’t locate you. Search for the station manually.', 'Não conseguimos localizar você. Procure o posto manualmente.'],
  ['Sin permiso para usar el GPS. Podés buscar la estación a mano.', 'No permission to use GPS. You can search for the station manually.', 'Sem permissão para usar o GPS. Você pode procurar o posto manualmente.'],
  ['¿En qué país cargás?', 'Which country are you refueling in?', 'Em que país você abastece?'],
  ['Si elegís un país distinto de donde estás, el mapa se abre allí y tocás tu ubicación (sirve para probar).', 'If you choose a country other than where you are, the map opens there and you tap your location (useful for testing).', 'Se escolher um país diferente de onde está, o mapa abre lá e você toca na sua localização (serve para testar).'],
  ['Automático (según el GPS)', 'Automatic (by GPS)', 'Automático (pelo GPS)'],
  ['✓ Automático (según el GPS)', '✓ Automatic (by GPS)', '✓ Automático (pelo GPS)'],
  ['Automático (según dónde estés)', 'Automatic (by where you are)', 'Automático (conforme onde você está)'],
  ['Argentina', 'Argentina', 'Argentina'], ['España', 'Spain', 'Espanha'], ['Brasil', 'Brazil', 'Brasil'],
  ['✓ {}', '✓ {}', '✓ {}'],
  ['Estás en {}: cargando sus estaciones…', 'You’re in {}: loading its stations…', 'Você está em {}: carregando os postos…'],
  ['No se pudo cargar la base de estaciones de {}.', 'Couldn’t load the station list for {}.', 'Não foi possível carregar os postos de {}.'],
  ['Nueva estación', 'New station', 'Posto novo'],
  ['Guardar estación', 'Save station', 'Salvar posto'],
  ['Estación agregada.', 'Station added.', 'Posto adicionado.'],
  ['Para agregar una estación necesitamos tu ubicación (GPS).', 'To add a station we need your location (GPS).', 'Para adicionar um posto precisamos da sua localização (GPS).'],
  ['Se guarda en tu ubicación actual. Queda en tu teléfono aunque se actualice la base, y más adelante se enviará como sugerencia.', 'It’s saved at your current location. It stays on your phone even if the list is updated, and will be sent as a suggestion later.', 'É salvo na sua localização atual. Fica no seu celular mesmo se a base for atualizada e depois será enviado como sugestão.'],
  ['¿Corregimos la ubicación?', 'Shall we fix the location?', 'Corrigimos a localização?'],
  ['Sí, estoy acá: corregir ubicación', 'Yes, I’m here: fix location', 'Sim, estou aqui: corrigir localização'],
  ['No, solo elegirla', 'No, just choose it', 'Não, só escolher'],
  ['Ubicación corregida. ¡Gracias!', 'Location fixed. Thanks!', 'Localização corrigida. Obrigado!'],
  ['Ej.: Shell Libertador San Isidro', 'E.g.: Shell Main Street', 'Ex.: Shell Av. Paulista'],
  ['Estación', 'Station', 'Posto'],
  ['Ver en el mapa ↗', 'View on map ↗', 'Ver no mapa ↗'],
  // Paso 2
  ['¿Cuánto cargaste?', 'How much did you fill?', 'Quanto você abasteceu?'],
  ['Fecha de la carga', 'Refuel date', 'Data do abastecimento'],
  ['Combustible', 'Fuel', 'Combustível'],
  ['Como la última vez', 'Same as last time', 'Como da última vez'],
  ['Tu combustible habitual', 'Your usual fuel', 'Seu combustível habitual'],
  ['Litros', 'Liters', 'Litros'],
  ['Total pagado ($)', 'Total paid ($)', 'Total pago ($)'],
  ['Total pagado (€)', 'Total paid (€)', 'Total pago (€)'],
  ['Total pagado (R$)', 'Total paid (R$)', 'Total pago (R$)'],
  ['Precio por litro', 'Price per liter', 'Preço por litro'],
  ['Precio', 'Price', 'Preço'],
  ['Precio oficial hoy:', 'Official price today:', 'Preço oficial hoje:'],
  ['¿Llenaste el tanque?', 'Did you fill the tank?', 'Encheu o tanque?'],
  ['Con tanque lleno calculamos el consumo exacto.', 'With a full tank we calculate exact consumption.', 'Com o tanque cheio calculamos o consumo exato.'],
  ['Tanque lleno', 'Full tank', 'Tanque cheio'],
  ['Súper', 'Regular', 'Comum'], ['Premium', 'Premium', 'Premium'], ['Diésel', 'Diesel', 'Diesel'], ['GNC', 'CNG', 'GNV'],
  ['Gasolina 95', 'Petrol 95', 'Gasolina 95'], ['Gasolina 98', 'Petrol 98', 'Gasolina 98'], ['Diésel+', 'Diesel+', 'Diesel+'],
  ['Gasolina', 'Gasoline', 'Gasolina'], ['Gasolina aditivada', 'Premium gasoline', 'Gasolina aditivada'], ['Etanol', 'Ethanol', 'Etanol'],
  ['¿Revisamos los litros?', 'Check the liters?', 'Revisamos os litros?'],
  ['Está bien, seguir', 'It’s fine, continue', 'Está certo, continuar'],
  // Paso 3
  ['¿Qué marca el cuentakilómetros?', 'What does the odometer read?', 'Quanto marca o hodômetro?'],
  ['Primera carga: anotá el kilometraje actual.', 'First refuel: enter the current odometer.', 'Primeiro abastecimento: anote a quilometragem atual.'],
  ['Carga anterior:', 'Previous refuel:', 'Abastecimento anterior:'],
  ['Limpiar', 'Clear', 'Limpar'],
  ['Guardar y calcular', 'Save and calculate', 'Salvar e calcular'],
  ['km desde la carga anterior', 'km since the previous refuel', 'km desde o abastecimento anterior'],
  ['km desde la carga anterior. ¿Lo guardamos igual?', 'km since the previous refuel. Save anyway?', 'km desde o abastecimento anterior. Salvamos mesmo assim?'],
  ['Sí, guardar', 'Yes, save', 'Sim, salvar'],
  ['¿Es correcto?', 'Is that right?', 'Está correto?'],
  // Resultado
  ['¡Carga guardada!', 'Refuel saved!', 'Abastecimento salvo!'],
  ['Consumo del tanque anterior', 'Previous tank consumption', 'Consumo do tanque anterior'],
  ['km recorridos', 'km driven', 'km rodados'],
  ['l cada # km', 'l per # km', 'l a cada # km'],
  ['Ver mis gráficos', 'See my charts', 'Ver meus gráficos'],
  ['Igual que tu promedio.', 'Same as your average.', 'Igual à sua média.'],
  ['rinde más que tu promedio', 'goes further than your average', 'rende mais que sua média'],
  ['gasta más', 'uses more', 'gasta mais'],
  ['Consumo estimado:', 'Estimated consumption:', 'Consumo estimado:'],
  ['Estimado hasta ahora:', 'Estimated so far:', 'Estimado até agora:'],
  ['· se compara en la próxima carga', '· compared at the next refuel', '· comparado no próximo abastecimento'],
  ['casi exacto', 'almost exact', 'quase exato'],
  // Historial
  ['Consumo (km/l)', 'Consumption (km/l)', 'Consumo (km/l)'],
  ['Gasto por mes', 'Spending per month', 'Gasto por mês'],
  ['Por estación', 'By station', 'Por posto'],
  ['Todas las cargas', 'All refuels', 'Todos os abastecimentos'],
  ['Rinde', 'Mileage', 'Rende'],
  ['Cargas', 'Refuels', 'Abastecimentos'],
  ['Todo', 'All', 'Tudo'],
  ['Sin gastos en este período.', 'No spending in this period.', 'Sem gastos neste período.'],
  ['Necesitás al menos dos tanques llenos medidos para ver el gráfico.', 'You need at least two measured full tanks to see the chart.', 'Você precisa de pelo menos dois tanques cheios medidos para ver o gráfico.'],
  ['Todavía no hay cargas.', 'No refuels yet.', 'Ainda não há abastecimentos.'],
  ['¿Borrar esta carga?', 'Delete this refuel?', 'Apagar este abastecimento?'],
  ['Borrar carga', 'Delete refuel', 'Apagar abastecimento'],
  ['{}. No se puede deshacer.', '{}. This can’t be undone.', '{}. Não pode ser desfeito.'],
  ['Borrar', 'Delete', 'Apagar'],
  ['Cancelar', 'Cancel', 'Cancelar'],
  ['Carga borrada.', 'Refuel deleted.', 'Abastecimento apagado.'],
  ['Mis viajes y forma de manejar', 'My trips and driving style', 'Minhas viagens e forma de dirigir'],
  ['# carga', '# refuel', '# abastecimento'],
  ['# cargas', '# refuels', '# abastecimentos'],
  ['La línea punteada es tu promedio (', 'The dotted line is your average (', 'A linha pontilhada é sua média ('],
  // Mis autos
  ['Tocá un auto para usarlo. Las cargas y los viajes quedan guardados en cada uno.', 'Tap a car to use it. Refuels and trips are kept with each car.', 'Toque em um carro para usá-lo. Abastecimentos e viagens ficam salvos em cada um.'],
  ['EN USO', 'IN USE', 'EM USO'],
  ['+ Agregar auto', '+ Add car', '+ Adicionar carro'],
  ['Archivados (#)', 'Archived (#)', 'Arquivados (#)'],
  ['Archivar el auto en uso…', 'Archive the car in use…', 'Arquivar o carro em uso…'],
  ['Archivar', 'Archive', 'Arquivar'],
  ['¿Archivar {}?', 'Archive {}?', 'Arquivar {}?'],
  ['Sale de la lista y se conserva todo su historial. Podés volver a usarlo desde "Archivados".', 'It leaves the list and keeps all its history. You can use it again from "Archived".', 'Sai da lista e mantém todo o histórico. Você pode usá-lo de novo em "Arquivados".'],
  ['Auto archivado.', 'Car archived.', 'Carro arquivado.'],
  ['Propio', 'Own', 'Próprio'], ['Alquilado', 'Rental', 'Alugado'], ['Prestado', 'Borrowed', 'Emprestado'], ['Compartido', 'Shared', 'Compartilhado'],
  ['{} · {} · # carga', '{} · {} · # refuel', '{} · {} · # abastecimento'],
  ['{} · {} · # cargas', '{} · {} · # refuels', '{} · {} · # abastecimentos'],
  ['{} · {} · # cargas · en la nube', '{} · {} · # refuels · in the cloud', '{} · {} · # abastecimentos · na nuvem'],
  ['{} · {} · # carga · en la nube', '{} · {} · # refuel · in the cloud', '{} · {} · # abastecimento · na nuvem'],
  ['Datos del auto en uso', 'Details of the car in use', 'Dados do carro em uso'],
  ['Marca', 'Make', 'Marca'], ['Modelo', 'Model', 'Modelo'], ['Año', 'Year', 'Ano'], ['Año (opcional)', 'Year (optional)', 'Ano (opcional)'],
  ['Tanque (litros)', 'Tank (liters)', 'Tanque (litros)'], ['Tanque (l, opcional)', 'Tank (l, optional)', 'Tanque (l, opcional)'],
  ['Combustible habitual', 'Usual fuel', 'Combustível habitual'],
  ['Elegí el combustible que carga.', 'Choose the fuel it takes.', 'Escolha o combustível que ele usa.'],
  ['cargado en', 'filled at', 'abastecido em'],
  ['¿Qué combustible carga?', 'Which fuel does it take?', 'Qual combustível ele usa?'],
  ['Guardar auto', 'Save car', 'Salvar carro'],
  ['Guardado ✓', 'Saved ✓', 'Salvo ✓'],
  ['Auto guardado.', 'Car saved.', 'Carro salvo.'],
  ['Auto nuevo', 'New car', 'Carro novo'],
  ['Este auto es', 'This car is', 'Este carro é'],
  ['Archivarlo cuando cambie de país', 'Archive it when I change country', 'Arquivar quando eu mudar de país'],
  ['Sale de la lista y conserva su historial', 'It leaves the list and keeps its history', 'Sai da lista e mantém o histórico'],
  ['Se usa en {}. En la primera carga llená el tanque: el consumo aparece desde la segunda carga completa.', 'Used in {}. Fill the tank at the first refuel: consumption appears from the second full refuel.', 'Usado em {}. No primeiro abastecimento encha o tanque: o consumo aparece a partir do segundo tanque cheio.'],
  ['Guardar', 'Save', 'Salvar'],
  ['Poné al menos la marca o el modelo.', 'Enter at least the make or model.', 'Informe pelo menos a marca ou o modelo.'],
  ['Listo: ahora cargás con {}.', 'Done: you’re now refueling {}.', 'Pronto: agora você abastece o {}.'],
  ['Ahora: {}', 'Now: {}', 'Agora: {}'],
  ['¿Qué auto usás?', 'Which car are you using?', 'Qual carro você está usando?'],
  ['+ Auto nuevo', '+ New car', '+ Carro novo'],
  ['Ver Mis autos', 'See My cars', 'Ver Meus carros'],
  ['Auto sin nombre', 'Unnamed car', 'Carro sem nome'],
  ['Estás cargando en {}', 'You’re refueling in {}', 'Você está abastecendo em {}'],
  ['¿Con qué auto? Así el consumo de tu auto no se mezcla con el de uno alquilado.', 'Which car? That way your car’s consumption doesn’t mix with a rental’s.', 'Com qual carro? Assim o consumo do seu carro não se mistura com o de um alugado.'],
  ['+ Auto nuevo (alquilado o prestado)', '+ New car (rental or borrowed)', '+ Carro novo (alugado ou emprestado)'],
  ['Sigo con {}', 'Keep using {}', 'Continuo com {}'],
  ['Era una prueba: volver a automático', 'Just testing: back to automatic', 'Era um teste: voltar ao automático'],
  ['Archivamos {} ({}). Su historial queda guardado.', 'We archived {} ({}). Its history is kept.', 'Arquivamos {} ({}). O histórico fica salvo.'],
  ['Resumen', 'Summary', 'Resumo'], ['Odómetro', 'Odometer', 'Hodômetro'], ['Promedio', 'Average', 'Média'],
  ['Total gastado: {}', 'Total spent: {}', 'Total gasto: {}'],
  ['País de las estaciones', 'Stations country', 'País dos postos'],
  ['Ahora: {} · base preparada a mano', 'Now: {} · hand-curated list', 'Agora: {} · base preparada à mão'],
  ['Ahora: {} · precios oficiales del {}', 'Now: {} · official prices of {}', 'Agora: {} · preços oficiais de {}'],
  ['Ahora: {} · ANP (sin precios por ahora) · {}', 'Now: {} · ANP (no prices yet) · {}', 'Agora: {} · ANP (sem preços por enquanto) · {}'],
  ['Idioma', 'Language', 'Idioma'],
  ['Compartir', 'Share', 'Compartilhar'],
  ['Compartir mi consumo', 'Share my consumption', 'Compartilhar meu consumo'],
  ['Enviá un resumen por WhatsApp u otra app.', 'Send a summary via WhatsApp or another app.', 'Envie um resumo pelo WhatsApp ou outro app.'],
  ['Exportar a Excel (CSV)', 'Export to Excel (CSV)', 'Exportar para Excel (CSV)'],
  ['Todas tus cargas en una planilla.', 'All your refuels in a spreadsheet.', 'Todos os seus abastecimentos em uma planilha.'],
  ['Importar cargas anteriores', 'Import previous refuels', 'Importar abastecimentos anteriores'],
  ['Desde una planilla CSV (Excel).', 'From a CSV (Excel) spreadsheet.', 'De uma planilha CSV (Excel).'],
  ['Importar', 'Import', 'Importar'],
  ['Importar # cargas', 'Import # refuels', 'Importar # abastecimentos'],
  ['# cargas importadas.', '# refuels imported.', '# abastecimentos importados.'],
  ['Esas cargas ya estaban registradas.', 'Those refuels were already logged.', 'Esses abastecimentos já estavam registrados.'],
  ['El archivo está vacío.', 'The file is empty.', 'O arquivo está vazio.'],
  ['Todavía no hay cargas para exportar.', 'No refuels to export yet.', 'Ainda não há abastecimentos para exportar.'],
  ['Resumen copiado. Pegalo donde quieras.', 'Summary copied. Paste it anywhere.', 'Resumo copiado. Cole onde quiser.'],
  ['Mensaje copiado.', 'Message copied.', 'Mensagem copiada.'],
  ['Navegación', 'Navigation', 'Navegação'],
  ['No se pudo guardar en el teléfono.', 'Couldn’t save on the phone.', 'Não foi possível salvar no celular.'],
  // Nube
  ['Nube y compartir', 'Cloud and sharing', 'Nuvem e compartilhamento'],
  ['Copia en la nube (opcional)', 'Cloud backup (optional)', 'Cópia na nuvem (opcional)'],
  ['Tus cargas a salvo y en cualquier teléfono. Además podés compartir el auto.', 'Your refuels safe and on any phone. You can also share the car.', 'Seus abastecimentos seguros e em qualquer celular. Você também pode compartilhar o carro.'],
  ['Tu correo', 'Your email', 'Seu e-mail'],
  ['Enviarme el enlace para entrar', 'Send me the sign-in link', 'Enviar o link de acesso'],
  ['Sin contraseñas: te llega un enlace por correo.', 'No passwords: you get a link by email.', 'Sem senhas: você recebe um link por e-mail.'],
  ['Te enviamos un correo a', 'We sent an email to', 'Enviamos um e-mail para'],
  ['. Abrí el enlace', '. Open the link', '. Abra o link'],
  ['desde este teléfono', 'from this phone', 'neste celular'],
  ['¿El correo trae un código de # dígitos? Escribilo acá:', 'Does the email have a #-digit code? Type it here:', 'O e-mail tem um código de # dígitos? Digite aqui:'],
  ['Entrar', 'Sign in', 'Entrar'],
  ['Usar otro correo', 'Use another email', 'Usar outro e-mail'],
  ['Revisá el correo.', 'Check the email address.', 'Confira o e-mail.'],
  ['Código incorrecto o vencido.', 'Wrong or expired code.', 'Código incorreto ou expirado.'],
  ['Sincronizando…', 'Syncing…', 'Sincronizando…'],
  ['Sincronizado ✓ {}', 'Synced ✓ {}', 'Sincronizado ✓ {}'],
  ['No se pudo sincronizar: {}', 'Couldn’t sync: {}', 'Não foi possível sincronizar: {}'],
  ['Sincronizar', 'Sync', 'Sincronizar'],
  ['Cerrar sesión', 'Sign out', 'Sair'],
  ['¿Cerrar sesión?', 'Sign out?', 'Sair?'],
  ['Tus cargas siguen en este teléfono y en la nube.', 'Your refuels stay on this phone and in the cloud.', 'Seus abastecimentos continuam neste celular e na nuvem.'],
  ['Apodo para el ranking (opcional)', 'Nickname for the ranking (optional)', 'Apelido para o ranking (opcional)'],
  ['Anónimo', 'Anonymous', 'Anônimo'],
  ['Apodo guardado.', 'Nickname saved.', 'Apelido salvo.'],
  ['Ese apodo ya está en uso.', 'That nickname is already taken.', 'Esse apelido já está em uso.'],
  ['No se pudo guardar el apodo.', 'Couldn’t save the nickname.', 'Não foi possível salvar o apelido.'],
  ['Compartir {}', 'Share {}', 'Compartilhar {}'],
  ['Para que otra persona (por ejemplo, de tu familia) registre cargas de este auto, pasale este código:', 'For someone else (for example, family) to log refuels for this car, give them this code:', 'Para que outra pessoa (por exemplo, da família) registre abastecimentos deste carro, passe este código:'],
  ['Enviar código', 'Send code', 'Enviar código'],
  ['¿Te pasaron un código? Se agrega a tus autos:', 'Got a code? It’s added to your cars:', 'Recebeu um código? Ele é adicionado aos seus carros:'],
  ['Sumarme', 'Join', 'Entrar'],
  ['¿Sumarte a ese auto?', 'Join that car?', 'Entrar nesse carro?'],
  ['Se agrega a "Mis autos" y pasa a ser el auto en uso. Tus otros autos quedan como están; cambiás desde la lista.', 'It’s added to "My cars" and becomes the car in use. Your other cars stay as they are; switch from the list.', 'É adicionado a "Meus carros" e passa a ser o carro em uso. Seus outros carros continuam iguais; troque pela lista.'],
  ['Listo: el auto compartido se agregó a tus autos.', 'Done: the shared car was added to your cars.', 'Pronto: o carro compartilhado foi adicionado aos seus carros.'],
  ['El código tiene # caracteres.', 'The code has # characters.', 'O código tem # caracteres.'],
  ['Código inexistente.', 'Code not found.', 'Código inexistente.'],
  ['No se pudo abrir ese auto.', 'Couldn’t open that car.', 'Não foi possível abrir esse carro.'],
  ['Comparar con otros conductores', 'Compare with other drivers', 'Comparar com outros motoristas'],
  ['Iniciá sesión para ver cómo rinde tu auto frente a otros del mismo modelo.', 'Sign in to see how your car compares with others of the same model.', 'Entre para ver como seu carro rende frente a outros do mesmo modelo.'],
  ['¿Cómo te va vs. otros {}?', 'How do you do vs. other {}?', 'Como você está vs. outros {}?'],
  ['Participar en el ranking (con tu apodo o como "Anónimo")', 'Join the ranking (with your nickname or as "Anonymous")', 'Participar do ranking (com seu apelido ou como "Anônimo")'],
  ['Por ahora sos el único con este modelo. ¡Invitá a otros!', 'You’re the only one with this model for now. Invite others!', 'Por enquanto você é o único com este modelo. Convide outros!'],
  ['Todavía no hay datos de este modelo. Aparecés cuando midas al menos # km.', 'No data for this model yet. You’ll appear after measuring at least # km.', 'Ainda não há dados deste modelo. Você aparece quando medir pelo menos # km.'],
  ['Completá marca y modelo de tu auto (arriba) para compararte.', 'Fill in your car’s make and model (above) to compare.', 'Preencha marca e modelo do seu carro (acima) para comparar.'],
  ['No se pudo cargar el ranking.', 'Couldn’t load the ranking.', 'Não foi possível carregar o ranking.'],
  ['Vos', 'You', 'Você'],
  ['La nube no está disponible sin conexión.', 'The cloud isn’t available offline.', 'A nuvem não está disponível sem conexão.'],
  ['Sugerencias de estaciones', 'Station suggestions', 'Sugestões de postos'],
  ['No hay sugerencias para revisar.', 'No suggestions to review.', 'Não há sugestões para revisar.'],
  ['Aprobada: ya la ven todos.', 'Approved: everyone sees it now.', 'Aprovada: todos já veem.'],
  ['¿Guardar {} como tu idioma?', 'Save {} as your language?', 'Salvar {} como seu idioma?'],
  ['Lo guardamos en tu cuenta para que la app aparezca en este idioma en cualquier teléfono.', 'We save it in your account so the app shows in this language on any phone.', 'Salvamos na sua conta para o app aparecer neste idioma em qualquer celular.'],
  ['Para guardarlo en tu cuenta, iniciá sesión en "Copia en la nube" (abajo). Queda guardado al entrar.', 'To save it in your account, sign in under "Cloud backup" (below). It’s saved when you sign in.', 'Para salvar na sua conta, entre em "Cópia na nuvem" (abaixo). Fica salvo ao entrar.'],
  ['Sí, en mi cuenta', 'Yes, in my account', 'Sim, na minha conta'],
  ['Iniciar sesión y guardarlo', 'Sign in and save it', 'Entrar e salvar'],
  ['Solo en este teléfono', 'Only on this phone', 'Só neste celular'],
  ['Idioma guardado en tu cuenta.', 'Language saved in your account.', 'Idioma salvo na sua conta.'],
  // Viajes
  ['Modo viaje', 'Trip mode', 'Modo viagem'],
  ['Registrar mis viajes', 'Record my trips', 'Registrar minhas viagens'],
  ['Registrar velocidad, tipo de vía, ralentí, arranques y frenadas para entender tu consumo.', 'Record speed, road type, idling, starts and braking to understand your consumption.', 'Registrar velocidade, tipo de via, marcha lenta, arrancadas e frenagens para entender seu consumo.'],
  ['Manual', 'Manual', 'Manual'],
  ['Tocás "Iniciar viaje" y "Terminar viaje".', 'You tap "Start trip" and "End trip".', 'Você toca em "Iniciar viagem" e "Encerrar viagem".'],
  ['Automático con la app abierta', 'Automatic with the app open', 'Automático com o app aberto'],
  ['Detecta solo cuándo empezás y terminás de manejar, mientras la app está en pantalla.', 'Detects when you start and stop driving, while the app is on screen.', 'Detecta sozinho quando você começa e termina de dirigir, com o app na tela.'],
  ['Automático solo si el teléfono carga', 'Automatic only while charging', 'Automático só com o celular carregando'],
  ['Igual que el anterior, pero solo con el teléfono enchufado (en el cargador del auto). Evita registrar Uber o bici.', 'Same as above, but only with the phone plugged in (car charger). Avoids logging Uber or bike rides.', 'Igual ao anterior, mas só com o celular na tomada (carregador do carro). Evita registrar Uber ou bicicleta.'],
  ['Siempre, en segundo plano', 'Always, in the background', 'Sempre, em segundo plano'],
  ['Requiere la app de Android (próximamente).', 'Requires the Android app (coming soon).', 'Requer o app Android (em breve).'],
  ['Usar el sensor de movimiento (más preciso para arranques y frenadas; teléfono fijo en un soporte)', 'Use the motion sensor (more accurate for starts and braking; phone fixed in a holder)', 'Usar o sensor de movimento (mais preciso para arrancadas e frenagens; celular fixo no suporte)'],
  ['El recorrido detallado queda solo en este teléfono. Mientras registra, la pantalla se mantiene encendida: conviene tener el teléfono cargando.', 'The detailed route stays only on this phone. While recording, the screen stays on: keep the phone charging.', 'O trajeto detalhado fica só neste celular. Enquanto registra, a tela fica ligada: convém deixar o celular carregando.'],
  ['Mis viajes', 'My trips', 'Minhas viagens'],
  ['Por tanque', 'By tank', 'Por tanque'],
  ['Tanque actual (en uso)', 'Current tank (in use)', 'Tanque atual (em uso)'],
  ['Del {} (# km) al {} (# km).', 'From {} (# km) to {} (# km).', 'De {} (# km) a {} (# km).'],
  ['Sin bandera', 'Unbranded', 'Sem bandeira'],
  ['Ciudad # %, avenida # %, ruta # %', 'City # %, avenue # %, highway # %', 'Cidade # %, avenida # %, estrada # %'],
  ['Ciudad # %', 'City # %', 'Cidade # %'], ['Avenida # %', 'Avenue # %', 'Avenida # %'], ['Ruta # %', 'Highway # %', 'Estrada # %'],
  ['Arranques fuertes', 'Hard starts', 'Arrancadas fortes'],
  ['Frenadas bruscas', 'Hard braking', 'Frenagens bruscas'],
  ['Puntaje', 'Score', 'Pontuação'],
  ['Detalle del viaje', 'Trip details', 'Detalhes da viagem'],
  ['Volver a mis viajes', 'Back to my trips', 'Voltar às minhas viagens'],
  ['Este viaje no tiene recorrido guardado.', 'This trip has no saved route.', 'Esta viagem não tem trajeto salvo.'],
  ['Velocidad (km/h)', 'Speed (km/h)', 'Velocidade (km/h)'],
  ['Consumo instantáneo (km/l)', 'Instant consumption (km/l)', 'Consumo instantâneo (km/l)'],
  ['Ver el recorrido y consumo instantáneo ›', 'See route and instant consumption ›', 'Ver trajeto e consumo instantâneo ›'],
  ['Manejé yo este auto (contar en la evaluación)', 'I drove this car (count in the evaluation)', 'Eu dirigi este carro (contar na avaliação)'],
  ['¿Borrar este viaje?', 'Delete this trip?', 'Apagar esta viagem?'],
  ['Borrar viaje', 'Delete trip', 'Apagar viagem'],
  ['Viaje iniciado.', 'Trip started.', 'Viagem iniciada.'],
  ['Viaje guardado: {}', 'Trip saved: {}', 'Viagem salva: {}'],
  ['midiendo…', 'measuring…', 'medindo…'],
  ['Ruta, ciudad, arranques y frenadas por tanque.', 'Highway, city, starts and braking per tank.', 'Estrada, cidade, arrancadas e frenagens por tanque.'],
  ['# km registrados · # min detenido · máx. # km/h', '# km recorded · # min stopped · max # km/h', '# km registrados · # min parado · máx. # km/h'],
  ['🚗 Auto · # km · # min · máx. # km/h', '🚗 Car · # km · # min · max # km/h', '🚗 Carro · # km · # min · máx. # km/h'],
  ['🚲 Bici', '🚲 Bike', '🚲 Bicicleta'], ['🚶 A pie', '🚶 On foot', '🚶 A pé'],
  ['💡 Anticipá las frenadas: dejá rodar el auto antes de frenar.', '💡 Anticipate braking: let the car coast before braking.', '💡 Antecipe as frenagens: deixe o carro rodar antes de frear.'],
  ['💡 Arrancá más suave: muchas aceleraciones fuertes.', '💡 Start more gently: many hard accelerations.', '💡 Arranque mais suave: muitas acelerações fortes.'],
  ['💡 Mucho tiempo detenido con el motor en marcha: el ralentí gasta sin avanzar.', '💡 Lots of idling: the engine burns fuel without moving.', '💡 Muito tempo parado com o motor ligado: a marcha lenta gasta sem andar.'],
  ['💡 Por encima de # km/h el consumo sube mucho.', '💡 Above # km/h consumption rises a lot.', '💡 Acima de # km/h o consumo sobe muito.'],
  ['💡 ¡Manejo parejo! Seguí así.', '💡 Smooth driving! Keep it up.', '💡 Direção suave! Continue assim.'],
  ['Modo viaje automático: empieza solo cuando manejás', 'Automatic trip mode: starts when you drive', 'Modo viagem automático: começa quando você dirige'],
  ['Cargando…', 'Loading…', 'Carregando…'],
  ['Sin datos.', 'No data.', 'Sem dados.'],
  ['Según la base,', 'According to the list,', 'Segundo a base,'],
  ['está a # m de donde estás ahora. Si estás en esa estación, guardamos tu posición como la correcta. La próxima vez la vas a encontrar por GPS.', 'is # m from where you are now. If you are at that station, we’ll save your position as the correct one. Next time GPS will find it.', 'está a # m de onde você está agora. Se você está nesse posto, salvamos sua posição como a correta. Da próxima vez o GPS vai encontrá-lo.'],
  ['está a # km de donde estás ahora. Si estás en esa estación, guardamos tu posición como la correcta. La próxima vez la vas a encontrar por GPS.', 'is # km from where you are now. If you are at that station, we’ll save your position as the correct one. Next time GPS will find it.', 'está a # km de onde você está agora. Se você está nesse posto, salvamos sua posição como a correta. Da próxima vez o GPS vai encontrá-lo.'],
  ['Cargaste # l y el tanque de tu auto es de # l.', 'You filled # l and your car’s tank holds # l.', 'Você abasteceu # l e o tanque do seu carro é de # l.'],
  ['Es menor que la carga anterior (# km)', 'It’s lower than the previous refuel (# km)', 'É menor que o abastecimento anterior (# km)'],
  ['Es mayor que una carga posterior (# km)', 'It’s higher than a later refuel (# km)', 'É maior que um abastecimento posterior (# km)'],
  ['El kilometraje tiene que ser mayor a # km.', 'The odometer must be higher than # km.', 'A quilometragem tem que ser maior que # km.'],
  ['El kilometraje tiene que ser menor a # km (hay una carga posterior).', 'The odometer must be lower than # km (there’s a later refuel).', 'A quilometragem tem que ser menor que # km (há um abastecimento posterior).'],
  ['equivale a # l cada # km', 'that’s # l per # km', 'equivale a # l a cada # km'],
  ['Un # % mejor que tu promedio. ¡Bien!', '# % better than your average. Nice!', '# % melhor que sua média. Muito bem!'],
  ['Un # % peor que tu promedio.', '# % worse than your average.', '# % pior que sua média.'],
  ['Faltan columnas: Fecha, Litros, Total y Kilometraje son obligatorias.', 'Missing columns: Date, Liters, Total and Odometer are required.', 'Faltam colunas: Data, Litros, Total e Quilometragem são obrigatórias.'],
  ['No se pudo leer ninguna fila (revisá las filas {}).', 'No row could be read (check rows {}).', 'Nenhuma linha pôde ser lida (confira as linhas {}).'],
  ['🚗 # % ruta · # % ciudad · puntaje de manejo #/#', '🚗 # % highway · # % city · driving score #/#', '🚗 # % estrada · # % cidade · pontuação #/#'],
  ['Tus viajes estimaban # km/l: {} vs. el real', 'Your trips estimated # km/l: {} vs. actual', 'Suas viagens estimavam # km/l: {} vs. o real'],
  ['normal', 'normal', 'normal'],
  ['gasta mucho (aceleración)', 'uses a lot (acceleration)', 'gasta muito (aceleração)'],
  ['Ahora: {} · base {} · # estaciones', 'Now: {} · list {} · # stations', 'Agora: {} · base {} · # postos'],
  ['{} · base {} · # estaciones', '{} · list {} · # stations', '{} · base {} · # postos'],
  // Tutorial
  ['Cada vez que cargues combustible, tocá acá.', 'Every time you refuel, tap here.', 'Toda vez que abastecer, toque aqui.'],
  ['Este es el mapa con las estaciones cerca tuyo. Tocá una (en el mapa o en la lista de abajo).', 'This is the map with stations near you. Tap one (on the map or in the list below).', 'Este é o mapa com os postos perto de você. Toque em um (no mapa ou na lista abaixo).'],
  ['Acá elegís el país y, al lado, filtrás por bandera (por ejemplo, solo YPF o Shell).', 'Here you choose the country and, next to it, filter by brand (for example, only Shell).', 'Aqui você escolhe o país e, ao lado, filtra por bandeira (por exemplo, só Petrobras ou Shell).'],
  ['Ahora tocá Siguiente.', 'Now tap Next.', 'Agora toque em Próximo.'],
  ['Tu combustible habitual ya viene marcado. Si cargaste otro, cambialo acá.', 'Your usual fuel is already selected. If you filled another, change it here.', 'Seu combustível habitual já vem marcado. Se abasteceu outro, mude aqui.'],
  ['Escribí los litros que cargaste. Es una práctica: no se guarda.', 'Type the liters you filled. It’s practice: it won’t be saved.', 'Digite os litros que abasteceu. É um treino: não será salvo.'],
  ['Y el total que pagaste.', 'And the total you paid.', 'E o total que você pagou.'],
  ['Si llenaste el tanque, dejalo prendido: así calculamos el consumo exacto.', 'If you filled the tank, leave it on: that’s how we calculate exact consumption.', 'Se encheu o tanque, deixe ligado: assim calculamos o consumo exato.'],
  ['Tocá Siguiente.', 'Tap Next.', 'Toque em Próximo.'],
  ['Marcá los kilómetros que dice el tablero del auto.', 'Enter the kilometers shown on the car’s dashboard.', 'Digite os quilômetros que aparecem no painel do carro.'],
  ['Tocá Guardar y calcular. (Es la práctica: esta carga no se guarda.)', 'Tap Save and calculate. (It’s practice: this refuel won’t be saved.)', 'Toque em Salvar e calcular. (É treino: este abastecimento não será salvo.)'],
  ['En Historial ves los gráficos de consumo y de gasto.', 'In History you see consumption and spending charts.', 'No Histórico você vê os gráficos de consumo e de gasto.'],
  ['En Mis autos cargás los datos del auto, agregás otros (por ejemplo, uno alquilado) y elegís el idioma.', 'In My cars you enter the car’s details, add others (for example, a rental) and choose the language.', 'Em Meus carros você informa os dados do carro, adiciona outros (por exemplo, um alugado) e escolhe o idioma.'],
  ['¡Listo! Ya sabés usar la app. La próxima carga, hacela de verdad.', 'Done! Now you know how to use the app. Log your next refuel for real.', 'Pronto! Agora você sabe usar o app. O próximo abastecimento, registre de verdade.'],
  ['¡Listo!', 'Done!', 'Pronto!'],
  ['¡Muy bien! Así se registra una carga. (Esta era de práctica.)', 'Well done! That’s how you log a refuel. (This one was practice.)', 'Muito bem! É assim que se registra um abastecimento. (Este era de treino.)'],
  ['Guardar', 'Save', 'Salvar'],
  ['Guardar carga', 'Save refuel', 'Salvar abastecimento'],
  ['Saltar', 'Skip', 'Pular'],
  ['Entendido', 'Got it', 'Entendi'],
  ['Ver el tutorial otra vez', 'See the tutorial again', 'Ver o tutorial de novo'],
];

/* ---------- Motor ---------- */
let LANG = 'es';
const EXACT = { en: {}, pt: {} }, PATS = { en: [], pt: [] };
const NUM = /\d+(?:[.,]\d+)*/g;
const normKey = (s) => s.replace(/\s+/g, ' ').trim();
(function build() {
  for (const [es, en, pt] of T) {
    const key = normKey(es);
    if (!key.includes('{}') && !key.includes('#')) { EXACT.en[key] = en; EXACT.pt[key] = pt; continue; }
    // patrón: "#" número, "{}" texto cualquiera
    const rx = new RegExp('^' + key.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/#/g, '(\\d+(?:[.,]\\d+)*)').replace(/\{\}/g, '(.+?)') + '$');
    const order = (key.match(/#|\{\}/g) || []);
    PATS.en.push({ rx, out: en, order }); PATS.pt.push({ rx, out: pt, order });
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
