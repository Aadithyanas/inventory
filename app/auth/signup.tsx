import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { signupUser } from "../../services/authService";
import { LinearGradient } from "expo-linear-gradient";


export default function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        try {
            setLoading(true);
            const res = await signupUser({ name, email, password });
            Alert.alert("Success", res.data.message || "Account created!");
            router.push("/auth/login");
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <View style={styles.container}>

                <Text style={styles.title}>Create Account </Text>
                <Text style={styles.subtitle}>Join Smart Inventory AI today</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor="#94A3B8"
                        value={name}
                        onChangeText={setName}
                    />

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
                        placeholder="Create a strong password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity
                        onPress={handleSignup}
                        disabled={loading}
                        style={{ opacity: loading ? 0.6 : 1 }}
                    >

                        <LinearGradient
                            colors={['#3B82F6', '#2563EB']}
                            style={{
                                padding: 18,
                                borderRadius: 12,
                                alignItems: "center",
                                marginTop: 10
                            }}
                        >
                            <Text style={{
                                color: '#FFF',
                                fontSize: 16,
                                fontWeight: 'bold'
                            }}>
                                {loading ? "Creating Account..." : "Create Account"}
                            </Text>
                        </LinearGradient>

                    </TouchableOpacity>


                    <View style={styles.divider}>
                        <View style={styles.line} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.line} />
                    </View>

                    <TouchableOpacity
                        style={styles.loginPrompt}
                        onPress={() => router.push("/auth/login")}
                    >
                        <Text style={styles.loginText}>
                            Already have an account? <Text style={styles.loginLink}>Login</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 60 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#64748B', marginBottom: 40 },
    form: { gap: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: -12 },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#0F172A'
    },
    signupButton: {
        backgroundColor: '#38BDF8',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10
    },
    signupButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
    line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    dividerText: { color: '#94A3B8', paddingHorizontal: 16, fontSize: 14 },
    loginPrompt: { alignItems: 'center', paddingVertical: 10 },
    loginText: { color: '#64748B', fontSize: 14 },
    loginLink: { color: '#2563EB', fontWeight: 'bold' },
});