import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    DeviceEventEmitter,
    StyleSheet
} from "react-native";
import { router } from "expo-router";
import { loginUser } from "../../services/authService";
import { saveToken } from "../../services/storageService";
import { LinearGradient } from "expo-linear-gradient";


export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter email and password");
            return;
        }

        try {
            setLoading(true);
            const res = await loginUser({ email, password });
            await saveToken(res.data.token);

            DeviceEventEmitter.emit("refreshAuth");
            Alert.alert("Success", res.data.message || "Login success");
            router.replace("/");

        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
            <View style={styles.container}>


                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Login to your inventory account</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="your.email@example.com"
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={loading}
                        style={{ opacity: loading ? 0.6 : 1 }}
                    >

                        <LinearGradient
                            colors={['#3B82F6', '#2563EB']}
                            style={{
                                padding: 18,
                                borderRadius: 12,
                                alignItems: "center"
                            }}
                        >
                            <Text style={{
                                color: '#FFF',
                                fontSize: 16,
                                fontWeight: 'bold'
                            }}>
                                {loading ? "Logging in..." : "Login"}
                            </Text>
                        </LinearGradient>

                    </TouchableOpacity>


                    {/* ⭐ ADDED SIGNUP PROMPT ⭐ */}
                    <View style={styles.divider}>
                        <View style={styles.line} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.line} />
                    </View>

                    <TouchableOpacity
                        style={styles.signupPrompt}
                        onPress={() => router.push("/auth/signup")}
                    >
                        <Text style={styles.signupText}>
                            Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 60 },
    title: { fontSize: 32, fontWeight: "bold", color: "#0F172A", marginBottom: 8 },
    subtitle: { fontSize: 16, color: "#64748B", marginBottom: 40 },
    form: { gap: 20 },
    label: { fontSize: 14, fontWeight: "600", color: "#0F172A", marginBottom: -12 },
    input: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: "#0F172A"
    },
    loginButton: {
        backgroundColor: "#38BDF8",
        padding: 18,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10
    },
    loginButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
    line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    dividerText: { color: '#94A3B8', paddingHorizontal: 16, fontSize: 14 },
    signupPrompt: { alignItems: 'center', paddingVertical: 10 },
    signupText: { color: '#64748B', fontSize: 14 },
    signupLink: { color: '#2563EB', fontWeight: 'bold' },
});