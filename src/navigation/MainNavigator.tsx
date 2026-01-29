import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import JobsNavigator from './JobsNavigator';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { UI } from '../constants';
import type { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function JobsIcon({ focused }: { focused: boolean }): React.JSX.Element {
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Text style={[styles.iconText, focused && styles.iconTextFocused]}>J</Text>
    </View>
  );
}

function SettingsIcon({ focused }: { focused: boolean }): React.JSX.Element {
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Text style={[styles.iconText, focused && styles.iconTextFocused]}>S</Text>
    </View>
  );
}

export default function MainNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: UI.COLORS.primary,
        tabBarInactiveTintColor: UI.COLORS.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Jobs"
        component={JobsNavigator}
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: JobsIcon,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: SettingsIcon,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: UI.COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: UI.COLORS.border,
    paddingTop: UI.SPACING.xs,
    height: 60,
  },
  tabBarLabel: {
    fontSize: UI.FONT_SIZE.xs,
    marginBottom: UI.SPACING.xs,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: UI.BORDER_RADIUS.full,
    backgroundColor: UI.COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconFocused: {
    backgroundColor: UI.COLORS.primary,
  },
  iconText: {
    fontSize: UI.FONT_SIZE.sm,
    fontWeight: '600',
    color: UI.COLORS.textSecondary,
  },
  iconTextFocused: {
    color: UI.COLORS.textLight,
  },
});
