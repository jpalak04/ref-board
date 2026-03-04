import { Tabs } from 'expo-router';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../src/constants/theme';
import { useRouter } from 'expo-router';

function TabBarButton({
  children,
  onPress,
  accessibilityState,
}: any) {
  const focused = accessibilityState?.selected;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabBtn, focused && styles.tabBtnActive]}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { paddingBottom: insets.bottom + 4 },
        ],
        tabBarActiveTintColor: colors.lime,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Board',
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size - 2} color={color} />
          ),
          tabBarButton: (props) => <TabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Save',
          tabBarIcon: ({ color }) => (
            <View
              testID="add-tab-btn"
              style={[
                styles.addBtn,
                { backgroundColor: colors.lime },
              ]}
            >
              <Feather name="plus" size={22} color={colors.textInverse} />
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              style={styles.addTabBtn}
              activeOpacity={0.85}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, size }) => (
            <Feather name="folder" size={size - 2} color={color} />
          ),
          tabBarButton: (props) => <TabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Team',
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size - 2} color={color} />
          ),
          tabBarButton: (props) => <TabBarButton {...props} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(26,26,26,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    height: 60,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: 'rgba(26,26,26,0.97)',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabBtnActive: {},
  tabLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    marginTop: 2,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: colors.lime,
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
      web: {},
    }),
  },
  addTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
