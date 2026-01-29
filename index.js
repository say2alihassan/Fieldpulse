/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { setupBackgroundHandler } from './src/services/notifications';

// Set up background notification handler - must be called before AppRegistry
setupBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);
