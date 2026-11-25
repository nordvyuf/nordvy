// Förrendering: sidan blir färdig HTML vid bygget, så den syns direkt och fungerar för sökmotorer.
import { renderToString } from 'react-dom/server';
import App from './App.jsx';
export { DRAFT } from './data.js';

export const render = () => renderToString(<App />);
