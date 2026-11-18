# Blind granskning

Den som har byggt sidan ser inte sina egna fel. Därför granskas varje sida av en fristående granskare (en subagent) som inte har sett bygget och inte vet vad som är nytt. Den bedömer sidan som en erfaren designer skulle, mäter i stället för att gissa och ger en poäng.

Testet med Korn & Kaka visade varför det behövs: den första versionen fick 4 av 10 av granskaren. Bygget hade själv tyckt att den var bra. Granskaren hittade bland annat en prislapp i thailändska baht på ett lånat foto, mellanrum på 79 och 14 px i samma bildrutnät och ingen meny på mobil.

## Så går det till

1. Starta förhandsvisningen och kontrollera att sidan laddar.
2. Starta en subagent (`general-purpose`) med texten nedan. Byt ut adresserna. Har du en äldre version att jämföra med, lägg den som "Page B", så att granskaren inte vet vilken som är ny.
3. Läs rapporten. Laga alla fel under punkt 4 och de viktigaste ändringarna under punkt 3.
4. Granska igen med en **ny** subagent, inte samma, så att den inte minns förra rundan.
5. Sluta när sidan får minst 8 av 10 med foton, eller efter tre rundor. Skriv poängen och de kvarvarande svagheterna i rapporten till Måns.

Poängen varierar ungefär en poäng mellan olika granskare. Samma version fick 6,5 i en runda och 5 i nästa. Lita därför mest på jämförelsen mellan två versioner i samma runda, och på de konkreta felen granskaren hittar. Felen är det mest värdefulla: granskarna hittade bland annat en sida som var 688 px bred på mobil, som bygget själv hade missat.

Granskaren ska få sidan, inte din förklaring av den. Skriv inte vad du har försökt göra, och inte vad du hoppas att den ska tycka.

## Texten till granskaren

```
You are a senior web designer at a respected Scandinavian design studio. Judge a website for <kort beskrivning av kunden, till exempel "a small sourdough bakery in Malmö, Sweden">. Do not edit any files. You have not seen the page before.

Pages, served locally:
- Page A: http://localhost:8788/kund/<namn>/
- (valfritt) Page B: http://localhost:8788/kund/<äldre version>/

Use the built-in browser tools (navigate, screenshot, scroll, javascript for measuring, resize_window with preset "mobile" then "desktop"). Look at each page top to bottom on desktop and on mobile (375 px). Ignore the draft banner at the very top. Measure alignment and gaps where you suspect problems (getBoundingClientRect).

Answer concisely:
1. Score 1–10: "looks like a real site made by a good human designer" (10) versus "looks AI-generated / template" (1). Name the 3 strongest tells of AI or template, as concrete observations (element, why).
2. Do the photos fit this business? Any text, signs, prices or objects in them that give them away?
3. The 5 most important concrete fixes to reach 9/10, most important first (element, change, why). Include copy, typography, spacing, hierarchy and mobile.
4. Anything broken: layout bugs, overflow, contrast, focus, text collisions, mobile navigation.

Reset the viewport to desktop when done.
```
