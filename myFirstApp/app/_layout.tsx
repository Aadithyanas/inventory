import { Tabs, router } from "expo-router";
import { Text, TouchableOpacity, Modal, View, StyleSheet, DeviceEventEmitter } from "react-native";
import { useState, useEffect } from "react";
import { getToken, removeToken } from "../services/storageService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from '@expo/vector-icons';

export default function Layout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const checkLogin = async () => {
    const token = await getToken();
    setIsLoggedIn(!!token);
  };

  useEffect(() => {
    checkLogin();
    const subscription = DeviceEventEmitter.addListener("refreshAuth", () => {
      checkLogin();
    });
    return () => subscription.remove();
  }, []);

  const handleLogout = async () => {
    await removeToken();
    setIsLoggedIn(false);
    setMenuVisible(false);
    router.replace("/auth/login");
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#2563EB",
          headerTitle: "Smart Inventory",
          headerRight: () => (
            isLoggedIn ? (
              <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                style={styles.avatarBtn}
              >
                <Text style={{ fontSize: 18 }}>👤</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={{
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                    borderRadius: 12,
                    marginRight: 15,
                    alignItems: "center"
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ color: '#FFF', fontWeight: '600', marginRight: 6 }}>
                      Login
                    </Text>
                    <Feather name="user" size={18} color="#FFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )
          )
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />
          }}
        />
        
        <Tabs.Screen
          name="product"
          options={{
            title: "Products",
            tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />
          }}
        />
        
        <Tabs.Screen
          name="camera"
          options={{
            title: "Scan",
            tabBarIcon: ({ color, size }) => <Ionicons name="scan-outline" size={size} color={color} />
          }}
        />
        
        <Tabs.Screen
          name="analytics"
          options={{
            title: "Analytics",
            tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />
          }}
        />
        
        <Tabs.Screen name="auth" options={{ href: null }} />
      </Tabs>

      <Modal transparent visible={menuVisible} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                router.push("/profile");
              }}
              style={styles.menuItem}
            >
              <Text style={styles.menuText}>👤 Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              style={styles.menuItem}
            >
              <Text style={{ color: "#EF4444", fontWeight: '500' }}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatarBtn: {
    marginRight: 20,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 90,
    paddingRight: 20
  },
  menuBox: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingVertical: 10,
    width: 160,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  menuItem: {
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9'
  },
  menuText: {
    color: '#1E293B',
    fontWeight: '500'
  }
});