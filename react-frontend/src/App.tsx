import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './app/store';
import { theme } from './theme/theme';
import { AppRoutes } from './routes';
import AuthInitializer from './components/auth/AuthInitializer';
import './index.css';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AuthInitializer />
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;


