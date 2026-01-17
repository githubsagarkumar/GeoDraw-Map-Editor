import { Map } from './components/Map';
import { Toolbar } from './components/Toolbar';
import { ErrorToast } from './components/ErrorToast';
import { ExportButton } from './components/ExportButton';
import './App.css';

function App() {
  return (
    <div className="app">
      <Toolbar />
      <div className="map-container">
        <Map />
      </div>
      <ErrorToast />
      <ExportButton />
    </div>
  );
}

export default App;
