import './App.css';

import { ChessUX } from './components/chess';

// these styles must be imported somewhere
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";


function App() {
  return (
    <div className="App">
      <header className="App-header">        
        <ChessUX />
      </header>
    </div>
  );
}

export default App;
