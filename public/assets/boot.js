// Körs direkt i <head>, innan sidan ritas. Talar om för stilmallen att JavaScript finns,
// så att inflygnings-animationerna bara döljer innehåll när de också kan visa det igen.
document.documentElement.classList.add('js');
