import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';

export default function TabLayout() {
  const { bottom } = useSafeAreaInsets();
  const colors = useTheme();

  const paddingBottom = Platform.OS === 'ios' ? Math.max(bottom, 20) : Math.max(bottom + 8, 12);
  const tabBarHeight  = Platform.OS === 'ios' ? Math.max(bottom + 56, 82) : Math.max(bottom + 64, 76);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom,
          height: tabBarHeight,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="book" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <Feather name="pie-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color }) => <Feather name="target" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
