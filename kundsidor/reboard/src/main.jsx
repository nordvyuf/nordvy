import { hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// ?utan-foton visar platshållarna i stället för fotona, så att vi kan jämföra.
if (new URLSearchParams(location.search).has('utan-foton')) document.documentElement.classList.add('nophoto');

hydrateRoot(document.getElementById('app'), <App />);
