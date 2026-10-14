import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
const { ipcRenderer } = window.require('electron');
import './styles/App.css';

// Import components
import DMWindow from './components/DMWindow';
import PlayerWindow from './components/PlayerWindow';

function App() {
  const [windowType, setWindowType] = useState('dm');

  useEffect(() => {
    // Determine which window this is based on the HTML file
    if (window.location.pathname.includes('player.html')) {
      setWindowType('player');
    } else {
      setWindowType('dm');
    }
  }, []);

  if (windowType === 'dm') {
    return <DMWindow />;
  } else {
    return <PlayerWindow />;
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
