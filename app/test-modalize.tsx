import React, { useRef } from "react";
import { View, Button, Text } from "react-native";
import { Modalize } from "react-native-modalize";

export default function TestModalize() {
	const modalRef = useRef(null);

	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<Button
				title="Open Modal"
				onPress={() => modalRef.current?.open()}
			/>
			<Modalize
				ref={modalRef}
				adjustToContentHeight
			>
				<View style={{ padding: 30, alignItems: "center" }}>
					<Text style={{ fontSize: 20 }}>It works! 🚀</Text>
				</View>
			</Modalize>
		</View>
	);
}
