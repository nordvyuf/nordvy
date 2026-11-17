// Illustrationer till utkastet, en per bransch. Rena SVG-former utan text som ritas i
// utkastets färger (se .pv-scene i preview.css). Allt här är fast innehåll, aldrig kundtext.

const SCENES = {
  frisor: `
    <path class="s" d="M56 420V196a144 144 0 0 1 288 0V420z"/>
    <path class="o" d="M56 420V196a144 144 0 0 1 288 0V420"/>
    <ellipse class="c" cx="200" cy="206" rx="96" ry="128"/>
    <ellipse class="ls" cx="200" cy="206" rx="96" ry="128"/>
    <ellipse class="o" cx="200" cy="206" rx="112" ry="144"/>
    <path class="h" d="M146 138c18-24 64-34 96-12"/>
    <path class="h" d="M152 170c8-10 20-18 34-22"/>
    <path class="ls" d="M84 0v78M316 0v78"/>
    <path class="a" d="M66 78h36l-9 26H75zM298 78h36l-9 26h-18z"/>
    <path class="g" d="M84 104l-26 62h52zM316 104l-26 62h52z"/>
    <g transform="translate(200 352) rotate(-18)">
      <circle class="ls" cx="-30" cy="52" r="15"/><circle class="ls" cx="30" cy="52" r="15"/>
      <path class="ls" d="M-22 38L26-66M22 38L-26-66"/>
      <circle class="a" cx="0" cy="-2" r="4"/>
    </g>
    <path class="o" d="M120 396h160"/>`,

  cafe: `
    <circle class="g" cx="304" cy="96" r="64"/>
    <circle class="a" cx="304" cy="96" r="40"/>
    <ellipse class="s" cx="200" cy="364" rx="156" ry="28"/>
    <ellipse class="o" cx="200" cy="364" rx="156" ry="28"/>
    <path class="c" d="M116 226h168v52a84 84 0 0 1-168 0z"/>
    <path class="ls" d="M116 226h168v52a84 84 0 0 1-168 0z"/>
    <path class="ls" d="M284 244h20a30 30 0 0 1 0 60h-28"/>
    <ellipse class="a" cx="200" cy="226" rx="84" ry="13"/>
    <path class="h" d="M146 232c30 6 78 6 108 0"/>
    <path class="ls" d="M160 198c-16-22 16-36 0-60M200 192c-16-22 16-36 0-60M240 198c-16-22 16-36 0-60"/>
    <g transform="translate(70 318)"><path class="a" d="M0 30c4-34 40-46 64-26 20 18 16 44-2 52-30 12-58-2-62-26z"/><path class="h" d="M12 24c14-10 30-12 44-4M10 40c18-6 32-6 46 2"/></g>
    <g transform="translate(300 316)"><ellipse class="s" cx="26" cy="24" rx="28" ry="20"/><ellipse class="o" cx="26" cy="24" rx="28" ry="20"/><path class="o" d="M10 22c8 6 24 6 32 0"/></g>`,

  hantverk: `
    <g class="gr"><path d="M0 60h400M0 120h400M0 180h400M0 240h400M0 300h400M0 360h400M60 0v420M120 0v420M180 0v420M240 0v420M300 0v420M360 0v420"/></g>
    <path class="s" d="M80 380V236l120-92 120 92v144z"/>
    <path class="ls" d="M80 380V236l120-92 120 92v144z"/>
    <path class="ls" d="M60 244l140-108 140 108"/>
    <rect class="c" x="170" y="290" width="60" height="90" rx="4"/>
    <rect class="ls" x="170" y="290" width="60" height="90" rx="4"/>
    <rect class="c" x="102" y="262" width="44" height="44" rx="3"/><rect class="ls" x="102" y="262" width="44" height="44" rx="3"/>
    <rect class="c" x="254" y="262" width="44" height="44" rx="3"/><rect class="ls" x="254" y="262" width="44" height="44" rx="3"/>
    <path class="o" d="M124 262v44M102 284h44M276 262v44M254 284h44"/>
    <circle class="a" cx="216" cy="338" r="4"/>
    <path class="a" d="M60 408h280"/>
    <path class="o" d="M60 400v16M120 404v12M180 404v12M240 404v12M300 404v12M340 400v16"/>
    <g transform="translate(286 40) rotate(28)"><rect class="a" x="-8" y="0" width="16" height="108" rx="6"/><rect class="c" x="-34" y="-20" width="68" height="32" rx="7"/><rect class="ls" x="-34" y="-20" width="68" height="32" rx="7"/></g>`,

  butik: `
    <path class="g" d="M0 330h400v90H0z"/>
    <path class="o" d="M20 330h360"/>
    <g transform="translate(56 150)"><path class="s" d="M0 52h124l-10 168H10z"/><path class="ls" d="M0 52h124l-10 168H10z"/><path class="ls" d="M34 52c0-44 56-44 56 0"/><circle class="a" cx="62" cy="130" r="22"/></g>
    <g transform="translate(212 100)"><path class="a" d="M0 62h132l-12 198H12z"/><path class="ls" d="M0 62h132l-12 198H12z"/><path class="c" d="M38 62c0-54 56-54 56 0" /><path class="ls" d="M38 62c0-54 56-54 56 0"/><path class="h" d="M26 120h80M30 150h72"/></g>
    <g transform="translate(300 296)"><rect class="c" x="0" y="0" width="68" height="46" rx="6"/><rect class="ls" x="0" y="0" width="68" height="46" rx="6"/><path class="a" d="M0 16h68"/></g>
    <circle class="g" cx="70" cy="70" r="30"/><circle class="a" cx="70" cy="70" r="12"/>`,

  halsa: `
    <circle class="g" cx="200" cy="210" r="168"/>
    <circle class="s" cx="200" cy="210" r="124"/>
    <circle class="o" cx="200" cy="210" r="124"/>
    <circle class="o" cx="200" cy="210" r="86"/>
    <path class="a" d="M200 324c-60-24-96-84-96-136 0-40 40-60 74-34 10 8 18 20 22 34 4-14 12-26 22-34 34-26 74-6 74 34 0 52-36 112-96 136z" transform="translate(0 -40) scale(1 .9) translate(0 40)"/>
    <path class="h" d="M150 190c12-24 38-30 56-10"/>
    <path class="ls" d="M96 360c28-24 56-24 84 0s56 24 84 0 56-24 84 0"/>
    <g transform="translate(300 70) rotate(24)"><path class="a" d="M0 0c40 6 64 40 56 84C20 84-6 58 0 0z"/><path class="h" d="M6 6c16 24 30 48 44 74"/></g>`,

  tjanst: `
    <rect class="s" x="48" y="96" width="304" height="236" rx="22"/>
    <rect class="ls" x="48" y="96" width="304" height="236" rx="22"/>
    <path class="o" d="M48 148h304"/>
    <circle class="a" cx="78" cy="122" r="7"/><circle class="o" cx="102" cy="122" r="7"/><circle class="o" cx="126" cy="122" r="7"/>
    <rect class="a" x="88" y="250" width="40" height="52" rx="6"/>
    <rect class="a" x="148" y="214" width="40" height="88" rx="6"/>
    <rect class="a" x="208" y="236" width="40" height="66" rx="6"/>
    <rect class="a" x="268" y="184" width="40" height="118" rx="6"/>
    <path class="ls" d="M88 192l60-26 60 14 100-52"/>
    <circle class="c" cx="308" cy="128" r="30"/><circle class="ls" cx="308" cy="128" r="30"/>
    <path class="ls" d="M296 128l9 9 16-18"/>
    <circle class="g" cx="338" cy="52" r="34"/><circle class="a" cx="64" cy="372" r="18"/>`,
};

export function sceneSvg(industry) {
  const body = SCENES[industry] || SCENES.tjanst;
  return `<svg class="pv-scene" viewBox="0 0 400 420" aria-hidden="true" focusable="false">${body}</svg>`;
}
