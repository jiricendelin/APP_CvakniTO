**Zadání:**

Chci pokladní aplikaci s jednoduchým fakturačním systémem. Aplikace nebo služba bude fungovat v mobilním telefonu. Bude umět pokladní funkce, to znamená mít účet, na něj přidávat předvolené položky. Položky budou mít vlastní ceník.

Takže na výchozí obrazovce půjdou zrychleně zadávat. Například položka, počet, přidat.

Půjde také přidávat položka, která není v ceníku, u které bude možnost zadat cenu. To znamená, že v případě přidání takové položky se tam objeví, nebo tam může být možná i trvale zobrazena numerická klávesnice.

Pak tam půjdou přehledná a velká tlačítka pro výběr typu platby, takže tlačítko „hotovost“ nebo „platba QR kódem“. Klidně ten název pak můžeš zkrátit. Pokud bude zvolena platba QR kódem, tak ten QR kód bude vygenerovaný na účtence.

Bude tam volitelné tlačítko na to, zda se má účtenka i vytisknout.

Tisk bude probíhat přes Bluetooth na termotransferové malé tiskárně, propojené s mobilem.

Aplikace bude mít funkci, která danou účtenku bude umět odeslat či smazat z portálu Finanční správy podle standardu EET 2.0.



Chci, abych tuhle aplikaci mohl jakoby duplikovat pro více uživatelů.

To znamená, že vytvořím někde nové přihlašovací údaje a tam bude čistá verze téhle aplikace.

Teď ji uděláme pro manželku, ale později budu chtít třeba pro dceru.

A pak mě napadají ještě další dva lidi z rodiny.

Ty si nebudou navzájem vidět zákazníky, účtenky, nic. Budou pracovat naprosto samostatně.



Pak tam bude seznam účtenek, Kde bude možnost účtenku zeditovat, případně smazat, či opětovně vytisknout. 

Účtenky se budou řadit do tří kategorií:

1\. Ty, co spadají pod pedikuru.

2\. Ty, co spadají pod masáže.

3\. A pak vše ostatní, jako prodej a další věci.



Dárkové poukazy, které budou součástí ceníku, se budou řadit takto:

* Poukazy na masáž budu zadávat do ceníku rovnou do kategorie \*\*Masáže\*\*.
* Poukazy na pedikúru budu zadávat na \*\*pedikúru\*\*
* Poukazy na částku tak budu zadávat do kategorie \*\*prodej a ostatní\*\*, viz. níže.





Položky budou mít vlastní ceník, takže tam bude například:

* Masáž 800 korun
* Masáž dva 1000 korun
* Masáž tři 1500 korun
* Pedikúra oběž 600 korun
* Pedikúra s lakováním 700 korun



U ceníků půjde zadat, zda dané zboží má spadat do kategorie \*\*masáže\*\*, kategorie \*\*pedikúra\*\* nebo kategorie \*\*prodej a ostatní\*\*. Je to kvůli danění paušálem, tak abych měl potom přehled, co pod jakou činnost spadalo, až budu dělat roční vyúčtování.



**Přehledy:**

* Jednotlivé účtenky si budu moci filtrovat podle data, kategorie a typu platby.
* Budu si moci vygenerovat přehled za dané období a ten si pak vyexportovat do CSV nebo jiného datového formátu



Nastavení:

* nastavení firmy
* editace dat na účtence + lehce vizuální podoba účtenky, třeba přes html a proměnné
* zadání čísla učtu a dalších věcí aby se mohl generovat platební qr kód na účtenku
* aplikace taky bude přijímat informace o platbách, které si bude vždy párovat s danou účtenkou podle variabilního symbolu (to bude webhookem, api nebo jinou cestou z n8n, kde budu číst platby z banky např. přes FIO token, stejně, jako to dělám u WTime)
* Půjdou nastavovat číselné řady účtenek i faktur
* Nastavení SMTP účtu pro odesílání faktur
* Nastavení k EET 2.0, zdroj ti k tomu uvádím níže.



**Faktury:**

* Fakturace bude probíhat podobě, jako ve Wtime. Jen bude celý proces zjednodušený.
* Nebudou tam pravidelné položky,záznamy, souhrny pro zákazníka, odesílání faktur přes n8n, zakázky a další. 
* Bude tam jen základ - ruční vytvoření faktury, odeslání faktury zákazníkovi přes SMTP a párování na platbu. Příchozí platba se spáruje buď s účtenkou nebo s fakturou, podle VS
* Bude možnost stáhnout faktury v PDF
* Zasílání faktur, upomínek a poděkování stejně, jako jsme to měli v počátcích ve WTime, bude to striktně přes SMTP (už mám na VPS povolený port 465). 



**Vizuální podoba:**

* Jako moje aplikace WTime
* hlavní barva bude zelená, nastavitelná v \*\*Nastavení\*\*



**Webové zdroje:**

Informace o EET https://eet.gov.cz/cs/zacinam-s-eet

Inspirace funkcemi https://elementarypos.com/cs/funkce/



**Co teď nevím:**

Aplikaci pro použití více uživateli, jak uvádím výše, připravit hned, nebo to nechat, až to bude aktuální ve skutečnosti, a pak to doimplementovat?



**Název:**

* apliace se bude jmenovat CvakniTo
* bude na mém VPS na subdoméně cvaknito.cendelin.cz
* vytvořím k tomu i dns záznam

