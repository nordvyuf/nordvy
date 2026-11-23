// Förrendering: sidan blir färdig HTML vid bygget, så den syns direkt och fungerar för sökmotorer.
import { renderToString } from 'react-dom/server';
import App from './App.jsx';

export const render = () => renderToString(<App />);
