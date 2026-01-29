import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';
import { NotificationAlertBanner } from './src/components/common/NotificationAlert';
import { initializeDatabase } from './src/db';

// Note: Background handler is set up in index.js before AppRegistry

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [dbReady, setDbReady] = useState(false);

  // Initialize database on app start
  useEffect(() => {
    initializeDatabase()
      .then(() => setDbReady(true))
      .catch((err) => console.error('Failed to initialize database:', err));
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <RootNavigator />
        <NotificationAlertBanner />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
