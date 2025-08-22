import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { styles } from "@/app/dashboard.styles";

export type ProfileRowProps = {
	data: any;
	copyToClipboard: () => void;
	handleLogout: () => void;
	truncateAddress: (address: string | undefined | null) => string;
};

export default function ProfileRow({
	data,
	copyToClipboard,
	handleLogout,
	truncateAddress,
}: ProfileRowProps) {
	const router = useRouter();

	return (
		<View style={styles.profileRow}>
			<View style={styles.iconRow}>
				<Image
					source={{
						uri: "https://rvpptly5bhkny5oc.public.blob.vercel-storage.com/Proof%20of%20Work",
					}}
					style={styles.logo}
					resizeMode="contain"
				/>
				{data?.bech32Address && (
					<TouchableOpacity
						style={styles.walletBadge}
						onPress={copyToClipboard}
					>
						<Text style={styles.walletText}>
							{truncateAddress(data.bech32Address)}
						</Text>
						<MaterialIcons
							name="content-copy"
							size={14}
							color="#191919"
							style={{ marginLeft: 5 }}
						/>
					</TouchableOpacity>
				)}
			</View>
			<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
				<TouchableOpacity onPress={() => router.push("/zktls-demo")}>
					<MaterialIcons
						name="shield"
						size={20}
						color="#007AFF"
						style={{ marginTop: -15 }}
					/>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => router.push("./treasury-management" as any)}
				>
					<MaterialIcons
						name="account-balance"
						size={20}
						color="#64748B"
						style={{ marginTop: -15 }}
					/>
				</TouchableOpacity>
				<TouchableOpacity onPress={handleLogout}>
					<MaterialIcons
						name="logout"
						size={20}
						color="#64748B"
						style={{ marginTop: -15 }}
					/>
				</TouchableOpacity>
			</View>
		</View>
	);
}
