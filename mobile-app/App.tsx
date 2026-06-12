import React from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthInitializer } from './src/components/AuthInitializer';

export default function App() {
  return (
    <Provider store={store}>
      <AuthInitializer>
      <AppNavigator />
      </AuthInitializer>
    </Provider>
  );
}
